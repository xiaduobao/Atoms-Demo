# Design Document — Atoms Demo v2

## Architecture

- **Frontend:** React + TypeScript + Vite + Tailwind + react-router-dom
- **Backend:** FastAPI + LangGraph + LangChain
- **Auth:** Email/password + JWT (local mode); Supabase sync endpoint ready
- **DB:** SQLite (dev) / PostgreSQL (prod via Supabase)
- **Observability:** LangSmith (optional env vars)
- **Quality:** ruff + pytest + oxlint + Prettier + Vitest + GitHub Actions CI

## LangGraph Flow

```
START → researcher → pm → architect → END (await user approve)
User approves → engineer (SSE stream) → preview + persist
Race mode → 2× parallel engineer → user selects variant
```

## Key Tradeoffs

| Decision | Choice | Why |
|----------|--------|-----|
| Agent framework | LangGraph | interrupt, SSE, Race fan-out, LangSmith native |
| vs CrewAI | Not used | LangGraph better for token streaming + graph control |
| Generated output | Multi-file JSON | File tree UI; merged HTML for iframe preview |
| Auth | Local JWT first | Works without Supabase setup; sync endpoint for prod |
| RAGAS | Offline eval script | CI-friendly; not blocking main flow |

## Completion Status

| Feature | Status |
|---------|--------|
| Email register/login | ✅ |
| LangGraph 4-agent | ✅ |
| Plan approve | ✅ |
| SSE streaming | ✅ |
| Race mode | ✅ |
| Multi-file code panel | ✅ |
| Mobile/desktop preview | ✅ |
| Deploy + share link | ✅ |
| Credits + pricing | ✅ |
| Version history | ✅ |
| LangSmith | ✅ (env config) |
| RAGAS eval | ✅ (script) |
| pytest / Vitest | ✅ |
| CI lint + test | ✅ |
| Online deploy | ⬜ user action |

## Known Limitations

- Engineer output quality depends on LLM; JSON parse fallback to single HTML
- Race mode costs 2× LLM calls + 2 credits
- Supabase Auth UI optional; local auth is default
- Generated `schema.sql` is illustrative, not executed

## Roadmap

1. PostgreSQL on Railway for persistent deploy
2. LangGraph Studio visualization export
3. Full RAGAS CI with golden prompts
4. Supabase Auth frontend integration
