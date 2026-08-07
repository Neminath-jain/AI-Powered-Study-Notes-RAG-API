import uuid
from typing import List, Optional
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from backend.models.models import ChatSession, Message
from backend.repositories.base import BaseRepository

class ChatRepository(BaseRepository[ChatSession]):
    def __init__(self, db: AsyncSession):
        super().__init__(ChatSession, db)

    async def get_sessions_by_user(self, user_id: uuid.UUID, skip: int = 0, limit: int = 100) -> List[ChatSession]:
        """Fetch all active chat sessions for a specific user, sorted by creation date."""
        query = (
            select(ChatSession)
            .where(ChatSession.user_id == user_id, ChatSession.deleted_at.is_(None))
            .order_on(ChatSession.created_at.desc()) if hasattr(ChatSession, "order_on") else
            select(ChatSession)
            .where(ChatSession.user_id == user_id, ChatSession.deleted_at.is_(None))
            .order_by(ChatSession.created_at.desc())
            .offset(skip)
            .limit(limit)
        )
        result = await self.db.execute(query)
        return list(result.scalars().all())

    async def get_session_messages(self, session_id: uuid.UUID) -> List[Message]:
        """Fetch all messages for a specific chat session, ordered by creation timestamp."""
        query = (
            select(Message)
            .where(Message.session_id == session_id, Message.deleted_at.is_(None))
            .order_by(Message.created_at.asc())
        )
        result = await self.db.execute(query)
        return list(result.scalars().all())

    async def add_message(self, message: Message) -> Message:
        """Save a new chat message into the conversation thread."""
        self.db.add(message)
        await self.db.commit()
        await self.db.refresh(message)
        return message
