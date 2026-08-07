import unittest
import uuid
from unittest.mock import AsyncMock, patch
from backend.services.rag.pipeline import RAGPipeline
from backend.core.config import settings

class TestRAGGuardrails(unittest.TestCase):
    @patch("backend.services.rag.pipeline.embedding_service")
    @patch("backend.services.rag.pipeline.vectordb_client")
    async def test_score_below_threshold_returns_fallback_instantly(self, mock_qdrant, mock_embed):
        # Setup mocks
        mock_embed.embed_texts.return_value = [[0.1] * 384]
        # Simulate Qdrant returning hits below threshold score (0.35 < 0.45)
        mock_qdrant.search_similar = AsyncMock(return_value=[
            {"note_id": uuid.uuid4(), "page": 1, "text": "Weak match.", "score": 0.35}
        ])

        db_session = AsyncMock()
        pipeline = RAGPipeline(db_session)
        
        user_id = uuid.uuid4()
        session_id = uuid.uuid4()
        
        with patch("backend.services.rag.pipeline.LLMService") as mock_llm_cls:
            mock_llm_inst = AsyncMock()
            mock_llm_cls.return_value = mock_llm_inst
            
            # Execute RAG query
            # Since this is an async function, we need to wrap the test runner in async execution,
            # but standard unittest.TestCase runs synchronously. Let's make an async test runner inside the test.
            import asyncio
            ans, citations = asyncio.run(pipeline.execute(
                user_id=user_id,
                session_id=session_id,
                query="What is photosynthesis?"
            ))
            
            # Verify the fallback triggered directly
            self.assertEqual(ans, "I cannot find this information in the uploaded notes.")
            self.assertEqual(citations, [])
            # Verify LLM was never called
            mock_llm_inst.generate_response.assert_not_called()

    @patch("backend.services.rag.pipeline.embedding_service")
    @patch("backend.services.rag.pipeline.vectordb_client")
    @patch("backend.services.rag.pipeline.NoteRepository")
    @patch("backend.services.rag.pipeline.ChatRepository")
    def test_score_above_threshold_queries_llm(
        self, 
        mock_chat_repo_cls, 
        mock_note_repo_cls, 
        mock_qdrant, 
        mock_embed
    ):
        # Setup mocks
        mock_embed.embed_texts.return_value = [[0.1] * 384]
        note_id = uuid.uuid4()
        
        # High matching score (0.85 > 0.45)
        mock_qdrant.search_similar = AsyncMock(return_value=[
            {"note_id": note_id, "page": 1, "text": "Photosynthesis is the process by which plants use sunlight to synthesize nutrients.", "score": 0.85}
        ])

        # Mock database repos
        mock_note_repo = AsyncMock()
        mock_note_repo.get_by_id = AsyncMock(return_value=AsyncMock(title="Biology Notes"))
        mock_note_repo_cls.return_value = mock_note_repo

        mock_chat_repo = AsyncMock()
        mock_chat_repo.get_session_messages = AsyncMock(return_value=[])
        mock_chat_repo_cls.return_value = mock_chat_repo

        db_session = AsyncMock()
        pipeline = RAGPipeline(db_session)
        
        user_id = uuid.uuid4()
        session_id = uuid.uuid4()
        
        # Mock LLM response
        with patch("backend.services.rag.pipeline.LLMService") as mock_llm_cls:
            mock_llm_inst = AsyncMock()
            mock_llm_inst.generate_response = AsyncMock(return_value="Photosynthesis converts sunlight to nutrients [Biology Notes, Page 1].")
            mock_llm_cls.return_value = mock_llm_inst
            
            import asyncio
            ans, citations = asyncio.run(pipeline.execute(
                user_id=user_id,
                session_id=session_id,
                query="What is photosynthesis?"
            ))
            
            # Verify grounded answer is returned
            self.assertEqual(ans, "Photosynthesis converts sunlight to nutrients [Biology Notes, Page 1].")
            self.assertEqual(len(citations), 1)
            self.assertEqual(citations[0]["note_title"], "Biology Notes")
            self.assertEqual(citations[0]["page"], 1)
            self.assertEqual(citations[0]["score"], 0.85)

            # Verify LLM was called since it cleared the threshold
            mock_llm_inst.generate_response.assert_called_once()

if __name__ == "__main__":
    unittest.main()
