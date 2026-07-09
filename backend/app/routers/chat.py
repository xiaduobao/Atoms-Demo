import asyncio
import json
import logging
import uuid
from collections.abc import AsyncGenerator
from datetime import UTC, datetime

from agents.graph import generate_graph, plan_graph
from agents.iterate import stream_iterate_tokens
from agents.nodes import _finalize_engineer_output, run_engineer_race
from agents.prompts import ENGINEER_RACE_STYLES
from agents.state import AgentState
from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import StreamingResponse
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.auth import get_current_user
from app.database import SessionLocal, get_db
from app.exceptions import sse_error_line
from app.models import CodeVersion, Message, Project, RaceVariant, User
from app.schemas import (
    ChatRequest,
    CodeVersionOut,
    DeployResponse,
    MessageOut,
    ProjectOut,
    RaceVariantOut,
    engineer_result_code,
    files_json_for_iterate,
    generate_share_slug,
    preview_code_from_files,
    preview_error_reason,
)

router = APIRouter(prefix="/api/projects", tags=["chat"])
logger = logging.getLogger(__name__)


def _get_owned_project(project_id: str, user: User, db: Session) -> Project:
    project = db.get(Project, project_id)
    if not project or project.user_id != user.id:
        raise HTTPException(status_code=404, detail="Project not found")
    return project


def _sse_done_payload(result: dict) -> dict:
    code = engineer_result_code(result)
    payload: dict = {
        "type": "done",
        "code": code,
        "files_json": result.get("files_json"),
    }
    err = result.get("preview_error") or preview_error_reason(code)
    if err:
        payload["preview_error"] = err
    return payload


def _deduct_credits(user: User, db: Session, amount: int) -> None:
    if user.credits < amount:
        raise HTTPException(status_code=402, detail="Insufficient credits")
    user.credits -= amount
    db.commit()


