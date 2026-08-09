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

@router.get("/test_embedding")
async def test_embedding():
    import time
    t0 = time.time()
    from backend.services.embeddings.client import embedding_service
    vecs = await embedding_service.embed_texts(["Explain MapReduce in simple terms."])
    return {"time": f"{time.time() - t0:.3f}s", "dim": len(vecs[0]) if vecs else 0}

@router.get("/test_vectordb")
async def test_vectordb(db: AsyncSession = Depends(get_db)):
    import time, uuid
    t0 = time.time()
    from backend.services.vectordb.client import vectordb_client
    dummy_vec = [0.01] * 384
    hits = await vectordb_client.search_similar(
        user_id=uuid.UUID("ef97b3d7-ccf6-49be-b531-dde9fe3eae50"),
        query_vector=dummy_vec,
        top_k=10
    )
    return {"time": f"{time.time() - t0:.3f}s", "hits_count": len(hits)}

@router.get("/test_llm")
async def test_llm():
    import time
    t0 = time.time()
    from backend.services.llm import LLMService
    llm = LLMService()
    ans = await llm.generate_response(context="MapReduce processes data.", question="What is MapReduce?")
    return {"time": f"{time.time() - t0:.3f}s", "answer_len": len(ans)}
