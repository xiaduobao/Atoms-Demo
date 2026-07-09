from app.main import app
from fastapi.testclient import TestClient

client = TestClient(app)


def _auth_headers(
    email: str = "flow@example.com", password: str = "secret1234", name: str = "Flow"
):
    res = client.post(
        "/api/auth/register",
        json={"email": email, "password": password, "name": name},
    )
    if res.status_code == 400:
        res = client.post("/api/auth/login", json={"email": email, "password": password})
    token = res.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


def test_health():
    res = client.get("/api/health")
    assert res.status_code == 200
    assert res.json()["status"] == "ok"


def test_register_and_login():
    res = client.post(
        "/api/auth/register",
        json={"email": "test@example.com", "password": "secret12", "name": "Test"},
    )
    if res.status_code == 400:
        res = client.post(
            "/api/auth/login",
            json={"email": "test@example.com", "password": "secret12"},
        )
    assert res.status_code == 200
    data = res.json()
    assert "access_token" in data
    assert data["user"]["email"] == "test@example.com"


def test_register_duplicate_email():
    headers = _auth_headers("dup@example.com")
    res = client.post(
        "/api/auth/register",
        json={"email": "dup@example.com", "password": "secret1234", "name": "Dup"},
    )
    assert res.status_code == 400
    assert headers["Authorization"].startswith("Bearer ")


def test_auth_me():
    headers = _auth_headers("me@example.com")
    res = client.get("/api/auth/me", headers=headers)
    assert res.status_code == 200
    assert res.json()["email"] == "me@example.com"


def test_protected_projects_requires_auth():
    res = client.get("/api/projects")
    assert res.status_code == 401


def test_project_crud_flow():
    headers = _auth_headers("projects@example.com")
    create = client.post("/api/projects", headers=headers, json={"name": "My App"})
    assert create.status_code == 200
    project_id = create.json()["id"]

    listed = client.get("/api/projects", headers=headers)
    assert any(p["id"] == project_id for p in listed.json())

    fetched = client.get(f"/api/projects/{project_id}", headers=headers)
    assert fetched.json()["name"] == "My App"

    updated = client.patch(f"/api/projects/{project_id}", headers=headers, json={"name": "Renamed"})
    assert updated.json()["name"] == "Renamed"

    deleted = client.delete(f"/api/projects/{project_id}", headers=headers)
    assert deleted.status_code == 200
    assert client.get(f"/api/projects/{project_id}", headers=headers).status_code == 404


def test_project_not_found():
    headers = _auth_headers("missing@example.com")
    res = client.get("/api/projects/does-not-exist", headers=headers)
    assert res.status_code == 404


def test_shared_project_returns_limited_fields():
    headers = _auth_headers("share@example.com")
    create = client.post("/api/projects", headers=headers, json={"name": "Public App"})
    project_id = create.json()["id"]

    from app.database import SessionLocal
    from app.models import Project

    db = SessionLocal()
    try:
        project = db.get(Project, project_id)
        assert project is not None
        project.current_code = "<html><body>Hello share</body></html>"
        db.commit()
    finally:
        db.close()

    deploy = client.post(f"/api/projects/{project_id}/deploy", headers=headers)
    slug = deploy.json()["share_slug"]

    shared = client.get(f"/api/share/{slug}")
    assert shared.status_code == 200
    data = shared.json()
    assert set(data.keys()) == {"name", "current_code"}
    assert data["name"] == "Public App"
    assert "Hello share" in data["current_code"]


def test_shared_project_not_found():
    res = client.get("/api/share/not-a-real-slug")
    assert res.status_code == 404


def test_credits_purchase_and_orders():
    headers = _auth_headers("credits@example.com")
    me_before = client.get("/api/auth/me", headers=headers).json()
    purchase = client.post("/api/credits/purchase", headers=headers, json={"plan_tier": "pro"})
    assert purchase.status_code == 200
    assert purchase.json()["credits"] == me_before["credits"] + 50

    orders = client.get("/api/credits/orders", headers=headers)
    assert orders.status_code == 200
    assert len(orders.json()) >= 1


def test_login_invalid_credentials():
    headers = _auth_headers("badlogin@example.com")
    assert headers["Authorization"].startswith("Bearer ")
    res = client.post(
        "/api/auth/login",
        json={"email": "badlogin@example.com", "password": "wrong-password"},
    )
    assert res.status_code == 401


def test_supabase_sync_creates_user():
    res = client.post(
        "/api/auth/sync",
        json={
            "supabase_uid": "uid-123",
            "email": "supa@example.com",
            "name": "Supa User",
        },
    )
    assert res.status_code == 200
    assert res.json()["user"]["email"] == "supa@example.com"


def test_chat_request_validation():
    headers = _auth_headers("chatval@example.com")
    create = client.post("/api/projects", headers=headers, json={"name": "Chat Val"})
    project_id = create.json()["id"]
    res = client.post(
        f"/api/projects/{project_id}/plan",
        headers=headers,
        json={"message": "x" * 8001},
    )
    assert res.status_code == 422
