import unittest
from backend.services.embeddings.client import EmbeddingService, embedding_service

class TestEmbeddings(unittest.TestCase):
    def test_singleton_pattern(self):
        inst1 = EmbeddingService()
        inst2 = EmbeddingService()
        self.assertIs(inst1, inst2)
        self.assertIs(inst1, embedding_service)

    def test_embedding_dimensions(self):
        texts = ["Verify this string."]
        vectors = embedding_service.embed_texts(texts)
        self.assertEqual(len(vectors), 1)
        # MiniLM-L6-v2 size is 384
        self.assertEqual(len(vectors[0]), 384)

    def test_cache_hits_on_recalculating(self):
        text = "This is a cached string text check."
        
        # Initialize first run
        vectors_1 = embedding_service.embed_texts([text])
        
        # Check cache state
        text_hash = embedding_service._hash_text(text)
        self.assertTrue(text_hash in embedding_service.cache)
        
        # Second run should load from cache
        # Patch encode to detect if it runs
        original_encode = embedding_service.model.encode
        called = False
        def mock_encode(*args, **kwargs):
            nonlocal called
            called = True
            return original_encode(*args, **kwargs)
        
        embedding_service.model.encode = mock_encode
        vectors_2 = embedding_service.embed_texts([text])
        
        # Verify it did not invoke model.encode because of cache hit
        self.assertFalse(called)
        self.assertEqual(vectors_1, vectors_2)
        
        # Restore model.encode
        embedding_service.model.encode = original_encode

if __name__ == "__main__":
    unittest.main()
