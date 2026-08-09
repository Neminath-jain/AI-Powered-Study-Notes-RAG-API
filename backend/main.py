import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
import os

from backend.core.config import settings
from backend.core.logging import logger, setup_logging
from backend.core.database import wait_for_db
from backend.core.exceptions import register_exception_handlers
from backend.core.middleware import setup_middleware

# Initialize logging config early
setup_logging()

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup sequence
    logger.info("Starting up Student Knowledge AI backend...")
    
    # 1. Wait for Postgres database to be ready
    db_connected = await wait_for_db(max_retries=5, delay=2.0)
    if not db_connected:
        logger.error("Could not establish database connection. Exiting.")
        raise RuntimeError("Database connection failure")

    # 2. Trigger Qdrant initialization to set up collections early
    logger.info("Initializing vector database connections...")
    try:
        from backend.services.qdrant import qdrant_service
        logger.info("Vector database initialization successful.")
    except Exception as e:
        logger.error("Failed to connect to Qdrant vector database", error=str(e))
        raise RuntimeError("Vector database connection failure") from e

    # 3. Ensure local storage directory exists
    if settings.STORAGE_TYPE == "local":
        os.makedirs(settings.LOCAL_STORAGE_DIR, exist_ok=True)
        logger.info(f"Local storage directory verified at {settings.LOCAL_STORAGE_DIR}")

    # 4. Pre-warm FastEmbed ONNX model at startup so query requests respond in < 1 second
    logger.info("Pre-warming FastEmbed ONNX embedding model...")
    try:
        from backend.services.embeddings.client import embedding_service
        embedding_service._get_model()
        logger.info("FastEmbed embedding model pre-warmed successfully.")
    except Exception as emb_err:
        logger.warning("Embedding model pre-warming warning", error=str(emb_err))

    yield

    # Shutdown sequence
    logger.info("Shutting down Student Knowledge AI backend...")

# Initialize FastAPI application
app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Production-grade RAG platform for student course notes.",
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/docs" if settings.is_development else None,
    redoc_url="/redoc" if settings.is_development else None,
)

# Set up middlewares
setup_middleware(app)

# Register custom exception handler mappings
register_exception_handlers(app)

# Import and register API routers
from backend.api.v1.auth import router as auth_router
from backend.api.v1.notes import router as notes_router
from backend.api.v1.chat import router as chat_router
from backend.api.v1.users import router as users_router
from backend.api.v1.health import router as health_router
from backend.api.v1.admin import router as admin_router
from backend.api.v1.settings import router as settings_router
from backend.api.v1.study import router as study_router
from backend.api.v1.ws import router as ws_router

# Include API routers under /api/v1 prefix
app.include_router(auth_router, prefix=settings.API_V1_STR)
app.include_router(notes_router, prefix=settings.API_V1_STR)
app.include_router(chat_router, prefix=settings.API_V1_STR)
app.include_router(users_router, prefix=settings.API_V1_STR)
app.include_router(health_router, prefix=settings.API_V1_STR)
app.include_router(admin_router, prefix=settings.API_V1_STR)
app.include_router(settings_router, prefix=settings.API_V1_STR)
app.include_router(study_router, prefix=settings.API_V1_STR)
app.include_router(ws_router, prefix=settings.API_V1_STR)

# Optional: Mount local storage folder for downloading uploaded PDF notes (in dev only)
if settings.STORAGE_TYPE == "local" and os.path.exists(settings.LOCAL_STORAGE_DIR):
    app.mount("/static/storage", StaticFiles(directory=settings.LOCAL_STORAGE_DIR), name="storage")

@app.get("/")
async def root():
    return {"message": "Welcome to Student Knowledge AI API", "docs": "/docs"}

if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run("backend.main:app", host="0.0.0.0", port=port)
