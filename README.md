# Atoms Demo

AI-powered app builder inspired by [Atoms](https://atoms.dev/) — describe an idea, watch a LangGraph multi-agent team plan and build it, preview live, iterate, and deploy.

**Live Demo:** https://atoms-demo-rho.vercel.app/ · **Source:** https://github.com/xiaduobao/Atoms-Demo/

**Stack:** React + TypeScript · FastAPI · LangGraph · LangChain · SQLite

## 评审快速体验（推荐）

1. 打开 https://atoms-demo-rho.vercel.app/ → **Sign in**
2. 账号 `demo@atoms.demo` / `demo123456`（登录页已预填）
3. 进入预置项目 **「Todo App (Demo)」** → 右侧预览可交互
4. 或 Dashboard → 点 **Todo App** 模板 → 审批 Plan → Generate → Deploy

分享页示例：https://atoms-demo-rho.vercel.app/share/demo-todo

笔试提交说明见 [SUBMISSION.md](SUBMISSION.md)

## Quick Start

```bash
# 1. Backend
cd backend
cp .env.example .env   # set LLM_API_KEY
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt -r requirements-dev.txt
uvicorn app.main:app --reload --port 8000

# 2. Frontend (new terminal)
cd frontend && npm install && npm run dev
```

Open http://localhost:5173

**Demo account:** `demo@atoms.demo` / `demo123456`

Or use `./start.sh` from project root.

## Features

- **LangGraph 4-Agent pipeline:** Iris (Researcher) → Emma (PM) → Bob (Architect) → Alex (Engineer)
- **Plan approval** before code generation
- **Race Mode:** 2 parallel UI variants to choose from
- **Live preview** with mobile/desktop viewport toggle
- **Multi-file code panel** with file tree + copy
- **Email auth** (register/login) + JWT
- **Credits system** + mock Stripe pricing
- **Deploy & share** public preview links
- **Version history** + HTML export
- **LangSmith** tracing (optional)
- **RAGAS** eval scripts
- **pytest** + **Vitest** + CI (lint/test/coverage)

## Architecture

```
React (Vite)  ──REST/SSE──►  FastAPI
                              ├── LangGraph (plan + generate)
                              ├── LangChain (LLM streaming)
                              └── SQLite
```

## Environment Variables

See [backend/.env.example](backend/.env.example)

| Variable | Description |
|----------|-------------|
| `LLM_API_KEY` | OpenAI-compatible API key |
| `LLM_BASE_URL` | e.g. `https://api.deepseek.com/v1` |
| `LLM_MODEL` | e.g. `deepseek-chat` |
| `LANGCHAIN_API_KEY` | LangSmith tracing (optional) |
| `JWT_SECRET` | Auth token secret |

## Development

```bash
# Backend
cd backend && ruff check . && ruff format .
PYTHONPATH=. pytest tests/ -v

# Frontend
cd frontend && npm run check && npm run test
```

## Deploy

See [DEPLOY.md](DEPLOY.md)

## Docs

- [DESIGN.md](DESIGN.md) — architecture decisions & tradeoffs

## License

MIT
