import json

from app.config import settings
from app.schemas import extract_html, merge_for_preview, parse_project_files
from langchain_core.messages import HumanMessage, SystemMessage
from langchain_openai import ChatOpenAI
from langgraph.config import get_stream_writer

from agents.prompts import (
    ARCHITECT_SYSTEM,
    ENGINEER_ITERATE_SYSTEM,
    ENGINEER_SYSTEM,
    PLAN_SYSTEM,
    RESEARCHER_SYSTEM,
)


def get_llm(*, streaming: bool = False, temperature: float = 0.4) -> ChatOpenAI:
    return ChatOpenAI(
        api_key=settings.llm_api_key or "not-set",
        base_url=settings.llm_base_url,
        model=settings.llm_model,
        temperature=temperature,
        streaming=streaming,
        max_tokens=8192,
    )


async def run_researcher(state: dict) -> dict:
    llm = get_llm()
    response = await llm.ainvoke(
        [
            SystemMessage(content=RESEARCHER_SYSTEM),
            HumanMessage(content=state["user_prompt"]),
        ]
    )
    research = str(response.content)
    return {"research": research, "current_agent": "researcher"}


async def run_pm(state: dict) -> dict:
    llm = get_llm()
    prompt = f"User idea:\n{state['user_prompt']}\n\nResearch:\n{state.get('research', '')}"
    response = await llm.ainvoke([SystemMessage(content=PLAN_SYSTEM), HumanMessage(content=prompt)])
    plan = str(response.content)
    return {"plan": plan, "pending_plan": plan, "current_agent": "pm"}


async def run_architect(state: dict) -> dict:
    llm = get_llm()
    response = await llm.ainvoke(
        [
            SystemMessage(content=ARCHITECT_SYSTEM),
            HumanMessage(content=state.get("plan", "")),
        ]
    )
    architecture = str(response.content)
    return {"architecture": architecture, "current_agent": "architect"}


async def run_engineer(state: dict) -> dict:
    writer = get_stream_writer()
    llm = get_llm(streaming=True)
    prompt = f"""User request: {state["user_prompt"]}

Plan:
{state.get("plan", "")}

Architecture:
{state.get("architecture", "")}

Generate the JSON project now."""
    chunks: list[str] = []
    async for chunk in llm.astream(
        [SystemMessage(content=ENGINEER_SYSTEM), HumanMessage(content=prompt)]
    ):
        if chunk.content:
            text = str(chunk.content)
            chunks.append(text)
            writer({"type": "chunk", "content": text})
    return _finalize_engineer_output("".join(chunks))


async def run_engineer_iterate(state: dict) -> dict:
    llm = get_llm()
    prompt = f"""Current files JSON:
{state.get("files_json", "")}

User modification: {state["user_prompt"]}

Return updated JSON."""
    response = await llm.ainvoke(
        [SystemMessage(content=ENGINEER_ITERATE_SYSTEM), HumanMessage(content=prompt)]
    )
    return _finalize_engineer_output(str(response.content))


async def run_engineer_race(state: dict, style_label: str, style_hint: str) -> dict:
    llm = get_llm(temperature=0.7)
    prompt = f"""User request: {state["user_prompt"]}
Plan: {state.get("plan", "")}
Architecture: {state.get("architecture", "")}
Visual style: {style_hint}

Generate the JSON project now."""
    response = await llm.ainvoke(
        [SystemMessage(content=ENGINEER_SYSTEM), HumanMessage(content=prompt)]
    )
    result = _finalize_engineer_output(str(response.content))
    result["style_label"] = style_label
    return result


def _finalize_engineer_output(raw: str) -> dict:
    project_files = parse_project_files(raw)
    if project_files:
        files_json = json.dumps(project_files.model_dump())
        preview_html = merge_for_preview(project_files)
        return {
            "files_json": files_json,
            "preview_html": preview_html,
            "current_code": preview_html,
            "current_agent": "engineer",
        }
    html = extract_html(raw)
    files_json = json.dumps(
        {
            "files": [{"path": "frontend/index.html", "language": "html", "content": html}],
            "entry": "frontend/index.html",
        }
    )
    return {
        "files_json": files_json,
        "preview_html": html,
        "current_code": html,
        "current_agent": "engineer",
    }
