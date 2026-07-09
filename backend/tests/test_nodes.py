from agents.nodes import _finalize_engineer_output


def test_finalize_engineer_parses_json_project():
    raw = """{"files":[{"path":"frontend/index.html","language":"html","content":"<html></html>"}],"entry":"frontend/index.html"}"""
    result = _finalize_engineer_output(raw)
    assert result["current_code"]
    assert result["files_json"]
    assert result["current_agent"] == "engineer"


def test_finalize_engineer_html_fallback():
    result = _finalize_engineer_output("<!DOCTYPE html><html><body>Hi</body></html>")
    assert "Hi" in result["current_code"]
    assert result["files_json"]
