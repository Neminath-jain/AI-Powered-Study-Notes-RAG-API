import uuid
from typing import List, Optional, Dict, Any
from sqlalchemy.ext.asyncio import AsyncSession
from backend.repositories.chat import ChatRepository
from backend.models.models import ChatSession, Message
from backend.core.exceptions import NotFoundException

class ChatService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.chat_repo = ChatRepository(db)

    async def create_session(self, user_id: uuid.UUID, title: str) -> ChatSession:
        """Create a new conversational chat session thread."""
        session = ChatSession(user_id=user_id, title=title)
        return await self.chat_repo.add(session)

    async def list_sessions(self, user_id: uuid.UUID) -> List[ChatSession]:
        """Fetch all active chat sessions belonging to a specific student."""
        return await self.chat_repo.get_sessions_by_user(user_id)

    async def rename_session(self, session_id: uuid.UUID, user_id: uuid.UUID, new_title: str) -> ChatSession:
        """Renames an existing chat session thread."""
        session = await self.chat_repo.get_by_id(session_id)
        if not session or session.user_id != user_id:
            raise NotFoundException("Chat session not found")
        
        session.title = new_title
        return await self.chat_repo.update(session)

    async def delete_session(self, session_id: uuid.UUID, user_id: uuid.UUID) -> bool:
        """Soft deletes a chat session thread."""
        session = await self.chat_repo.get_by_id(session_id)
        if not session or session.user_id != user_id:
            raise NotFoundException("Chat session not found")
        
        return await self.chat_repo.delete(session_id)

    async def get_session(self, session_id: uuid.UUID) -> Optional[ChatSession]:
        """Fetch chat session by ID regardless of owner for shared link collaboration."""
        session = await self.chat_repo.get_by_id(session_id)
        if not session or session.deleted_at is not None:
            return None
        return session

    async def get_session_history(self, session_id: uuid.UUID, user_id: Optional[uuid.UUID] = None) -> List[Message]:
        """Retrieve full conversation message logs for a session thread (supports shared links)."""
        session = await self.get_session(session_id)
        if not session:
            raise NotFoundException("Chat session not found")
        
        return await self.chat_repo.get_session_messages(session_id)

    async def save_message(
        self,
        session_id: uuid.UUID,
        role: str,
        content: str,
        citations: Optional[List[Dict[str, Any]]] = None
    ) -> Message:
        """Saves a message (user question or assistant answer with citation objects) to database."""
        message = Message(
            session_id=session_id,
            role=role,
            content=content,
            citations=citations
        )
        return await self.chat_repo.add_message(message)
