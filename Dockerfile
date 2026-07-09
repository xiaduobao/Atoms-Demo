# Production backend image for Railway (repo root deploy).
# Frontend should be deployed separately (e.g. Vercel); see DEPLOY.md.
FROM python:3.11-slim

WORKDIR /app

COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY backend/ .

ENV DATABASE_URL=sqlite:///./atoms_demo.db
EXPOSE 8000

CMD ["sh", "-c", "uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}"]
