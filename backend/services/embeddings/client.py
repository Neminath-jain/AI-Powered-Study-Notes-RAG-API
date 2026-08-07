import hashlib
import threading
from typing import List
import torch
from sentence_transformers import SentenceTransformer
from backend.core.config import settings
from backend.core.logging import logger

class EmbeddingService:
    _instance = None
    _lock = threading.Lock()

    def __new__(cls, *args, **kwargs):
        if not cls._instance:
            with cls._lock:
                if not cls._instance:
                    cls._instance = super(EmbeddingService, cls).__new__(cls, *args, **kwargs)
        return cls._instance

    def __init__(self):
        # Prevent re-initialization
        if hasattr(self, "model"):
            return
            
        with self._lock:
            if hasattr(self, "model"):
                return
            
            logger.info("Initializing Embedding Model Singleton...")
            # Detect hardware acceleration device
            self.device = "cuda" if torch.cuda.is_available() else "cpu"
            logger.info(f"Targeting device for embedding: {self.device}")
            
            self.model = SentenceTransformer(settings.EMBEDDING_MODEL_NAME, device=self.device)
            # In-memory dictionary cache to prevent redundant embedding calculations
            self.cache = {}
            self.cache_lock = threading.Lock()

    def _hash_text(self, text: str) -> str:
        """Computes SHA-256 hash of text to be used as cache key."""
        return hashlib.sha256(text.encode("utf-8")).hexdigest()

    def embed_texts(self, texts: List[str]) -> List[List[float]]:
        """
        Batches texts, checks SHA-256 cache, calculates missing embeddings,
        saves results, and returns final float vector lists.
        """
        if not texts:
            return []

        results = [None] * len(texts)
        missing_indices = []
        missing_texts = []

        # 1. Filter cache hits
        with self.cache_lock:
            for idx, text in enumerate(texts):
                text_hash = self._hash_text(text)
                if text_hash in self.cache:
                    results[idx] = self.cache[text_hash]
                else:
                    missing_indices.append(idx)
                    missing_texts.append(text)

        # 2. Encode missing chunks in a single batch
        if missing_texts:
            logger.info(f"Embedding batch of size {len(missing_texts)} (Cache Misses)")
            try:
                embeddings = self.model.encode(
                    missing_texts, 
                    batch_size=32, 
                    show_progress_bar=False
                )
                
                # 3. Cache new embeddings and fill results
                with self.cache_lock:
                    for i, idx in enumerate(missing_indices):
                        vector = embeddings[i].tolist()
                        text_hash = self._hash_text(missing_texts[i])
                        self.cache[text_hash] = vector
                        results[idx] = vector
            except Exception as e:
                logger.error("Failed to generate text embeddings", error=str(e))
                raise ValueError("Embedding model execution failed") from e

        return results

# Expose global instance
embedding_service = EmbeddingService()
