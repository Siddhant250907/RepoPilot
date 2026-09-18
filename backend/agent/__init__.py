"""
Agent Core Package.

Owner: Person 1

Houses the cognitive brain of RepoPilot:
- AgentCore (orchestrator)
- LLMInterface (model communication)
- Planner (goal decomposition)
- AgentMemory (working context & trajectory)
- OutputParser (structured reasoning & tool call parsing)
- ToolRegistry (dynamic tool registration and dispatch)
- EventBus / AgentEvent (real-time trace event emission)
- create_default_registry (composition helper for Person 2 tools)
"""

from backend.agent.agent import AgentCore, Agent, create_default_registry
from backend.agent.registry import ToolRegistry
from backend.agent.memory import AgentMemory
from backend.agent.planner import Planner
from backend.agent.llm import LLMInterface, BaseLLM
from backend.agent.parser import OutputParser
from backend.agent.events import EventBus, AgentEvent, EventType

__all__ = [
    "AgentCore",
    "Agent",
    "create_default_registry",
    "ToolRegistry",
    "AgentMemory",
    "Planner",
    "LLMInterface",
    "BaseLLM",
    "OutputParser",
    "EventBus",
    "AgentEvent",
    "EventType",
]
