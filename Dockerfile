# Multi-stage Dockerfile for Sales Analytics Platform
# Stage 1: Builder – install dependencies and run tests
FROM python:3.12-slim AS builder
WORKDIR /app
# Install build dependencies
RUN apt-get update && apt-get install -y --no-install-recommends gcc build-essential && rm -rf /var/lib/apt/lists/*
# Install Python dependencies
COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt
# Copy source code
COPY . ./
# (Optional) Run linting and tests here to fail early
# RUN pip install pytest && pytest

# Stage 2: Runtime – minimal image
FROM python:3.12-slim AS runtime
WORKDIR /app
# Add non-root user for security
RUN useradd -m appuser && chown -R appuser /app
USER appuser
# Copy only runtime dependencies from builder
COPY --from=builder /usr/local/lib/python3.12/site-packages /usr/local/lib/python3.12/site-packages
# Copy application code
COPY --chown=appuser . /app
# Expose the API port (default 8000)
EXPOSE 8000
# Set environment variables for production
ENV PYTHONUNBUFFERED=1 \
    ENVIRONMENT=production
# Entry point – use gunicorn with uvicorn workers for production
# 2 workers keeps the total DB connection count within Supabase's session-pooler
# limit (see DB_POOL_SIZE / DB_MAX_OVERFLOW). Scale up with a larger pooler.
# `python -m gunicorn` because only site-packages (not /usr/local/bin) is copied from the builder stage.
CMD ["python", "-m", "gunicorn", "api.main:app", "-w", "2", "-k", "uvicorn.workers.UvicornWorker", "--bind", "0.0.0.0:8000", "--log-level", "info", "--access-logfile", "-", "--timeout", "120"]
