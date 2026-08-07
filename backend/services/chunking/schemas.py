import uuid
from pydantic import BaseModel

from typing import List

class Chunk(BaseModel):
    document_id: uuid.UUID
    chunk_index: int
    page_number: int
    char_start: int
    char_end: int
    text: str
    figures: List[str] = []
