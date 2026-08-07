import os
from typing import Optional
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Field

class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )

    # Core settings
    ENVIRONMENT: str = Field(default="development")
    PROJECT_NAME: str = Field(default="Student Knowledge AI")
    API_V1_STR: str = Field(default="/api/v1")
    LOG_LEVEL: str = Field(default="INFO")

    # Security settings
    JWT_SECRET: str = Field(default="supersecretaccesskey_change_me_in_production_1234567890")
    JWT_REFRESH_SECRET: str = Field(default="supersecretrefreshkey_change_me_in_production_1234567890")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = Field(default=30)
    REFRESH_TOKEN_EXPIRE_DAYS: int = Field(default=7)

    # Database settings
    DATABASE_URL: str = Field(default="postgresql+asyncpg://postgres:postgres@db:5432/student_rag")

    # Qdrant Vector DB settings
    QDRANT_URL: str = Field(default="http://qdrant:6333")
    QDRANT_API_KEY: Optional[str] = Field(default=None)
    QDRANT_COLLECTION_NAME: str = Field(default="student_notes")

    # Embedding model settings
    EMBEDDING_MODEL_NAME: str = Field(default="sentence-transformers/all-MiniLM-L6-v2")

    # LLM Settings (Groq API)
    GROQ_API_KEY: str = Field(default="")
    LLM_MODEL: str = Field(default="llama-3.3-70b-versatile")
    
    # RAG Guardrails settings
    SCORE_THRESHOLD: float = Field(default=0.45)

    # Storage settings
    STORAGE_TYPE: str = Field(default="local")  # "local" or "supabase"
    LOCAL_STORAGE_DIR: str = Field(default="./storage")
    SUPABASE_URL: Optional[str] = Field(default=None)
    SUPABASE_KEY: Optional[str] = Field(default=None)
    SUPABASE_BUCKET: str = Field(default="notes")

    @property
    def is_development(self) -> bool:
        return self.ENVIRONMENT == "development"

settings = Settings()
