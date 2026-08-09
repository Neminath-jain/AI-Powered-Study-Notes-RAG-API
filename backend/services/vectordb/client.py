import uuid
from typing import List, Dict, Any, Optional
# pyrefly: ignore [missing-import]
from qdrant_client import QdrantClient
# pyrefly: ignore [missing-import]
from qdrant_client.models import (
    Distance, VectorParams, PointStruct, Filter, FieldCondition,
    MatchValue, MatchAny, PayloadSchemaType, FilterSelector
)
from backend.core.config import settings
from backend.core.logging import logger
from backend.services.chunking.schemas import Chunk

class QdrantVectorDBClient:
    _instance = None
    _lock = threading_lock = None

    def __new__(cls, *args, **kwargs):
        if not cls._instance:
            import threading
            cls._lock = threading.Lock()
            with cls._lock:
                if not cls._instance:
                    cls._instance = super(QdrantVectorDBClient, cls).__new__(cls, *args, **kwargs)
        return cls._instance

    def __init__(self):
        # Prevent re-initialization
        if hasattr(self, "client"):
            return
            
        logger.info("Connecting to Qdrant Vector Database...")
        self.client = QdrantClient(url=settings.QDRANT_URL, api_key=settings.QDRANT_API_KEY)
        self.collection_name = settings.QDRANT_COLLECTION_NAME
        self.create_collection()

    def create_collection(self):
        """Creates the target collection in Qdrant if it does not already exist, and ensures payload indexes exist."""
        try:
            collections = self.client.get_collections().collections
            names = [c.name for c in collections]
            if self.collection_name not in names:
                self.client.create_collection(
                    collection_name=self.collection_name,
                    # all-MiniLM-L6-v2 vectors are size 384
                    vectors_config=VectorParams(size=384, distance=Distance.COSINE),
                )
                logger.info(f"Qdrant collection created: {self.collection_name}")
            else:
                logger.info(f"Qdrant collection already exists: {self.collection_name}")

            # Ensure payload indexes exist for user_id and note_id filtering
            try:
                self.client.create_payload_index(
                    collection_name=self.collection_name,
                    field_name="user_id",
                    field_schema=PayloadSchemaType.KEYWORD,
                )
                self.client.create_payload_index(
                    collection_name=self.collection_name,
                    field_name="note_id",
                    field_schema=PayloadSchemaType.KEYWORD,
                )
                self.client.create_payload_index(
                    collection_name=self.collection_name,
                    field_name="page",
                    field_schema=PayloadSchemaType.INTEGER,
                )
                logger.info("Payload indexes for user_id, note_id, and page verified.")
            except Exception as idx_err:
                logger.info("Payload index setup info", details=str(idx_err))

        except Exception as e:
            logger.error("Failed to check/create Qdrant collection", error=str(e))
            raise ConnectionError(f"Vector DB collection creation failed: {e}") from e

    async def upsert_chunks(
        self,
        user_id: uuid.UUID,
        note_id: uuid.UUID,
        chunks: List[Chunk],
        embeddings: List[List[float]]
    ):
        """Batches and upserts chunk vectors and payload metadata into Qdrant."""
        if not chunks or not embeddings:
            return

        import asyncio
        points = []
        for i, chunk in enumerate(chunks):
            # We generate a unique UUID for each point based on document ID and chunk index
            point_id = str(uuid.uuid5(uuid.NAMESPACE_DNS, f"{note_id}_{chunk.chunk_index}"))
            points.append(
                PointStruct(
                    id=point_id,
                    vector=embeddings[i],
                    payload={
                        "note_id": str(note_id),
                        "user_id": str(user_id),
                        "page": chunk.page_number,
                        "text": chunk.text,
                        "char_start": chunk.char_start,
                        "char_end": chunk.char_end,
                        "figures": chunk.figures or [],
                    }
                )
            )

        # Batch upsert points in background thread
        batch_size = 64
        def _sync_upsert():
            for offset in range(0, len(points), batch_size):
                batch = points[offset:offset + batch_size]
                self.client.upsert(collection_name=self.collection_name, points=batch)

        await asyncio.to_thread(_sync_upsert)
        logger.info(f"Successfully upserted {len(points)} vectors for note {note_id}")

    async def delete_chunks_by_note(self, note_id: uuid.UUID):
        """Deletes all point vectors associated with a specific note ID."""
        try:
            import asyncio
            def _sync_delete():
                self.client.delete(
                    collection_name=self.collection_name,
                    points_selector=FilterSelector(
                        filter=Filter(
                            must=[
                                FieldCondition(
                                    key="note_id",
                                    match=MatchValue(value=str(note_id))
                                )
                            ]
                        )
                    )
                )
            await asyncio.to_thread(_sync_delete)
            logger.info(f"Deleted vector points associated with note: {note_id}")
        except Exception as e:
            logger.error("Failed to delete points from Qdrant", error=str(e))
            raise

    async def delete_points(self, point_ids: List[str]):
        """Deletes a list of specific vector points by ID."""
        try:
            import asyncio
            def _sync_delete():
                self.client.delete(
                    collection_name=self.collection_name,
                    points_selector=point_ids
                )
            await asyncio.to_thread(_sync_delete)
        except Exception as e:
            logger.error("Failed to delete point list from Qdrant", error=str(e))
            raise

    async def search_similar(
        self,
        user_id: uuid.UUID,
        query_vector: List[float],
        note_ids: Optional[List[uuid.UUID]] = None,
        top_k: int = 5
    ) -> List[Dict[str, Any]]:
        """
        Queries Qdrant for similar chunks.
        Strict Namespace Filter: Appends user_id filter payload query constraint server-side.
        """
        import asyncio
        must_conditions = [
            FieldCondition(
                key="user_id",
                match=MatchValue(value=str(user_id))
            )
        ]

        if note_ids:
            must_conditions.append(
                FieldCondition(
                    key="note_id",
                    match=MatchAny(any=[str(nid) for nid in note_ids])
                )
            )

        query_filter = Filter(must=must_conditions)

        try:
            def _sync_search():
                return self.client.search(
                    collection_name=self.collection_name,
                    query_vector=query_vector,
                    query_filter=query_filter,
                    limit=top_k,
                    with_payload=True
                )
            hits = await asyncio.to_thread(_sync_search)
            
            results = []
            for hit in hits:
                results.append({
                    "note_id": uuid.UUID(hit.payload["note_id"]),
                    "page": hit.payload["page"],
                    "text": hit.payload["text"],
                    "score": hit.score,
                    "char_start": hit.payload.get("char_start", 0),
                    "char_end": hit.payload.get("char_end", 0),
                    "figures": hit.payload.get("figures", []),
                })
            return results
        except Exception as e:
            logger.error("Similarity search failed in Qdrant", error=str(e))
            raise

    async def get_chunks_by_pages(
        self,
        note_id: uuid.UUID,
        pages: List[int]
    ) -> List[Dict[str, Any]]:
        """Retrieves chunks for specific note ID and page numbers to fill context gaps."""
        if not pages:
            return []
        import asyncio
        query_filter = Filter(
            must=[
                FieldCondition(key="note_id", match=MatchValue(value=str(note_id))),
                FieldCondition(key="page", match=MatchAny(any=pages))
            ]
        )
        try:
            def _sync_scroll():
                points, _ = self.client.scroll(
                    collection_name=self.collection_name,
                    scroll_filter=query_filter,
                    limit=len(pages) * 5,
                    with_payload=True,
                    with_vectors=False
                )
                return points
            hits = await asyncio.to_thread(_sync_scroll)
            results = []
            for hit in hits:
                results.append({
                    "note_id": uuid.UUID(hit.payload["note_id"]),
                    "page": hit.payload["page"],
                    "text": hit.payload["text"],
                    "score": 0.25,
                    "char_start": hit.payload.get("char_start", 0),
                    "char_end": hit.payload.get("char_end", 0),
                    "figures": hit.payload.get("figures", []),
                })
            return results
        except Exception as e:
            logger.warning("Failed to fetch gap-filled page chunks", error=str(e))
            return []
            
# Expose singleton
vectordb_client = QdrantVectorDBClient()
