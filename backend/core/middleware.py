import time
import uuid
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.base import BaseHTTPMiddleware
from backend.core.logging import logger

class RequestContextMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        # Generate or retrieve correlation ID
        request_id = request.headers.get("X-Request-ID", str(uuid.uuid4()))
        
        # Store request ID in context variables for logging
        structlog_logger = logger.bind(request_id=request_id)
        request.state.logger = structlog_logger
        request.state.request_id = request_id

        start_time = time.perf_counter()
        
        try:
            structlog_logger.info(
                "Request started",
                method=request.method,
                url=str(request.url),
                client=request.client.host if request.client else None,
            )
            
            response = await call_next(request)
            
            process_time = time.perf_counter() - start_time
            response.headers["X-Request-ID"] = request_id
            response.headers["X-Process-Time"] = f"{process_time:.4f}s"
            
            structlog_logger.info(
                "Request completed",
                status_code=response.status_code,
                duration=f"{process_time:.4f}s",
            )
            return response
            
        except Exception as exc:
            process_time = time.perf_counter() - start_time
            structlog_logger.error(
                "Request failed",
                error=str(exc),
                duration=f"{process_time:.4f}s",
            )
            raise

class RateLimitMiddleware(BaseHTTPMiddleware):
    """
    Hook for rate limiting requests.
    In production, this would interface with Redis or database counts.
    """
    async def dispatch(self, request: Request, call_next):
        # Placeholder for rate limiting logic
        # You would extract client IP or JWT user ID, check rate limits in Redis
        # If rate limit exceeded, raise AppException("Rate limit exceeded", status_code=429)
        return await call_next(request)

def setup_middleware(app: FastAPI):
    # Setup CORS middleware
    app.add_middleware(
        CORSMiddleware,
        allow_origins=[
            "http://localhost:5173",
            "http://localhost:3000",
            "http://127.0.0.1:5173",
            "http://127.0.0.1:3000",
        ],
        allow_origin_regex=r"https?://.*",
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    
    # Request ID / tracing middleware
    app.add_middleware(RequestContextMiddleware)
    
    # Rate Limit hook middleware
    app.add_middleware(RateLimitMiddleware)
