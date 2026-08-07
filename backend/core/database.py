import asyncio
from contextlib import asynccontextmanager
from typing import AsyncGenerator
from sqlalchemy.ext.asyncio import (
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)
from backend.core.config import settings
from backend.core.logging import logger

# Create async engine with connection pooling parameters & automatic connection pre-ping
engine = create_async_engine(
    settings.DATABASE_URL,
    echo=False,
    pool_pre_ping=True,
    pool_size=20,
    max_overflow=10,
    pool_timeout=30,
    pool_recycle=300,
    connect_args={
        "statement_cache_size": 0,
        "prepared_statement_cache_size": 0
    },
)

# Async session factory
AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
)

async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """FastAPI Dependency for database session injection."""
    async with AsyncSessionLocal() as session:
        try:
            yield session
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()

@asynccontextmanager
async def db_session() -> AsyncGenerator[AsyncSession, None]:
    """Context manager for database sessions outside request lifecycle."""
    async with AsyncSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()

async def wait_for_db(max_retries: int = 5, delay: float = 2.0):
    """Wait for the database to become responsive before starting the app."""
    from sqlalchemy.sql import text
    retries = 0
    while retries < max_retries:
        try:
            async with engine.begin() as conn:
                from backend.models.base import Base
                import backend.models.models  # Register models
                await conn.run_sync(Base.metadata.create_all)
            logger.info("Successfully connected to database and verified schemas.")
            return True
        except Exception as e:
            retries += 1
            logger.warning(
                f"Database not ready yet. Retrying {retries}/{max_retries}...",
                error=str(e),
            )
            await asyncio.sleep(delay)
    logger.error("Failed to connect to the database after max retries.")
    return False
