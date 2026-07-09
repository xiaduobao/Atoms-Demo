from app.exceptions import error_body, public_error_message, sse_error_line
from app.main import app
from fastapi.testclient import TestClient

client = TestClient(app)


def test_http_exception_unified_format():
    res = client.get("/api/projects")
    assert res.status_code == 401
    data = res.json()
    assert data["error"]["code"] == "UNAUTHORIZED"
    assert data["error"]["message"] == "Not authenticated"


def test_validation_error_unified_format():
    res = client.post("/api/auth/register", json={"email": "not-an-email"})
    assert res.status_code == 422
    data = res.json()
    assert data["error"]["code"] == "VALIDATION_ERROR"
    assert data["error"]["message"] == "Validation failed"
    assert isinstance(data["error"]["details"], list)


def test_not_found_unified_format():
    reg = client.post(
        "/api/auth/register",
        json={"email": "errfmt@example.com", "password": "secret1234", "name": "Err"},
    )
    if reg.status_code == 400:
        reg = client.post(
            "/api/auth/login",
            json={"email": "errfmt@example.com", "password": "secret1234"},
        )
    token = reg.json()["access_token"]
    res = client.get("/api/projects/missing-id", headers={"Authorization": f"Bearer {token}"})
    assert res.status_code == 404
    assert res.json()["error"]["code"] == "NOT_FOUND"


def test_sse_error_line_includes_code():
    line = sse_error_line(RuntimeError("boom"), code="STREAM_ERROR")
    assert '"type": "error"' in line
    assert '"code": "STREAM_ERROR"' in line
    assert "boom" in line


def test_public_error_message_sanitized_in_production(monkeypatch):
    from app.config import settings

    monkeypatch.setattr(settings, "app_env", "production")
    msg = public_error_message(RuntimeError("boom"))
    assert "boom" not in msg
    assert "internal error" in msg.lower()

    monkeypatch.setattr(settings, "app_env", "development")
    assert "boom" in public_error_message(RuntimeError("boom"))


def test_error_body_helper():
    body = error_body("TEST", "hello", details=[1])
    assert body == {"error": {"code": "TEST", "message": "hello", "details": [1]}}
