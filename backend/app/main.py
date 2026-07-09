from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.database import init_db
from app.exceptions import register_exception_handlers
from app.routers import auth, chat, credits, projects, share
from app.seed import seed_demo_user


@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    seed_demo_user()
    yield


app = FastAPI(title="Atoms Demo API", version="2.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(projects.router)
app.include_router(chat.router)
app.include_router(credits.router)
app.include_router(share.router)

register_exception_handlers(app)


@app.get("/api/health")
def health() -> dict[str, str]:
    return {"status": "ok", "version": "2.0.0"}
