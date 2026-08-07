import uuid
from typing import List, Optional, Any
from pydantic import BaseModel, Field

class QuizQuestionResponse(BaseModel):
    id: uuid.UUID
    question_text: str
    options: List[str]
    correct_option_idx: int
    explanation: str

    class Config:
        from_attributes = True

class QuizResponse(BaseModel):
    id: uuid.UUID
    title: str
    total_questions: int
    score: Optional[int] = None
    questions: List[QuizQuestionResponse]

    class Config:
        from_attributes = True

class QuizSubmitRequest(BaseModel):
    score: int

class FlashcardResponse(BaseModel):
    id: uuid.UUID
    front: str
    back: str

    class Config:
        from_attributes = True

class FlashcardDeckResponse(BaseModel):
    id: uuid.UUID
    title: str
    cards: List[FlashcardResponse]

    class Config:
        from_attributes = True

class ChapterSummaryResponse(BaseModel):
    title: str
    key_takeaways: List[str]
    core_concepts: List[dict]
    cheat_sheet: str
