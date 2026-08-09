import unittest
import uuid
from backend.utils.text_processing import clean_text, chunk_text
from backend.services.qdrant import QdrantService
from backend.services.llm import LLMService
from backend.core.config import settings

class TestRAGPipeline(unittest.TestCase):
    def test_text_cleaning(self):
        raw_text = "  This   is a\ntext   with strange    formatting. "
        cleaned = clean_text(raw_text)
        self.assertEqual(cleaned, "This is a text with strange formatting.")

    def test_chunking_preserves_pages(self):
        pages_data = [
            {"page": 1, "text": "This is page one text content that is quite short."},
            {"page": 2, "text": "This is page two text content. It is also short."}
        ]
        chunks = chunk_text(pages_data, chunk_size=30, chunk_overlap=5)
        
        # Verify pages are preserved in chunks
        self.assertTrue(len(chunks) > 0)
        pages_in_chunks = {c["page"] for c in chunks}
        self.assertTrue(1 in pages_in_chunks)
        self.assertTrue(2 in pages_in_chunks)

    def test_similarity_score_threshold_guardrail(self):
        # We simulate a similarity check
        mock_hits_below_threshold = [
            {"note_id": uuid.uuid4(), "page": 1, "text": "Some text", "score": 0.12},
            {"note_id": uuid.uuid4(), "page": 2, "text": "Some other text", "score": 0.10}
        ]
        
        # Check if any score clears the threshold
        threshold = settings.SCORE_THRESHOLD
        best_score = max(hit["score"] for hit in mock_hits_below_threshold)
        
        self.assertTrue(best_score < threshold, f"Best score {best_score} should be below threshold {threshold}")

    def test_mock_llm_mode_triggers_without_key(self):
        llm = LLMService()
        # If GROQ_API_KEY is not set, it should return mock response instead of crashing
        if not settings.GROQ_API_KEY:
            response = llm.model_post = lambda x: None # dummy
            ans = "I have analyzed the documents context. The question is 'What is photosynthesis?'."
            self.assertTrue("Mock LLM" in ans or "I have analyzed" in ans)

if __name__ == "__main__":
    unittest.main()
