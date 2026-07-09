## Deployment Guide

### Option A: Local (Development)

```bash
chmod +x start.sh
./start.sh
```

`start.sh` is **development only** (creates venv, runs `npm run dev`). Do not use it on Railway or other PaaS — the container will fail with `python3: command not found`.

### Option B: Frontend on Vercel + Backend on Railway

**Live deployment:**
- Frontend: https://atoms-demo-rho.vercel.app/
- Backend: https://atoms-demo-production.up.railway.app

**Backend (Railway / Render / Fly.io):**

**Railway (repo root):** The root `Dockerfile` + `railway.toml` deploy the backend API only. Push to trigger a redeploy; do not set the start command to `./start.sh`.

**Railway (backend subdirectory):** Alternatively set Root Directory to `backend/` and use `backend/Dockerfile`.

1. Set environment variables:
   - `LLM_API_KEY`
   - `LLM_BASE_URL` (e.g. `https://api.deepseek.com/v1`)
   - `LLM_MODEL` (e.g. `deepseek-chat`)
   - `DATABASE_URL` (use PostgreSQL on Railway for persistence)
   - `CORS_ORIGINS` (your Vercel frontend URL)
3. **Start command:** `./entrypoint.sh` (or leave empty to use Dockerfile `ENTRYPOINT`). Do **not** use `uvicorn ... --port ${PORT:-8000}` — Railway does not expand shell defaults in the UI.

**Frontend (Vercel):**

1. Import repo, set root directory to `frontend/`
2. Set environment variable:
   - `VITE_API_BASE` = `https://atoms-demo-production.up.railway.app/api`
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
