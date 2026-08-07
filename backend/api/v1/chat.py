import uuid
from typing import List, Optional
from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession
from backend.core.database import get_db
from backend.api.v1.auth import get_current_user, get_optional_current_user
from backend.models.models import User, ChatSession, Message
from backend.services.chat.session import ChatService
from backend.services.rag.pipeline import RAGPipeline
from backend.schemas.chat import (
    ChatSessionCreate,
    ChatSessionRenameRequest,
    ChatSessionResponse,
    MessageResponse,
    QueryRequest,
    QueryResponse,
    Citation,
)
from backend.core.rate_limit import rate_limit
from backend.core.exceptions import NotFoundException

router = APIRouter(prefix="/chat", tags=["chat"])

@router.post("/sessions", response_model=ChatSessionResponse, status_code=status.HTTP_201_CREATED)
async def create_session(
    body: ChatSessionCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Create a new conversational session thread."""
    chat_service = ChatService(db)
    return await chat_service.create_session(current_user.id, body.title)

@router.get("/sessions", response_model=List[ChatSessionResponse])
async def list_sessions(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """List all active conversational session threads for the student."""
    chat_service = ChatService(db)
    return await chat_service.list_sessions(current_user.id)

@router.patch("/sessions/{session_id}", response_model=ChatSessionResponse)
async def rename_session(
    session_id: uuid.UUID,
    body: ChatSessionRenameRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Rename an existing conversational session thread."""
    chat_service = ChatService(db)
    return await chat_service.rename_session(session_id, current_user.id, body.title)

@router.delete("/sessions/{session_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_session(
    session_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Soft deletes a conversational session thread."""
    chat_service = ChatService(db)
    await chat_service.delete_session(session_id, current_user.id)

@router.get("/sessions/{session_id}/history", response_model=List[MessageResponse])
async def get_session_history(
    session_id: uuid.UUID,
    current_user: Optional[User] = Depends(get_optional_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Retrieve full conversation history (questions + answers + citations) for a session thread."""
    chat_service = ChatService(db)
    return await chat_service.get_session_history(session_id)

@router.post(
    "/ask", 
    response_model=QueryResponse,
    dependencies=[Depends(rate_limit(requests_per_minute=20))]  # 20 queries per minute limit
)
async def ask_question(
    body: QueryRequest,
    current_user: Optional[User] = Depends(get_optional_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Submit a student query to the RAG pipeline.
    Runs similarity checking, context prompt assembly, LLM execution,
    saves the conversation thread, and returns the response with citations.
    """
    chat_service = ChatService(db)
    
    # 1. Verify session exists (supports shared chat links)
    session = await chat_service.get_session(body.session_id)
    if not session:
        raise NotFoundException("Chat session not found")
    
    # 2. Log User message to Postgres
    await chat_service.save_message(
        session_id=body.session_id,
        role="user",
        content=body.query,
        citations=None
    )

    # 3. Execute Unified RAG pipeline using session owner's notes
    rag_pipeline = RAGPipeline(db)
    answer, citations_list = await rag_pipeline.execute(
        user_id=session.user_id,
        session_id=body.session_id,
        query=body.query,
        note_ids=body.note_ids,
        language=body.language or "Auto"
    )

    # 4. Log Assistant answer to Postgres
    await chat_service.save_message(
        session_id=body.session_id,
        role="assistant",
        content=answer,
        citations=citations_list
    )

    # 5. Map list of citations to Pydantic objects
    citations = [
        Citation(
            note_id=uuid.UUID(c["note_id"]),
            note_title=c["note_title"],
            page=c["page"],
            score=c["score"],
            text=c["text"],
            figures=c.get("figures")
        )
        for c in citations_list
    ]

    return QueryResponse(
        session_id=body.session_id,
        answer=answer,
        citations=citations
    )
