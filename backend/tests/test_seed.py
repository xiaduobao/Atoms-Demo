from app.models import Message, Project, User
from app.seed import DEMO_PROJECT_NAME, DEMO_SHARE_SLUG, seed_demo_user
from sqlalchemy import select


def test_seed_demo_user_creates_showcase_project():
    seed_demo_user()

    from app.database import SessionLocal

    db = SessionLocal()
    try:
        user = db.scalar(select(User).where(User.email == "demo@atoms.demo"))
        assert user is not None
        assert user.credits == 50

        project = db.scalar(
            select(Project).where(
                Project.user_id == user.id,
                Project.name == DEMO_PROJECT_NAME,
            )
        )
        assert project is not None
        assert project.status == "deployed"
        assert project.share_slug == DEMO_SHARE_SLUG
        assert project.is_public is True
        assert project.current_code is not None
        assert project.files_json is not None

        messages = list(db.scalars(select(Message).where(Message.project_id == project.id)))
        assert len(messages) >= 5
        agent_types = {m.agent_type for m in messages if m.agent_type}
        assert agent_types >= {"researcher", "pm", "architect", "engineer"}
    finally:
        db.close()

    # Idempotent: second call should not duplicate
    seed_demo_user()
    db = SessionLocal()
    try:
        count = len(list(db.scalars(select(Project).where(Project.name == DEMO_PROJECT_NAME))))
        assert count == 1
    finally:
        db.close()
