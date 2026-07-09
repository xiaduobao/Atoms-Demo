from sqlalchemy import select

from app.auth import hash_password
from app.config import settings
from app.database import SessionLocal
from app.models import User


def seed_demo_user() -> None:
    db = SessionLocal()
    try:
        existing = db.scalar(select(User).where(User.email == settings.demo_email))
        if existing:
            return
        user = User(
            email=settings.demo_email,
            name="Demo User",
            password_hash=hash_password(settings.demo_password),
            credits=50,
            plan_tier="pro",
        )
        db.add(user)
        db.commit()
    finally:
        db.close()
