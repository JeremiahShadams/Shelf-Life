# =============================================================================
# FRESCO Backend — Production Dockerfile
# =============================================================================
# Multi-stage optimized build for FastAPI + Keras MobileNetV2 produce classifier
# =============================================================================

FROM python:3.11-slim-bookworm AS base

# Prevent Python from writing .pyc files and enable unbuffered logging
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    DEBIAN_FRONTEND=noninteractive

WORKDIR /app

# Install minimal OS dependencies for pillow, tensorflow/keras, and curl healthchecks
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    libgl1 \
    libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

# Install python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Create non-root system user and prepare directories
RUN useradd -m -u 1000 -s /bin/bash fresco && \
    mkdir -p /app/uploads /app/models && \
    chown -R fresco:fresco /app

# Copy application code and seed assets
COPY --chown=fresco:fresco app/ /app/app/
COPY --chown=fresco:fresco models/ /app/models/

USER fresco

EXPOSE 8000

# Docker native health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
    CMD curl -f http://localhost:8000/api/health || exit 1

# Production command
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]

