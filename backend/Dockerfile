FROM python:3.12-slim

# Set environment paths
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PIP_NO_CACHE_DIR=1 \
    PYTHONPATH=/app

WORKDIR /app

# Install system utilities
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install python package manager utilities and CPU-only PyTorch
# This keeps the image size much smaller than default CUDA torch
RUN pip install --no-cache-dir --upgrade pip setuptools wheel
RUN pip install --no-cache-dir torch --index-url https://download.pytorch.org/whl/cpu

# Copy dependencies manifest
COPY backend/requirements.txt ./requirements.txt

# Install remaining backend requirements
RUN pip install --no-cache-dir -r requirements.txt

# Pre-download and cache the SentenceTransformer model inside the image
RUN python -c "from sentence_transformers import SentenceTransformer; SentenceTransformer('sentence-transformers/all-MiniLM-L6-v2')"

# Copy the source code
COPY . .

# Expose FastAPI default port
EXPOSE 8000

# Run Alembic migrations and start server
CMD ["sh", "-c", "alembic -c backend/alembic.ini upgrade head && uvicorn backend.main:app --host 0.0.0.0 --port $PORT"]