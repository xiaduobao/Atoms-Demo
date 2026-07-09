import pytest
from app.schemas import (
    ChatRequest,
    ProjectFiles,
    ProjectOut,
    engineer_result_code,
    extract_html,
    generate_share_slug,
    merge_for_preview,
    parse_project_files,
    preview_code_from_files,
)
from pydantic import ValidationError


def test_extract_html_from_fence():
    raw = "```html\n<!DOCTYPE html><html><body>Hi</body></html>\n```"
    result = extract_html(raw)
    assert "<!DOCTYPE html>" in result


def test_parse_project_files_valid():
    raw = """{"files":[{"path":"frontend/index.html","language":"html","content":"<html></html>"}],"entry":"frontend/index.html"}"""
    parsed = parse_project_files(raw)
    assert parsed is not None
    assert len(parsed.files) == 1


def test_parse_project_files_invalid():
    assert parse_project_files("not json") is None


def test_extract_html_raw_doctype():
    raw = "<!DOCTYPE html><html><body>Raw</body></html>"
    assert extract_html(raw).startswith("<!DOCTYPE html>")


def test_extract_html_from_json_fence():
    raw = '```json\n{"x":1}\n```'
    assert extract_html(raw) == raw.strip()


def test_chat_request_max_length():
    with pytest.raises(ValidationError):
        ChatRequest(message="x" * 8001)


def test_merge_for_preview_injects_css_and_js():
    project_files = ProjectFiles.model_validate(
        {
            "files": [
                {
                    "path": "frontend/index.html",
                    "language": "html",
                    "content": "<html><head></head><body></body></html>",
                },
                {"path": "frontend/style.css", "language": "css", "content": "body{color:red}"},
                {"path": "frontend/app.js", "language": "js", "content": "console.log(1)"},
            ],
            "entry": "frontend/index.html",
        }
    )
    html = merge_for_preview(project_files)
    assert "body{color:red}" in html
    assert "console.log(1)" in html


def test_generate_share_slug_unique():
    assert generate_share_slug() != generate_share_slug()


def test_engineer_result_code_prefers_preview_html():
    assert engineer_result_code({"preview_html": "<html></html>"}) == "<html></html>"
    assert (
        engineer_result_code({"current_code": "<html>a</html>", "preview_html": "<html>b</html>"})
        == "<html>a</html>"
    )


def test_preview_code_from_files():
    files_json = """{"files":[{"path":"frontend/index.html","language":"html","content":"<html><body>Hi</body></html>"}],"entry":"frontend/index.html"}"""
    html = preview_code_from_files(files_json)
    assert html and "Hi" in html


def test_project_out_fills_missing_current_code():
    files_json = """{"files":[{"path":"frontend/index.html","language":"html","content":"<html><body>Preview</body></html>"}],"entry":"frontend/index.html"}"""
    project = ProjectOut.model_validate(
        {
            "id": "1",
            "user_id": "u1",
            "name": "test",
            "current_code": None,
            "files_json": files_json,
            "status": "ready",
            "pending_plan": None,
            "thread_id": None,
            "share_slug": None,
            "is_public": False,
            "deployed_at": None,
            "created_at": "2026-01-01T00:00:00Z",
            "updated_at": "2026-01-01T00:00:00Z",
        }
    )
    assert project.current_code and "Preview" in project.current_code
