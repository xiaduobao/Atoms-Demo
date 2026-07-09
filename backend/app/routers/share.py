from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Project
from app.schemas import SharedProjectOut

router = APIRouter(prefix="/api/share", tags=["share"])


@router.get("/{slug}", response_model=SharedProjectOut)
def get_shared_project(slug: str, db: Session = Depends(get_db)) -> Project:
    project = (
        db.query(Project).filter(Project.share_slug == slug, Project.is_public.is_(True)).first()
    )
    if not project:
        raise HTTPException(status_code=404, detail="Shared project not found")
    return project
