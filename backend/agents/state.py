from typing import Annotated, TypedDict

from langgraph.graph.message import add_messages


class AgentState(TypedDict, total=False):
    user_prompt: str
    research: str
    plan: str
    architecture: str
    files_json: str
    preview_html: str
    current_code: str
    current_agent: str
    race_mode: bool
    race_variants: list[dict]
    approved: bool
    messages: Annotated[list, add_messages]
