import uuid
from typing import List, Dict, Any, Optional
from qdrant_client import QdrantClient
from qdrant_client.models import Distance, VectorParams, PointStruct
from backend.services.embeddings.client import embedding_service
from backend.core.config import settings
from backend.core.logging import logger

class QdrantService:
    _instance: Optional["QdrantService"] = None

    def __new__(cls, *args, **kwargs):
        if not cls._instance:
            cls._instance = super(QdrantService, cls).__new__(cls, *args, **kwargs)
        return cls._instance

    def __init__(self):
        # Prevent re-initialization if already initialized
        if hasattr(self, "client"):
            return
            
        logger.info("Initializing Qdrant client...")
        self.client = QdrantClient(url=settings.QDRANT_URL, api_key=settings.QDRANT_API_KEY)
        self.collection_name = settings.QDRANT_COLLECTION_NAME
        self._ensure_collection_exists()

    def _ensure_collection_exists(self):
        try:
            collections = self.client.get_collections().collections
            collection_names = [c.name for c in collections]
            if self.collection_name not in collection_names:
                # sentence-transformers/all-MiniLM-L6-v2 yields 384 dimensions
                self.client.create_collection(
                    collection_name=self.collection_name,
                    vectors_config=VectorParams(size=384, distance=Distance.COSINE),
                )
                logger.info(f"Created Qdrant collection: {self.collection_name}")
        except Exception as e:
            logger.error("Failed to connect or create Qdrant collection", error=str(e))

    def generate_embeddings(self, texts: List[str]) -> List[List[float]]:
        """Generates embedding vectors for a list of text strings using lazy embedding service."""
        return embedding_service.embed_texts(texts)

    async def upsert_chunks(self, note_id: uuid.UUID, user_id: uuid.UUID, chunks: List[Dict[str, Any]]):
        """Vectorizes and upserts note text chunks into Qdrant."""
        if not chunks:
            return
            
        texts = [c["text"] for c in chunks]
        embeddings = self.generate_embeddings(texts)
        
        points = []
        for i, chunk in enumerate(chunks):
            point_id = str(uuid.uuid5(uuid.NAMESPACE_DNS, f"{note_id}_{i}"))
            points.append(
                PointStruct(
                    id=point_id,
                    vector=embeddings[i],
                    payload={
                        "note_id": str(note_id),
                        "user_id": str(user_id),
                        "page": chunk["page"],
                        "text": chunk["text"],
                    },
                )
            )
            
        self.client.upsert(collection_name=self.collection_name, points=points)
        logger.info(f"Upserted {len(points)} chunks for note {note_id} in Qdrant.")

    async def search_similar_chunks(
        self,
        user_id: uuid.UUID,
        query: str,
        note_ids: Optional[List[uuid.UUID]] = None,
        top_k: int = 5,
    ) -> List[Dict[str, Any]]:
        """Queries Qdrant for similar chunks matching the query string, scoped by user_id."""
        query_vector = self.generate_embeddings([query])[0]
        
        # Build filter conditions
        must_conditions = [
            {"key": "user_id", "match": {"value": str(user_id)}}
        ]
        
        if note_ids:
            must_conditions.append(
                {"key": "note_id", "match": {"any": [str(nid) for nid in note_ids]}}
            )
            
        search_result = self.client.search(
            collection_name=self.collection_name,
            query_vector=query_vector,
            query_filter={"must": must_conditions},
            limit=top_k,
            with_payload=True,
        )
        
        results = []
        for hit in search_result:
            results.append(
                {
                    "note_id": uuid.UUID(hit.payload["note_id"]),
                    "page": hit.payload["page"],
                    "text": hit.payload["text"],
                    "score": hit.score,
                }
            )
        return results

    async def delete_chunks_by_note(self, note_id: uuid.UUID):
        """Removes all vectorized points associated with a specific note."""
        self.client.delete(
            collection_name=self.collection_name,
            points_selector={
                "filter": {
                    "must": [
                        {"key": "note_id", "match": {"value": str(note_id)}}
                    ]
                }
            },
        )
        logger.info(f"Deleted points for note {note_id} from Qdrant.")

# Singleton exporter
qdrant_service = QdrantService()
