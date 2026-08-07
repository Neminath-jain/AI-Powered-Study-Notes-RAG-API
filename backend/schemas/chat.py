import uuid
from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, ConfigDict, Field

class Citation(BaseModel):
    note_id: uuid.UUID
    note_title: str
    page: int
    score: float
    text: str
    figures: Optional[List[str]] = None

    model_config = ConfigDict(from_attributes=True)

class ChatSessionCreate(BaseModel):
    title: str

class ChatSessionRenameRequest(BaseModel):
    title: str = Field(..., min_length=1, max_length=255)

class ChatSessionResponse(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    title: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

class MessageResponse(BaseModel):
    id: uuid.UUID
    session_id: uuid.UUID
    role: str
    content: str
    citations: Optional[List[Citation]] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

class QueryRequest(BaseModel):
    query: str
    session_id: uuid.UUID
    note_ids: Optional[List[uuid.UUID]] = None
    language: Optional[str] = "Auto"

class QueryResponse(BaseModel):
    session_id: uuid.UUID
    answer: str
    citations: List[Citation]
