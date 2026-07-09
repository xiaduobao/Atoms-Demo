from collections.abc import AsyncGenerator

from langchain_core.messages import HumanMessage, SystemMessage

from agents.nodes import _finalize_engineer_output, get_llm
from agents.prompts import ENGINEER_ITERATE_SYSTEM


async def stream_iterate_tokens(files_json: str, user_message: str) -> AsyncGenerator[str, None]:
    llm = get_llm(streaming=True)
    prompt = f"""Current files JSON:
{files_json}

User modification: {user_message}

Return updated JSON."""
    async for chunk in llm.astream(
        [SystemMessage(content=ENGINEER_ITERATE_SYSTEM), HumanMessage(content=prompt)]
    ):
        if chunk.content:
            yield str(chunk.content)


async def iterate_and_finalize(files_json: str, user_message: str) -> dict:
    llm = get_llm()
    prompt = f"""Current files JSON:
{files_json}

User modification: {user_message}

Return updated JSON."""
    response = await llm.ainvoke(
        [SystemMessage(content=ENGINEER_ITERATE_SYSTEM), HumanMessage(content=prompt)]
    )
    return _finalize_engineer_output(str(response.content))
