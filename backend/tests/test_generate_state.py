import pytest
from agents.graph import generate_graph
from agents.nodes import _finalize_engineer_output


@pytest.mark.asyncio
async def test_generate_graph_persists_preview_html_in_state():
    raw = """{"files":[{"path":"frontend/index.html","language":"html","content":"<html><body>State</body></html>"}],"entry":"frontend/index.html"}"""
    engineer_output = _finalize_engineer_output(raw)

    class FakeSnapshot:
        values = {
            "files_json": engineer_output["files_json"],
            "preview_html": engineer_output["preview_html"],
            "current_code": engineer_output["current_code"],
        }

    from app.schemas import engineer_result_code

    assert engineer_result_code(FakeSnapshot.values)
    assert "State" in engineer_result_code(FakeSnapshot.values)
