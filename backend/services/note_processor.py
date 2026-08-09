import uuid
from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession
from backend.core.database import db_session
from backend.repositories.note import NoteRepository
from backend.models.models import Note, NoteStatus, DocumentMetadata
from backend.services.pdf.storage import get_pdf_storage_service
from backend.services.pdf.extractor import extract_pages, prepare_text_for_chunking
from backend.services.chunking.splitter import split_page_text
from backend.services.embeddings.client import embedding_service
from backend.services.vectordb.client import vectordb_client
from backend.core.logging import logger

class NoteProcessorService:
    def __init__(self, db: Optional[AsyncSession] = None):
        self.db = db
        self.storage = get_pdf_storage_service()

    async def process_note(self, note_id: uuid.UUID):
        """Processes the PDF note in a dedicated DB session: extracts text, cleans it, chunks it, generates embeddings, and indexes it."""
        async with db_session() as session:
            note_repo = NoteRepository(session)
            note = await note_repo.get_by_id(note_id)
            if not note:
                logger.error("Note not found for processing", note_id=str(note_id))
                return

            try:
                logger.info("Executing note processing RAG pipeline...", note_id=str(note.id), title=note.title)
                
                # Update status to PROCESSING
                note.status = NoteStatus.PROCESSING
                await note_repo.update(note)

                # 1. Download file content from storage
                pdf_bytes = await self.storage.download_file(note.storage_path)
                file_size_bytes = len(pdf_bytes)

                # 2. Extract pages raw text & embedded figures
                pages = extract_pages(pdf_bytes, note_id=str(note.id))
                total_pages = len(pages)

                # 3. Clean and prepare text for chunking
                prepared_pages = prepare_text_for_chunking(pages)
                total_chars = sum(len(p["cleaned_text"]) for p in prepared_pages)

                # 4. Generate chunks using custom RecursiveCharacterTextSplitter
                all_chunks = []
                chunk_index = 0
                for page_item in prepared_pages:
                    page_chunks = split_page_text(
                        page_text=page_item["cleaned_text"],
                        document_id=note.id,
                        page_number=page_item["page"],
                        start_chunk_index=chunk_index,
                        figures=page_item.get("figures", [])
                    )
                    all_chunks.extend(page_chunks)
                    chunk_index += len(page_chunks)

                if not all_chunks:
                    raise ValueError("No processable academic text found in PDF document.")

                # 5 & 6. Process chunks in sub-batches of 24 to keep memory overhead under 150MB
                batch_size = 24
                for i in range(0, len(all_chunks), batch_size):
                    chunk_batch = all_chunks[i:i + batch_size]
                    chunk_texts = [c.text for c in chunk_batch]
                    embeddings = embedding_service.embed_texts(chunk_texts)

                    await vectordb_client.upsert_chunks(
                        user_id=note.user_id,
                        note_id=note.id,
                        chunks=chunk_batch,
                        embeddings=embeddings
                    )

                # 7. Create DocumentMetadata DB records
                meta = DocumentMetadata(
                    note_id=note.id,
                    total_pages=total_pages,
                    total_chars=total_chars,
                    file_size_bytes=file_size_bytes
                )
                await note_repo.create_metadata(meta)

                # 8. Mark Note as COMPLETED
                note.status = NoteStatus.COMPLETED
                await note_repo.update(note)
                logger.info("Successfully finished note index execution.", note_id=str(note.id))

            except Exception as e:
                logger.exception("RAG indexing task pipeline failed", note_id=str(note_id), error=str(e))
                note.status = NoteStatus.FAILED
                note.error_message = str(e)
                await note_repo.update(note)
                
                # Cleanup Qdrant vectors to avoid partial indexing pollution
                try:
                    await vectordb_client.delete_chunks_by_note(note.id)
                except Exception as cleanup_err:
                    logger.error("Failed to cleanup vectors on indexing failure", error=str(cleanup_err))
