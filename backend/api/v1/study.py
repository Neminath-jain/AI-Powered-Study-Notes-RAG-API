import uuid
from typing import Optional, List
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from backend.core.database import get_db
from backend.api.v1.auth import get_current_user
from backend.models.models import User
from backend.services.study import StudyService
from backend.schemas.study import (
    QuizResponse,
    QuizSubmitRequest,
    FlashcardDeckResponse,
    ChapterSummaryResponse,
)

router = APIRouter(prefix="/study", tags=["study"])

@router.post("/quiz/generate", response_model=QuizResponse)
async def generate_quiz(
    note_id: Optional[uuid.UUID] = Query(None),
    num_questions: int = Query(5, ge=1, le=10),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Generate an AI Quiz from uploaded study materials."""
    study_service = StudyService(db)
    return await study_service.generate_quiz(
        user_id=current_user.id,
        note_id=note_id,
        num_questions=num_questions
    )

@router.post("/flashcards/generate", response_model=FlashcardDeckResponse)
async def generate_flashcards(
    note_id: Optional[uuid.UUID] = Query(None),
    num_cards: int = Query(8, ge=3, le=20),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Generate an AI Flashcard Deck from uploaded study materials."""
    study_service = StudyService(db)
    return await study_service.generate_flashcards(
        user_id=current_user.id,
        note_id=note_id,
        num_cards=num_cards
    )

@router.get("/summary", response_model=ChapterSummaryResponse)
async def generate_summary(
    note_id: Optional[uuid.UUID] = Query(None),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Generate a Chapter Summary & Concept Cheat Sheet from study materials."""
    study_service = StudyService(db)
    return await study_service.generate_summary(
        user_id=current_user.id,
        note_id=note_id
    )
