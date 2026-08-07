import time
import threading
from fastapi import Request
from backend.core.exceptions import AppException

class TokenBucket:
    def __init__(self, capacity: int, refill_rate: float):
        self.capacity = capacity
        self.refill_rate = refill_rate  # tokens per second
        self.tokens = float(capacity)
        self.last_refill = time.time()
        self.lock = threading.Lock()

    def consume(self, tokens: int = 1) -> bool:
        with self.lock:
            now = time.time()
            elapsed = now - self.last_refill
            self.last_refill = now
            # Refill tokens based on elapsed time
            self.tokens = min(self.capacity, self.tokens + elapsed * self.refill_rate)
            
            if self.tokens >= tokens:
                self.tokens -= tokens
                return True
            return False

class RateLimiter:
    def __init__(self):
        self.buckets = {}
        self.lock = threading.Lock()

    def get_bucket(self, key: str, capacity: int, refill_rate: float) -> TokenBucket:
        with self.lock:
            if key not in self.buckets:
                self.buckets[key] = TokenBucket(capacity, refill_rate)
            return self.buckets[key]

# Global rate limiter instance
_limiter = RateLimiter()

def rate_limit(requests_per_minute: int = 60):
    """
    FastAPI dependency factory for rate limiting.
    Rate limits requests based on Client IP and User ID (if authenticated).
    """
    capacity = requests_per_minute
    refill_rate = requests_per_minute / 60.0  # tokens per second

    async def dependency(request: Request):
        # Determine client identifier: prefer user ID if authenticated, fallback to client IP
        client_ip = request.client.host if request.client else "unknown"
        user_id = "anonymous"
        
        # If user is logged in, their state holds the current_user object
        if hasattr(request.state, "user") and request.state.user:
            user_id = str(request.state.user.id)

        # Route matching path to keep counts separate per endpoint
        path = request.url.path

        # Enforce IP-based rate limit
        ip_key = f"ip:{client_ip}:{path}"
        ip_bucket = _limiter.get_bucket(ip_key, capacity, refill_rate)
        if not ip_bucket.consume():
            raise AppException(
                message="Rate limit exceeded. Please try again later.",
                code="RATE_LIMIT_EXCEEDED",
                status_code=429
            )

        # Enforce User-based rate limit (if authenticated)
        if user_id != "anonymous":
            user_key = f"user:{user_id}:{path}"
            user_bucket = _limiter.get_bucket(user_key, capacity, refill_rate)
            if not user_bucket.consume():
                raise AppException(
                    message="Rate limit exceeded. Please try again later.",
                    code="RATE_LIMIT_EXCEEDED",
                    status_code=429
                )

    return dependency
