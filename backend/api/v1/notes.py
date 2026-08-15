import os
import uuid
from typing import List
from fastapi import APIRouter, Depends, UploadFile, File, BackgroundTasks, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from backend.core.database import get_db
from backend.api.v1.auth import get_current_user
from backend.models.models import User, Note, NoteStatus
from backend.repositories.note import NoteRepository
from backend.schemas.notes import NoteResponse, NoteRenameRequest
from backend.services.pdf.storage import get_pdf_storage_service
from backend.services.vectordb.client import vectordb_client
from backend.services.note_processor import NoteProcessorService
from backend.core.exceptions import NotFoundException, ValidationException
from backend.core.rate_limit import rate_limit
from backend.core.logging import logger

router = APIRouter(prefix="/notes", tags=["notes"])

@router.post(
    "/upload", 
    response_model=NoteResponse, 
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(rate_limit(requests_per_minute=10))]  # 10 uploads per minute limit
)
async def upload_note(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Accepts PDF upload, saves it to storage, creates a database Note record,
    and runs the background indexing RAG pipeline.
    """
    if not file or not file.filename or not file.filename.lower().endswith(".pdf"):
        raise ValidationException("Only PDF documents are supported.")

    # 1. Size verification
    contents = await file.read()
    if len(contents) > 25 * 1024 * 1024:  # 25 MB cap
        raise ValidationException("File size exceeds the 25MB limit.")

    # 2. Upload raw file with sanitized filename
    safe_filename = os.path.basename(file.filename)
    storage_service = get_pdf_storage_service()
    filename = f"{current_user.id}/{uuid.uuid4()}_{safe_filename}"
    storage_path = await storage_service.upload_file(contents, filename)

    # 3. Create Note record
    note_repo = NoteRepository(db)
    new_note = Note(
        user_id=current_user.id,
        title=safe_filename,
        storage_path=storage_path,
        status=NoteStatus.PROCESSING,
    )
    saved_note = await note_repo.add(new_note)

    # 4. Trigger background processor task
    processor = NoteProcessorService()
    background_tasks.add_task(processor.process_note, saved_note.id)

    return saved_note

@router.get("/", response_model=List[NoteResponse])
async def list_notes(
    background_tasks: BackgroundTasks,
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """List all active notes uploaded by the current student (paginated)."""
    note_repo = NoteRepository(db)
    notes = await note_repo.get_by_user(current_user.id, skip=skip, limit=limit)

    # Auto-recover stuck processing notes (e.g. if server restarted during initial upload)
    from datetime import datetime, timezone, timedelta
    now = datetime.now(timezone.utc)
    processor = NoteProcessorService()

    for note in notes:
        if note.status == NoteStatus.PROCESSING:
            created_at = note.created_at
            if created_at.tzinfo is None:
                created_at = created_at.replace(tzinfo=timezone.utc)
            if now - created_at > timedelta(minutes=2):
                logger.info("Auto-restarting stuck note processing task", note_id=str(note.id))
                background_tasks.add_task(processor.process_note, note.id)

    return notes

@router.post("/{note_id}/retry", response_model=NoteResponse)
async def retry_note_processing(
    note_id: uuid.UUID,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Re-enqueues note indexing for failed or stuck processing notes."""
    note_repo = NoteRepository(db)
    note = await note_repo.get_by_id(note_id)
    if not note or note.user_id != current_user.id:
        raise NotFoundException("Note not found")

    note.status = NoteStatus.PROCESSING
    note.error_message = None
    saved_note = await note_repo.update(note)

    processor = NoteProcessorService()
    background_tasks.add_task(processor.process_note, saved_note.id)
    return saved_note

@router.get("/search", response_model=List[NoteResponse])
async def search_notes(
    q: str = Query(..., min_length=1),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Search user's notes by title matching query string."""
    query = (
        select(Note)
        .where(
            Note.user_id == current_user.id,
            Note.deleted_at.is_(None),
            Note.title.ilike(f"%{q}%")
        )
    )
    result = await db.execute(query)
    return list(result.scalars().all())

@router.patch("/{note_id}", response_model=NoteResponse)
async def rename_note(
    note_id: uuid.UUID,
    body: NoteRenameRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Renames an existing note title."""
    note_repo = NoteRepository(db)
    note = await note_repo.get_by_id(note_id)
    if not note or note.user_id != current_user.id:
        raise NotFoundException("Note not found")
        
    note.title = body.title
    return await note_repo.update(note)

@router.delete("/{note_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_note(
    note_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Soft deletes the note, cleans storage assets and vector stores."""
    note_repo = NoteRepository(db)
    note = await note_repo.get_by_id(note_id)
    if not note or note.user_id != current_user.id:
        raise NotFoundException("Note not found")

    # 1. Clean vectors from Qdrant immediately
    await vectordb_client.delete_chunks_by_note(note_id)

    # 2. Soft delete record in DB
    await note_repo.delete(note_id)

    # 3. Clean files from Storage
    try:
        storage_service = get_pdf_storage_service()
        await storage_service.delete_file(note.storage_path)
    except Exception as e:
        logger.error("Failed to delete raw storage PDF file", path=note.storage_path, error=str(e))
