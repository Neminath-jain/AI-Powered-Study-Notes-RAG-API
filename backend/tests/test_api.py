import unittest
from fastapi.testclient import TestClient
from backend.main import app

class TestAPI(unittest.TestCase):
    def setUp(self):
        self.client = TestClient(app)

    def test_health_check_endpoint(self):
        """Verifies GET /health endpoint yields status response."""
        response = self.client.get("/api/v1/health")
        self.assertIn(response.status_code, [200, 503])

    def test_notes_upload_unauthorized(self):
        """Verifies document upload route blocks unauthenticated calls with 401."""
        response = self.client.post("/api/v1/notes/upload")
        self.assertEqual(response.status_code, 401)

    def test_chat_session_unauthorized(self):
        """Verifies session thread creation blocks unauthenticated calls with 401."""
        response = self.client.post(
            "/api/v1/chat/sessions",
            json={"title": "Test Thread"}
        )
        self.assertEqual(response.status_code, 401)

if __name__ == "__main__":
    unittest.main()
