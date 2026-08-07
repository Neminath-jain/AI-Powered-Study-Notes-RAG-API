import uuid
from typing import List, Optional
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession
from backend.models.models import Note, DocumentMetadata
from backend.repositories.base import BaseRepository

class NoteRepository(BaseRepository[Note]):
    def __init__(self, db: AsyncSession):
        super().__init__(Note, db)

    async def get_by_user(self, user_id: uuid.UUID, skip: int = 0, limit: int = 100) -> List[Note]:
        """Fetch all active notes uploaded by a specific user, with metadata joined."""
        query = (
            select(Note)
            .options(selectinload(Note.metadata_info))
            .where(Note.user_id == user_id, Note.deleted_at.is_(None))
            .offset(skip)
            .limit(limit)
        )
        result = await self.db.execute(query)
        return list(result.scalars().all())

    async def get_with_metadata(self, note_id: uuid.UUID) -> Optional[Note]:
        """Fetch a specific note and pre-fetch its document metadata."""
        query = (
            select(Note)
            .options(selectinload(Note.metadata_info))
            .where(Note.id == note_id, Note.deleted_at.is_(None))
        )
        result = await self.db.execute(query)
        return result.scalar_one_or_none()

    async def create_metadata(self, metadata: DocumentMetadata) -> DocumentMetadata:
        """Save notes metadata to database."""
        self.db.add(metadata)
        await self.db.commit()
        await self.db.refresh(metadata)
        return metadata
