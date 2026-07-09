import json
import re
import secrets
from typing import Any

from pydantic import BaseModel, EmailStr, Field, model_validator


class UserRegister(BaseModel):
    email: EmailStr
    password: str = Field(min_length=6, max_length=128)
    name: str = Field(min_length=1, max_length=100)


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class SupabaseSync(BaseModel):
    supabase_uid: str
    email: EmailStr
    name: str = Field(min_length=1, max_length=100)


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: "UserOut"


class UserOut(BaseModel):
    id: str
    email: str
    name: str
    credits: int
    plan_tier: str
    created_at: Any

    model_config = {"from_attributes": True}


class ProjectCreate(BaseModel):
    name: str = Field(min_length=1, max_length=200)


class ProjectUpdate(BaseModel):
    name: str | None = None


class ProjectOut(BaseModel):
    id: str
    user_id: str
    name: str
    current_code: str | None
    files_json: str | None
    status: str
    pending_plan: str | None
    thread_id: str | None
    share_slug: str | None
    is_public: bool
    deployed_at: Any | None
    created_at: Any
    updated_at: Any

    model_config = {"from_attributes": True}

    @model_validator(mode="after")
    def fill_preview_code(self) -> "ProjectOut":
        if not self.current_code and self.files_json:
            self.current_code = preview_code_from_files(self.files_json)
        return self


class SharedProjectOut(BaseModel):
    name: str
    current_code: str | None

    model_config = {"from_attributes": True}

    @model_validator(mode="before")
    @classmethod
    def resolve_preview(cls, data: Any) -> Any:
        if hasattr(data, "name"):
            return {
                "name": data.name,
                "current_code": data.current_code or preview_code_from_files(data.files_json),
            }
        if isinstance(data, dict):
            current_code = data.get("current_code") or preview_code_from_files(data.get("files_json"))
            return {"name": data["name"], "current_code": current_code}
        return data


class MessageOut(BaseModel):
    id: str
    project_id: str
    role: str
    agent_type: str | None
    content: str
    created_at: Any

    model_config = {"from_attributes": True}


class ChatRequest(BaseModel):
    message: str = Field(min_length=1, max_length=8000)
    race_mode: bool = False


class PlanResponse(BaseModel):
    plan: str
    project: ProjectOut


class CodeVersionOut(BaseModel):
    id: str
    project_id: str
    code: str
    files_json: str | None
    prompt: str | None
    created_at: Any

    model_config = {"from_attributes": True}


class RaceVariantOut(BaseModel):
    id: str
    project_id: str
    variant_index: int
    style_label: str
    preview_html: str
    files_json: str | None
    created_at: Any

    model_config = {"from_attributes": True}


class DeployResponse(BaseModel):
    share_url: str
    share_slug: str


class PurchaseRequest(BaseModel):
    plan_tier: str = Field(pattern="^(pro|enterprise)$")


class ProjectFiles(BaseModel):
    files: list[dict[str, str]]
    entry: str = "frontend/index.html"


def extract_html(text: str) -> str:
    text = text.strip()
    html_block = re.search(r"```(?:html)?\s*(<!DOCTYPE html[\s\S]*?)```", text, re.IGNORECASE)
    if html_block:
        return html_block.group(1).strip()
    if text.lower().startswith("<!doctype html") or text.lower().startswith("<html"):
        return text
    html_start = re.search(r"(<!DOCTYPE html[\s\S]*)", text, re.IGNORECASE)
    if html_start:
        return html_start.group(1).strip()
    return text


def parse_project_files(raw: str) -> ProjectFiles | None:
    try:
        cleaned = raw.strip()
        if cleaned.startswith("```"):
            cleaned = re.sub(r"^```(?:json)?\s*", "", cleaned)
            cleaned = re.sub(r"\s*```$", "", cleaned)
        data = json.loads(cleaned)
        return ProjectFiles.model_validate(data)
    except (json.JSONDecodeError, ValueError):
        return None


def engineer_result_code(result: dict) -> str:
    return result.get("current_code") or result.get("preview_html") or ""


def preview_code_from_files(files_json: str | None) -> str | None:
    if not files_json:
        return None
    project_files = parse_project_files(files_json)
    if project_files:
        return merge_for_preview(project_files)
    return None


def files_json_for_iterate(files_json: str | None, current_code: str | None) -> str:
    if files_json:
        return files_json
    if current_code:
        return json.dumps(
            {
                "files": [
                    {
                        "path": "frontend/index.html",
                        "language": "html",
                        "content": current_code,
                    }
                ],
                "entry": "frontend/index.html",
            }
        )
    return ""


def merge_for_preview(project_files: ProjectFiles) -> str:
    entry = project_files.entry
    files_map = {f["path"]: f["content"] for f in project_files.files}
    html = files_map.get(entry, "")
    if not html:
        for path, content in files_map.items():
            if path.endswith(".html"):
                html = content
                break
    css = "\n".join(c for p, c in files_map.items() if p.endswith(".css"))
    js = "\n".join(c for p, c in files_map.items() if p.endswith(".js"))
    if css and "</head>" in html:
        html = html.replace("</head>", f"<style>{css}</style></head>", 1)
    elif css:
        html = f"<style>{css}</style>{html}"
    if js and "</body>" in html:
        html = html.replace("</body>", f"<script>{js}</script></body>", 1)
    elif js:
        html = f"{html}<script>{js}</script>"
    return html


def generate_share_slug() -> str:
    return secrets.token_urlsafe(8)
