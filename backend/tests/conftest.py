import os

os.environ.setdefault("DATABASE_URL", "sqlite:///:memory:")

import pytest
from app.database import init_db


@pytest.fixture(scope="session", autouse=True)
def setup_database():
    init_db()
