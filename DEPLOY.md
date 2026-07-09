## Deployment Guide

### Option A: Local (Development)

```bash
chmod +x start.sh
./start.sh
```

### Option B: Frontend on Vercel + Backend on Railway

**Backend (Railway / Render / Fly.io):**

1. Create a new service pointing to `backend/` directory
2. Set environment variables:
   - `LLM_API_KEY`
   - `LLM_BASE_URL` (e.g. `https://api.deepseek.com/v1`)
   - `LLM_MODEL` (e.g. `deepseek-chat`)
   - `DATABASE_URL` (use PostgreSQL on Railway for persistence)
   - `CORS_ORIGINS` (your Vercel frontend URL)
3. Start command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`

**Frontend (Vercel):**

1. Import repo, set root directory to `frontend/`
2. Set environment variable:
   - `VITE_API_BASE` = `https://your-backend.railway.app/api`
3. Deploy

### Option C: Docker (Backend only)

```bash
cd backend
docker build -t atoms-demo-api .
docker run -p 8000:8000 -e LLM_API_KEY=sk-... atoms-demo-api
```

### PostgreSQL Migration

For production, replace SQLite with PostgreSQL:

```
DATABASE_URL=postgresql://user:pass@host:5432/atoms_demo
```

SQLAlchemy handles this automatically — no code changes needed.
