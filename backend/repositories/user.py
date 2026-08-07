import uuid
from typing import Optional
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from backend.models.models import User
from backend.repositories.base import BaseRepository

class UserRepository(BaseRepository[User]):
    def __init__(self, db: AsyncSession):
        super().__init__(User, db)

    async def get_by_email(self, email: str) -> Optional[User]:
        """Fetch a user by email address, excluding soft-deleted ones."""
        query = select(User).where(User.email == email, User.deleted_at.is_(None))
        result = await self.db.execute(query)
        return result.scalar_one_or_none()
