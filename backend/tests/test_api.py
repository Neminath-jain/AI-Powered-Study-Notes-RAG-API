import unittest
from fastapi.testclient import TestClient
from backend.main import app

class TestAPI(unittest.TestCase):
    def setUp(self):
        self.client = TestClient(app)

    def test_health_check_endpoint(self):
        """Verifies GET /health endpoint yields status ok."""
        response = self.client.get("/api/v1/health")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json(), {"status": "ok"})

    def test_notes_upload_unauthorized(self):
        """Verifies document upload route blocks unauthenticated calls with 401."""
        response = self.client.post("/api/v1/notes/upload")
        self.assertEqual(response.status_code, 401)

    def test_chat_ask_unauthorized(self):
        """Verifies RAG query execution blocks unauthenticated calls with 401."""
        response = self.client.post(
            "/api/v1/chat/ask",
            json={
                "query": "What is photosynthesis?",
                "session_id": "00000000-0000-0000-0000-000000000000"
            }
        )
        self.assertEqual(response.status_code, 401)

if __name__ == "__main__":
    unittest.main()
