import hashlib
import threading
from typing import List
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
        if hasattr(self, "cache"):
            return
            
        with self._lock:
            if hasattr(self, "cache"):
                return
            
            self.model = None
            self.device = None
            # In-memory dictionary cache to prevent redundant embedding calculations
            self.cache = {}
            self.cache_lock = threading.Lock()

    def _get_model(self):
        if self.model is None:
            with self._lock:
                if self.model is None:
                    try:
                        from fastembed import TextEmbedding
                        logger.info("Initializing FastEmbed ONNX Model Singleton (Ultra-Low RAM, Single Thread)...")
                        self.model = TextEmbedding(model_name="BAAI/bge-small-en-v1.5", threads=1)
                        self.is_fastembed = True
                        # Force dummy embedding to pre-warm ONNX C++ session and cache model weights
                        list(self.model.embed(["warmup"]))
                    except Exception as fe_err:
                        logger.info("FastEmbed unavailable, falling back to SentenceTransformer PyTorch...", error=str(fe_err))
                        import gc
                        gc.collect()
                        from sentence_transformers import SentenceTransformer
                        self.model = SentenceTransformer("BAAI/bge-small-en-v1.5")
                        self.is_fastembed = False
        return self.model

    def _hash_text(self, text: str) -> str:
        """Computes SHA-256 hash of text to be used as cache key."""
        return hashlib.sha256(text.encode("utf-8")).hexdigest()

    async def embed_texts(self, texts: List[str]) -> List[List[float]]:
        """
        Batches texts, checks SHA-256 cache, calculates missing embeddings,
        saves results, and returns final float vector lists.
        """
        if not texts:
            return []

        import gc
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

        # 2. Encode missing chunks
        if missing_texts:
            logger.info(f"Embedding batch of size {len(missing_texts)} (Cache Misses)")
            try:
                model = self._get_model()
                if getattr(self, "is_fastembed", False):
                    # FastEmbed outputs a generator yielding 384-dim numpy arrays
                    gen = model.embed(missing_texts)
                    vectors_list = [v.tolist() for v in gen]
                else:
                    embeddings = model.encode(missing_texts, batch_size=16, show_progress_bar=False)
                    vectors_list = [v.tolist() for v in embeddings]
                    del embeddings
                    gc.collect()

                # 3. Cache new embeddings and fill results
                with self.cache_lock:
                    for i, idx in enumerate(missing_indices):
                        vector = vectors_list[i]
                        text_hash = self._hash_text(missing_texts[i])
                        self.cache[text_hash] = vector
                        results[idx] = vector
            except Exception as e:
                logger.error("Failed to generate text embeddings", error=str(e))
                raise ValueError("Embedding model execution failed") from e

        return results

# Expose global instance
embedding_service = EmbeddingService()
