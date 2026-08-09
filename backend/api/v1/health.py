from fastapi import APIRouter, Depends, status
from fastapi.responses import JSONResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.sql import text
import httpx
from backend.core.database import get_db
from backend.services.vectordb.client import vectordb_client
from backend.core.config import settings
from backend.core.logging import logger

router = APIRouter(prefix="/health", tags=["health"])

@router.get("")
async def health_check(db: AsyncSession = Depends(get_db)):
    """
    Performs active checks on database, Qdrant vector DB, and Groq LLM API.
    Returns details on each service's reachability.
    """
    db_healthy = False
    qdrant_healthy = False
    groq_healthy = False

    # 1. Check PostgreSQL Database Connectivity
    try:
        await db.execute(text("SELECT 1"))
        db_healthy = True
    except Exception as e:
        logger.error("Health check failed for PostgreSQL", error=str(e))

    # 2. Check Qdrant Vector DB Connectivity
    try:
        # Check health endpoint of Qdrant
        response = vectordb_client.client.get_collections()
        qdrant_healthy = True
    except Exception as e:
        logger.error("Health check failed for Qdrant", error=str(e))

    # 3. Check Groq API Reachability
    if settings.GROQ_API_KEY:
        try:
            # Check network connection to Groq API endpoint
            async with httpx.AsyncClient(timeout=3.0) as client:
                res = await client.get("https://api.groq.com/openai/v1/models", headers={
                    "Authorization": f"Bearer {settings.GROQ_API_KEY}"
                })
                if res.status_code == 200:
                    groq_healthy = True
                else:
                    logger.warning("Groq API returned non-200 code during health check", code=res.status_code)
        except Exception as e:
            logger.error("Health check failed for Groq API reachability", error=str(e))
    else:
        # If no key is set, we are in mock mode (which is healthy for local dev without key)
        logger.info("GROQ_API_KEY is not configured. Treating as healthy (Mock Mode).")
        groq_healthy = True

    status_code = status.HTTP_200_OK if (db_healthy and qdrant_healthy and groq_healthy) else status.HTTP_503_SERVICE_UNAVAILABLE

    return JSONResponse(
        status_code=status_code,
        content={
            "status": "healthy" if status_code == 200 else "unhealthy",
            "services": {
                "database": "connected" if db_healthy else "failed",
                "vectordb": "connected" if qdrant_healthy else "failed",
                "llm_provider": "connected" if groq_healthy else "failed"
            }
        }
    )

@router.get("/diag")
async def rag_diagnostics(db: AsyncSession = Depends(get_db)):
    import time
    import uuid
    t0 = time.time()
    from backend.services.embeddings.client import embedding_service
    from backend.services.vectordb.client import vectordb_client
    from backend.services.llm import LLMService
    from backend.repositories.note import NoteRepository

    vecs = await embedding_service.embed_texts(["Explain MapReduce in simple terms."])
    t1 = time.time()

    hits = await vectordb_client.search_similar(
        user_id=uuid.UUID("ef97b3d7-ccf6-49be-b531-dde9fe3eae50"),
        query_vector=vecs[0],
        top_k=10
    )
    t2 = time.time()

    retrieved_note_ids = list({hit["note_id"] for hit in hits})
    note_repo = NoteRepository(db)
    notes = await note_repo.get_by_ids(retrieved_note_ids)
    t3 = time.time()

    llm = LLMService()
    ans = await llm.generate_response(context="MapReduce processes parallel data.", question="What is MapReduce?")
    t4 = time.time()

    return {
        "embedding_time": f"{t1 - t0:.3f}s",
        "vectordb_time": f"{t2 - t1:.3f}s",
        "note_db_time": f"{t3 - t2:.3f}s",
        "llm_time": f"{t4 - t3:.3f}s",
        "total_time": f"{t4 - t0:.3f}s",
        "hits_count": len(hits)
    }
