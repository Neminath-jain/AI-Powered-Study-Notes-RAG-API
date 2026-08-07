import abc
import os
from typing import Dict, Any
import httpx
from backend.core.config import settings
from backend.core.exceptions import ExternalServiceException

class StorageService(abc.ABC):
    @abc.abstractmethod
    async def upload_file(self, file_content: bytes, filename: str) -> str:
        """Upload a file and return the path/URL identifier."""
        pass

    @abc.abstractmethod
    async def download_file(self, storage_path: str) -> bytes:
        """Retrieve file contents as bytes."""
        pass

    @abc.abstractmethod
    async def delete_file(self, storage_path: str) -> bool:
        """Delete the file from storage."""
        pass

class LocalStorageService(StorageService):
    def __init__(self):
        self.base_dir = settings.LOCAL_STORAGE_DIR
        if not os.path.exists(self.base_dir):
            os.makedirs(self.base_dir)

    async def upload_file(self, file_content: bytes, filename: str) -> str:
        # Save files locally with relative paths to avoid exposing full paths
        file_path = os.path.join(self.base_dir, filename)
        os.makedirs(os.path.dirname(file_path), exist_ok=True)
        with open(file_path, "wb") as f:
            f.write(file_content)
        return filename

    async def download_file(self, storage_path: str) -> bytes:
        file_path = os.path.join(self.base_dir, storage_path)
        if not os.path.exists(file_path):
            raise FileNotFoundError(f"File not found in storage: {storage_path}")
        with open(file_path, "rb") as f:
            return f.read()

    async def delete_file(self, storage_path: str) -> bool:
        file_path = os.path.join(self.base_dir, storage_path)
        if os.path.exists(file_path):
            os.remove(file_path)
            return True
        return False

class SupabaseStorageService(StorageService):
    def __init__(self):
        self.supabase_url = settings.SUPABASE_URL
        self.supabase_key = settings.SUPABASE_KEY
        self.bucket = settings.SUPABASE_BUCKET
        if not self.supabase_url or not self.supabase_key:
            raise ExternalServiceException(
                "Supabase URL and Key are required for Supabase Storage."
            )
        self.headers = {
            "Authorization": f"Bearer {self.supabase_key}",
            "apikey": self.supabase_key,
        }

    async def upload_file(self, file_content: bytes, filename: str) -> str:
        # URL shape: /storage/v1/object/bucket/filename
        url = f"{self.supabase_url}/storage/v1/object/{self.bucket}/{filename}"
        async with httpx.AsyncClient() as client:
            response = await client.post(
                url,
                headers=self.headers,
                content=file_content,
            )
            if response.status_code != 200:
                raise ExternalServiceException(
                    f"Supabase upload failed: {response.text}"
                )
            return filename

    async def download_file(self, storage_path: str) -> bytes:
        url = f"{self.supabase_url}/storage/v1/object/{self.bucket}/{storage_path}"
        async with httpx.AsyncClient() as client:
            response = await client.get(url, headers=self.headers)
            if response.status_code != 200:
                raise ExternalServiceException(
                    f"Supabase download failed: {response.text}"
                )
            return response.content

    async def delete_file(self, storage_path: str) -> bool:
        url = f"{self.supabase_url}/storage/v1/object/{self.bucket}/{storage_path}"
        async with httpx.AsyncClient() as client:
            response = await client.delete(url, headers=self.headers)
            if response.status_code != 200:
                return False
            return True

def get_storage_service() -> StorageService:
    """Factory to retrieve storage adapter configured in settings."""
    if settings.STORAGE_TYPE.lower() == "supabase":
        return SupabaseStorageService()
    return LocalStorageService()
