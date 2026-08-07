import abc
import os
import httpx
from typing import Optional
from backend.core.config import settings
from backend.core.exceptions import ExternalServiceException

class PDFStorageService(abc.ABC):
    @abc.abstractmethod
    async def upload_file(self, file_content: bytes, filename: str) -> str:
        """Stream PDF bytes to storage, returning the unique storage path."""
        pass

    @abc.abstractmethod
    async def download_file(self, storage_path: str) -> bytes:
        """Fetch PDF bytes from storage for processing."""
        pass

    @abc.abstractmethod
    async def delete_file(self, storage_path: str) -> bool:
        """Remove a file from storage."""
        pass

    @abc.abstractmethod
    async def generate_signed_url(self, storage_path: str, expires_in: int = 3600) -> str:
        """Generate a time-limited read-only URL for the file."""
        pass

class LocalPDFStorageService(PDFStorageService):
    def __init__(self):
        self.base_dir = settings.LOCAL_STORAGE_DIR
        os.makedirs(self.base_dir, exist_ok=True)

    async def upload_file(self, file_content: bytes, filename: str) -> str:
        file_path = os.path.join(self.base_dir, filename)
        os.makedirs(os.path.dirname(file_path), exist_ok=True)
        with open(file_path, "wb") as f:
            f.write(file_content)
        return filename

    async def download_file(self, storage_path: str) -> bytes:
        file_path = os.path.join(self.base_dir, storage_path)
        if not os.path.exists(file_path):
            raise FileNotFoundError(f"File not found: {storage_path}")
        with open(file_path, "rb") as f:
            return f.read()

    async def delete_file(self, storage_path: str) -> bool:
        file_path = os.path.join(self.base_dir, storage_path)
        if os.path.exists(file_path):
            os.remove(file_path)
            return True
        return False

    async def generate_signed_url(self, storage_path: str, expires_in: int = 3600) -> str:
        # Locally, we can return the path pointing to our StaticFiles mount
        # In a real environment, this might be signed with a secret hash token, but for local use a simple static link is clean
        return f"/static/storage/{storage_path}"

class SupabasePDFStorageService(PDFStorageService):
    def __init__(self):
        self.supabase_url = settings.SUPABASE_URL
        self.supabase_key = settings.SUPABASE_KEY
        self.bucket = settings.SUPABASE_BUCKET
        if not self.supabase_url or not self.supabase_key:
            raise ExternalServiceException("Supabase URL and Key are required for storage.")
        self.headers = {
            "Authorization": f"Bearer {self.supabase_key}",
            "apikey": self.supabase_key,
        }

    async def upload_file(self, file_content: bytes, filename: str) -> str:
        url = f"{self.supabase_url}/storage/v1/object/{self.bucket}/{filename}"
        async with httpx.AsyncClient() as client:
            response = await client.post(url, headers=self.headers, content=file_content)
            if response.status_code != 200:
                raise ExternalServiceException(f"Supabase upload failed: {response.text}")
            return filename

    async def download_file(self, storage_path: str) -> bytes:
        url = f"{self.supabase_url}/storage/v1/object/{self.bucket}/{storage_path}"
        async with httpx.AsyncClient() as client:
            response = await client.get(url, headers=self.headers)
            if response.status_code != 200:
                raise ExternalServiceException(f"Supabase download failed: {response.text}")
            return response.content

    async def delete_file(self, storage_path: str) -> bool:
        url = f"{self.supabase_url}/storage/v1/object/{self.bucket}/{storage_path}"
        async with httpx.AsyncClient() as client:
            response = await client.delete(url, headers=self.headers)
            return response.status_code == 200

    async def generate_signed_url(self, storage_path: str, expires_in: int = 3600) -> str:
        url = f"{self.supabase_url}/storage/v1/object/sign/{self.bucket}/{storage_path}"
        async with httpx.AsyncClient() as client:
            response = await client.post(url, headers=self.headers, json={"expiresIn": expires_in})
            if response.status_code != 200:
                raise ExternalServiceException(f"Supabase signed URL failed: {response.text}")
            data = response.json()
            # Supabase API usually returns {"signedURL": "..."} or {"signedUrl": "..."}
            signed_path = data.get("signedURL") or data.get("signedUrl")
            if not signed_path:
                raise ExternalServiceException(f"Invalid response from Supabase: {data}")
            # Ensure it is a complete URL
            if signed_path.startswith("/"):
                return f"{self.supabase_url}{signed_path}"
            return signed_path

def get_pdf_storage_service() -> PDFStorageService:
    """Retrieve the configured PDF storage service instance."""
    if settings.STORAGE_TYPE.lower() == "supabase":
        return SupabasePDFStorageService()
    return LocalPDFStorageService()
