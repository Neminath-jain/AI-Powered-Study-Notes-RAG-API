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