@router.get("/{project_id}/messages", response_model=list[MessageOut])
def list_messages(
    project_id: str,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> list[Message]:
    _get_owned_project(project_id, user, db)
    return list(
        db.scalars(
            select(Message)
            .where(Message.project_id == project_id)
            .order_by(Message.created_at.asc())
        )
    )


@router.post("/{project_id}/plan")
async def create_plan(
    project_id: str,
    payload: ChatRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> StreamingResponse:
    project = _get_owned_project(project_id, user, db)
    _deduct_credits(user, db, 1)

    db.add(Message(project_id=project_id, role="user", content=payload.message))
    if not project.thread_id:
        project.thread_id = str(uuid.uuid4())
    project.status = "planning"
    db.commit()

    thread_config = {"configurable": {"thread_id": project.thread_id}}
    initial_state: AgentState = {
        "user_prompt": payload.message,
        "race_mode": payload.race_mode,
    }

    async def event_stream() -> AsyncGenerator[str, None]:
        try:
            async for event in plan_graph.astream(
                initial_state, config=thread_config, stream_mode="updates"
            ):
                for node_name, node_output in event.items():
                    agent = node_output.get("current_agent", node_name)
                    content_key = {
                        "researcher": "research",
                        "pm": "plan",
                        "architect": "architecture",
                    }.get(agent, "content")
                    content = node_output.get(content_key, "")
                    session = SessionLocal()
                    try:
                        proj = session.get(Project, project_id)
                        if proj and agent == "pm":
                            proj.pending_plan = content
                        session.add(
                            Message(
                                project_id=project_id,
                                role="assistant",
                                agent_type=agent,
                                content=content,
                            )
                        )
                        session.commit()
                    finally:
                        session.close()
                    yield f"data: {json.dumps({'type': 'node_done', 'agent': agent, 'content': content})}\n\n"
            yield f"data: {json.dumps({'type': 'await_approve'})}\n\n"
        except Exception as exc:
            logger.exception("Plan stream failed for project %s", project_id)
            yield sse_error_line(exc)

    return StreamingResponse(event_stream(), media_type="text/event-stream")


@router.post("/{project_id}/generate")
async def generate_app(
    project_id: str,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> StreamingResponse:
    project = _get_owned_project(project_id, user, db)
    if not project.pending_plan and not project.thread_id:
        raise HTTPException(status_code=400, detail="No pending plan")
    _deduct_credits(user, db, 1)

    async def event_stream() -> AsyncGenerator[str, None]:
        yield f"data: {json.dumps({'type': 'agent', 'agent': 'engineer', 'status': 'started'})}\n\n"
        try:
            state: AgentState = {
                "user_prompt": project.pending_plan or "",
                "plan": project.pending_plan or "",
                "architecture": "",
            }
            for m in db.scalars(
                select(Message).where(
                    Message.project_id == project_id, Message.agent_type == "architect"
                )
            ):
                state["architecture"] = m.content

            thread_config = {"configurable": {"thread_id": project.thread_id or str(uuid.uuid4())}}
            async for custom in generate_graph.astream(
                state, config=thread_config, stream_mode="custom"
            ):
                if isinstance(custom, dict) and custom.get("type") == "chunk":
                    yield f"data: {json.dumps({'type': 'chunk', 'content': custom['content']})}\n\n"

            snapshot = await generate_graph.aget_state(thread_config)
            result = snapshot.values if snapshot else {}
        except Exception as exc:
            logger.exception("Generate stream failed for project %s", project_id)
            yield sse_error_line(exc)
            return

        session = SessionLocal()
        try:
            proj = session.get(Project, project_id)
            if proj:
                code = engineer_result_code(result)
                proj.current_code = code
                proj.files_json = result.get("files_json")
                proj.pending_plan = None
                proj.status = "ready"
                session.add(
                    Message(
                        project_id=project_id,
                        role="assistant",
                        agent_type="engineer",
                        content="App generated successfully.",
                    )
                )
                session.add(
                    CodeVersion(
                        project_id=project_id,
                        code=code,
                        files_json=result.get("files_json"),
                        prompt="generate",
                    )
                )
                session.commit()
        finally:
            session.close()
        yield f"data: {json.dumps(_sse_done_payload(result))}\n\n"

    return StreamingResponse(event_stream(), media_type="text/event-stream")


@router.post("/{project_id}/race")
async def race_generate(
    project_id: str,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    project = _get_owned_project(project_id, user, db)
    if not project.pending_plan:
        raise HTTPException(status_code=400, detail="Need a plan first")
    _deduct_credits(user, db, 2)

    state = {
        "user_prompt": project.pending_plan,
        "plan": project.pending_plan,
        "architecture": "",
    }
    for m in db.scalars(
        select(Message).where(Message.project_id == project_id, Message.agent_type == "architect")
    ):
        state["architecture"] = m.content

    results = await asyncio.gather(
        *[run_engineer_race(state, label, hint) for label, hint in ENGINEER_RACE_STYLES]
    )

    db.query(RaceVariant).filter(RaceVariant.project_id == project_id).delete()
    variants = []
    for i, result in enumerate(results):
        variant = RaceVariant(
            project_id=project_id,
            variant_index=i,
            style_label=result.get("style_label", f"Variant {i + 1}"),
            preview_html=result.get("preview_html", ""),
            files_json=result.get("files_json"),
        )
        db.add(variant)
        variants.append(variant)
    project.status = "race"
    db.commit()
    for v in variants:
        db.refresh(v)
    return [RaceVariantOut.model_validate(v) for v in variants]


@router.post("/{project_id}/race/select")
def select_race_variant(
    project_id: str,
    variant_id: str = Query(...),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> ProjectOut:
    project = _get_owned_project(project_id, user, db)
    variant = db.get(RaceVariant, variant_id)
    if not variant or variant.project_id != project_id:
        raise HTTPException(status_code=404, detail="Variant not found")
    project.current_code = variant.preview_html
    project.files_json = variant.files_json
    project.status = "ready"
    project.pending_plan = None
    db.add(
        Message(
            project_id=project_id,
            role="assistant",
            agent_type="engineer",
            content=f"Selected race variant: {variant.style_label}",
        )
    )
    db.commit()
    db.refresh(project)
    return project


@router.post("/{project_id}/iterate")
async def iterate_app(
    project_id: str,
    payload: ChatRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> StreamingResponse:
    project = _get_owned_project(project_id, user, db)
    if not project.current_code and not project.files_json:
        raise HTTPException(status_code=400, detail="No app to iterate")
    _deduct_credits(user, db, 1)

    db.add(Message(project_id=project_id, role="user", content=payload.message))
    db.commit()

    async def event_stream() -> AsyncGenerator[str, None]:
        yield f"data: {json.dumps({'type': 'agent', 'agent': 'engineer', 'status': 'started'})}\n\n"
        chunks: list[str] = []
        try:
            async for chunk in stream_iterate_tokens(
                files_json_for_iterate(project.files_json, project.current_code),
                payload.message,
            ):
                chunks.append(chunk)
                yield f"data: {json.dumps({'type': 'chunk', 'content': chunk})}\n\n"
        except Exception as exc:
            logger.exception("Iterate stream failed for project %s", project_id)
            yield sse_error_line(exc)
            return

        result = _finalize_engineer_output("".join(chunks))
        session = SessionLocal()
        try:
            proj = session.get(Project, project_id)
            if proj:
                code = engineer_result_code(result)
                proj.current_code = code
                proj.files_json = result.get("files_json")
                session.add(
                    Message(
                        project_id=project_id,
                        role="assistant",
                        agent_type="engineer",
                        content=f"Updated: {payload.message}",
                    )
                )
                session.add(
                    CodeVersion(
                        project_id=project_id,
                        code=code,
                        files_json=result.get("files_json"),
                        prompt=payload.message,
                    )
                )
                session.commit()
        finally:
            session.close()
        yield f"data: {json.dumps(_sse_done_payload(result))}\n\n"

    return StreamingResponse(event_stream(), media_type="text/event-stream")


@router.get("/{project_id}/versions", response_model=list[CodeVersionOut])
def list_versions(
    project_id: str,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> list[CodeVersion]:
    _get_owned_project(project_id, user, db)
    return list(
        db.scalars(
            select(CodeVersion)
            .where(CodeVersion.project_id == project_id)
            .order_by(CodeVersion.created_at.desc())
        )
    )


@router.post("/{project_id}/versions/{version_id}/restore", response_model=CodeVersionOut)
def restore_version(
    project_id: str,
    version_id: str,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> CodeVersion:
    project = _get_owned_project(project_id, user, db)
    version = db.get(CodeVersion, version_id)
    if not version or version.project_id != project_id:
        raise HTTPException(status_code=404, detail="Version not found")
    project.current_code = version.code
    project.files_json = version.files_json
    project.status = "ready"
    db.commit()
    db.refresh(version)
    return version


@router.post("/{project_id}/deploy", response_model=DeployResponse)
def deploy_project(
    project_id: str,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> DeployResponse:
    project = _get_owned_project(project_id, user, db)
    if not preview_code_from_files(project.files_json) and not project.current_code:
        raise HTTPException(status_code=400, detail="Nothing to deploy")
    if not project.current_code and project.files_json:
        project.current_code = preview_code_from_files(project.files_json)
    if not project.share_slug:
        project.share_slug = generate_share_slug()
    project.is_public = True
    project.deployed_at = datetime.now(UTC)
    project.status = "deployed"
    db.commit()
    return DeployResponse(
        share_url=f"/share/{project.share_slug}",
        share_slug=project.share_slug,
    )
