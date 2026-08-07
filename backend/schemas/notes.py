import uuid
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict, Field
from backend.models.models import NoteStatus

class DocumentMetadataResponse(BaseModel):
    total_pages: int
    total_chars: int
    file_size_bytes: int

    model_config = ConfigDict(from_attributes=True)

class NoteResponse(BaseModel):
    id: uuid.UUID
    title: str
    status: NoteStatus
    error_message: Optional[str]
    created_at: datetime
    metadata_info: Optional[DocumentMetadataResponse] = None

    model_config = ConfigDict(from_attributes=True)

class NoteRenameRequest(BaseModel):
    title: str = Field(..., min_length=1, max_length=255)
