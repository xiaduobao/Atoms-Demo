from langgraph.checkpoint.memory import MemorySaver
from langgraph.graph import END, START, StateGraph

from agents.nodes import run_architect, run_engineer, run_pm, run_researcher
from agents.state import AgentState


def build_plan_graph():
    graph = StateGraph(AgentState)
    graph.add_node("researcher", run_researcher)
    graph.add_node("pm", run_pm)
    graph.add_node("architect", run_architect)
    graph.add_edge(START, "researcher")
    graph.add_edge("researcher", "pm")
    graph.add_edge("pm", "architect")
    graph.add_edge("architect", END)
    return graph.compile(checkpointer=MemorySaver())


def build_generate_graph():
    graph = StateGraph(AgentState)
    graph.add_node("engineer", run_engineer)
    graph.add_edge(START, "engineer")
    graph.add_edge("engineer", END)
    return graph.compile(checkpointer=MemorySaver())


plan_graph = build_plan_graph()
generate_graph = build_generate_graph()
