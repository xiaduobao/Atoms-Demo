# Design Document — Atoms Demo v2

## Architecture

- **Frontend:** React + TypeScript + Vite + Tailwind + react-router-dom
- **Backend:** FastAPI + LangGraph + LangChain
- **Auth:** Email/password + JWT (local mode); Supabase sync endpoint ready
- **DB:** SQLite file (dev) / SQLite in-memory + seed (prod on Railway)
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
| Prod DB | SQLite in-memory + seed | Avoids Postgres setup; demo project restored on restart |
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
| Online deploy | ✅ Vercel + Railway |
| Demo showcase project | ✅ seed on startup |

## Known Limitations

- Engineer output quality depends on LLM; JSON parse fallback to single HTML
- Race mode costs 2× LLM calls + 2 credits
- Supabase Auth UI optional; local auth is default
- Generated `schema.sql` is illustrative, not executed
- In-memory DB resets on container restart; user projects lost, demo re-seeded

## Roadmap

### Phase 1 — Infrastructure
1. PostgreSQL + Redis (LangGraph checkpoint); lightweight alt: Railway Volume + SQLite file
2. Rate limiting / LLM circuit breaker (complements Credits)

### Phase 2 — Quality loop
3. Eval pipeline: RAGAS golden set in CI → online post-generation scoring → metrics dashboard

### Phase 3 — Product
4. Remix / Fork from share page
5. Multimodal input (design mockup / screenshot → UI)

### Phase 4 — Ops
6. Monitoring & alerting (Sentry + generation success rate / latency)
7. Supabase Auth frontend integration
8. LangGraph Studio visualization export
