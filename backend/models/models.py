import enum
import uuid
from typing import List, Optional
# pyrefly: ignore [missing-import]
from sqlalchemy import String, Boolean, ForeignKey, Integer, Text, JSON, Enum
# pyrefly: ignore [missing-import]
from sqlalchemy.orm import Mapped, mapped_column, relationship
from backend.models.base import Base

class UserRole(str, enum.Enum):
    STUDENT = "student"
    ADMIN = "admin"

class NoteStatus(str, enum.Enum):
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"

class User(Base):
    __tablename__ = "users"

    email: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)
    role: Mapped[UserRole] = mapped_column(Enum(UserRole), default=UserRole.STUDENT, nullable=False)
    is_verified: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    # Relationships
    notes: Mapped[List["Note"]] = relationship(back_populates="user", cascade="all, delete-orphan")
    chat_sessions: Mapped[List["ChatSession"]] = relationship(back_populates="user", cascade="all, delete-orphan")
    api_keys: Mapped[List["ApiKey"]] = relationship(back_populates="user", cascade="all, delete-orphan")
    audit_logs: Mapped[List["AuditLog"]] = relationship(back_populates="user")
    notifications: Mapped[List["Notification"]] = relationship(back_populates="user", cascade="all, delete-orphan")
    preferences: Mapped[List["Preference"]] = relationship(back_populates="user", cascade="all, delete-orphan")


class Note(Base):
    __tablename__ = "notes"

    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    storage_path: Mapped[str] = mapped_column(String(1024), nullable=False)
    status: Mapped[NoteStatus] = mapped_column(Enum(NoteStatus), default=NoteStatus.PROCESSING, nullable=False)
    error_message: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # Relationships
    user: Mapped["User"] = relationship(back_populates="notes")
    metadata_info: Mapped["DocumentMetadata"] = relationship(back_populates="note", uselist=False, lazy="selectin", cascade="all, delete-orphan")


class DocumentMetadata(Base):
    __tablename__ = "document_metadata"

    note_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("notes.id", ondelete="CASCADE"), unique=True, nullable=False, index=True)
    total_pages: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    total_chars: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    file_size_bytes: Mapped[int] = mapped_column(Integer, default=0, nullable=False)

    # Relationships
    note: Mapped["Note"] = relationship(back_populates="metadata_info")


class ChatSession(Base):
    __tablename__ = "chat_sessions"

    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    title: Mapped[str] = mapped_column(String(255), nullable=False)

    # Relationships
    user: Mapped["User"] = relationship(back_populates="chat_sessions")
    messages: Mapped[List["Message"]] = relationship(back_populates="session", cascade="all, delete-orphan")


class Message(Base):
    __tablename__ = "messages"

    session_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("chat_sessions.id", ondelete="CASCADE"), nullable=False, index=True)
    role: Mapped[str] = mapped_column(String(50), nullable=False)  # "user" or "assistant"
    content: Mapped[str] = mapped_column(Text, nullable=False)
    citations: Mapped[Optional[list]] = mapped_column(JSON, nullable=True)  # List of dicts with note_id, page, score, and snippet

    # Relationships
    session: Mapped["ChatSession"] = relationship(back_populates="messages")


# FUTURE READY TABLES (Schema Only)

class ApiKey(Base):
    __tablename__ = "api_keys"

    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    key_prefix: Mapped[str] = mapped_column(String(16), nullable=False)
    hashed_key: Mapped[str] = mapped_column(String(255), nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    user: Mapped["User"] = relationship(back_populates="api_keys")


class AuditLog(Base):
    __tablename__ = "audit_logs"

    user_id: Mapped[Optional[uuid.UUID]] = mapped_column(ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    action: Mapped[str] = mapped_column(String(255), nullable=False)
    ip_address: Mapped[Optional[str]] = mapped_column(String(45), nullable=True)
    user_agent: Mapped[Optional[str]] = mapped_column(String(512), nullable=True)
    details: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)

    user: Mapped[Optional["User"]] = relationship(back_populates="audit_logs")


class Notification(Base):
    __tablename__ = "notifications"

    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    message: Mapped[str] = mapped_column(Text, nullable=False)
    read_at: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)  # Can be ISO timestamp if read

    user: Mapped["User"] = relationship(back_populates="notifications")


class Preference(Base):
    __tablename__ = "preferences"

    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    key: Mapped[str] = mapped_column(String(255), nullable=False)
    value: Mapped[str] = mapped_column(Text, nullable=False)

    user: Mapped["User"] = relationship(back_populates="preferences")


class Quiz(Base):
    __tablename__ = "quizzes"

    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    note_id: Mapped[Optional[uuid.UUID]] = mapped_column(ForeignKey("notes.id", ondelete="SET NULL"), nullable=True, index=True)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    score: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    total_questions: Mapped[int] = mapped_column(Integer, default=5, nullable=False)

    questions: Mapped[List["QuizQuestion"]] = relationship(back_populates="quiz", cascade="all, delete-orphan", lazy="selectin")


class QuizQuestion(Base):
    __tablename__ = "quiz_questions"

    quiz_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("quizzes.id", ondelete="CASCADE"), nullable=False, index=True)
    question_text: Mapped[str] = mapped_column(Text, nullable=False)
    options: Mapped[list] = mapped_column(JSON, nullable=False)  # List of string options
    correct_option_idx: Mapped[int] = mapped_column(Integer, nullable=False)
    explanation: Mapped[str] = mapped_column(Text, nullable=False)

    quiz: Mapped["Quiz"] = relationship(back_populates="questions")


class FlashcardDeck(Base):
    __tablename__ = "flashcard_decks"

    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    note_id: Mapped[Optional[uuid.UUID]] = mapped_column(ForeignKey("notes.id", ondelete="SET NULL"), nullable=True, index=True)
    title: Mapped[str] = mapped_column(String(255), nullable=False)

    cards: Mapped[List["Flashcard"]] = relationship(back_populates="deck", cascade="all, delete-orphan", lazy="selectin")


class Flashcard(Base):
    __tablename__ = "flashcards"

    deck_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("flashcard_decks.id", ondelete="CASCADE"), nullable=False, index=True)
    front: Mapped[str] = mapped_column(Text, nullable=False)
    back: Mapped[str] = mapped_column(Text, nullable=False)

    deck: Mapped["FlashcardDeck"] = relationship(back_populates="cards")

