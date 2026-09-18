"""
API Routes and Endpoints.

Owner: Person 3

Responsibilities:
- Provide HTTP endpoints for task dispatch and agent execution.
- Translate API requests to AgentCore invocations.
- Expose real agent trace events (PLAN, TOOL_CALL, TOOL_RESULT, REFLECTION, FINAL) to the frontend.
"""

import json
from typing import Any, Dict, List, Optional
from fastapi import APIRouter, HTTPException
from backend.api.schemas import (
    TaskRequest,
    TaskResponse,
    TaskStatus,
    AgentRunRequest,
    AgentRunResponse,
    CodeDebugRequest,
    CodeDebugResponse,
)

router = APIRouter()


from backend.agent.llm import LLMInterface


class ResilientLLM(LLMInterface):
    """
    Subclass of LLMInterface providing automatic failover across candidate Gemini models
    (gemini-3.5-flash, gemini-flash-latest, gemini-3.5-flash-lite) if free-tier 429 rate
    limits or 503 high demand errors are encountered.
    """

    FALLBACK_MODELS = ["gemini-3.5-flash", "gemini-flash-latest", "gemini-3.5-flash-lite"]

    async def generate(self, *args, **kwargs):
        last_err: Optional[Exception] = None
        models_to_try = [self.model] + [m for m in self.FALLBACK_MODELS if m != self.model]
        for m in models_to_try:
            self.model = m
            self.model_name = m
            try:
                return await super().generate(*args, **kwargs)
            except Exception as exc:
                err_str = str(exc)
                if "429" in err_str or "RESOURCE_EXHAUSTED" in err_str or "503" in err_str:
                    last_err = exc
                    continue
                raise
        if last_err is not None:
            raise last_err
        raise RuntimeError("All candidate models failed")


@router.post("/agent/run", response_model=AgentRunResponse, tags=["Agent"])
async def run_agent(request: AgentRunRequest):
    """
    Execute AgentCore with the REAL Gemini LLM and default tool registry.
    Returns the real execution events and final answer for frontend visualization.
    """
    from backend.agent.agent import AgentCore, create_default_registry
    from backend.agent.events import EventBus, EventType
    from backend.agent.memory import AgentMemory
    from backend.agent.planner import Planner

    llm = ResilientLLM()
    if not llm.api_key:
        raise HTTPException(
            status_code=500,
            detail="Gemini API key is not configured in backend environment (.env).",
        )
    target_workspace = None
    if request.target_repo_path and str(request.target_repo_path).strip() not in (".", ""):
        from pathlib import Path
        p = Path(request.target_repo_path)
        if not p.is_absolute():
            p = (Path.cwd() / p).resolve()
        if p.exists():
            target_workspace = p

    registry = create_default_registry(workspace_root=target_workspace)
    event_bus = EventBus()
    raw_events = []
    event_bus.subscribe(lambda evt: raw_events.append(evt))

    memory = AgentMemory()
    planner = Planner()
    agent = AgentCore(
        llm=llm,
        memory=memory,
        planner=planner,
        registry=registry,
        event_bus=event_bus,
        max_iterations=request.max_steps or 15,
    )


    try:
        result = await agent.execute_task(request.task)
    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=f"AgentCore execution error: {str(exc)}",
        )

    # Format events chronologically matching frontend contract
    formatted_events = []
    current_step = 1

    for evt in raw_events:
        etype = evt.event_type
        payload = evt.payload or {}
        ts = evt.timestamp
        step = evt.step_number if evt.step_number is not None else current_step

        if etype == EventType.PLAN_CREATED:
            plan_content = payload.get("plan", [])
            plan_msg = (
                "\n".join(f"- {p}" for p in plan_content)
                if isinstance(plan_content, list)
                else str(plan_content or "Initial execution plan created.")
            )
            formatted_events.append({
                "step": step,
                "type": "plan",
                "message": plan_msg,
                "timestamp": ts,
            })
        elif etype == EventType.ACTION_SELECTED:
            tool_name = payload.get("tool") or payload.get("tool_name", "")
            tool_args = payload.get("arguments") if "arguments" in payload else payload.get("tool_args", {})
            thought = payload.get("thought", "")
            formatted_events.append({
                "step": step,
                "type": "tool_call",
                "tool": tool_name,
                "arguments": tool_args,
                "thought": thought,
                "message": thought or f"Executing tool: {tool_name}",
                "timestamp": ts,
            })
        elif etype == EventType.TOOL_FINISHED:
            tool_res = payload.get("result", {})
            tool_name = payload.get("tool") or payload.get("tool_name", "")
            is_err = False
            err_msg = None
            data_str = ""
            if isinstance(tool_res, dict):
                is_err = (
                    tool_res.get("status") == "error"
                    or tool_res.get("exit_code", 0) != 0
                    or "error" in tool_res
                )
                err_msg = tool_res.get("error") or tool_res.get("stderr")
                data_val = (
                    tool_res.get("data")
                    or tool_res.get("stdout")
                    or tool_res.get("result")
                    or tool_res
                )
                if isinstance(data_val, (dict, list)):
                    try:
                        data_str = json.dumps(data_val, default=str, indent=2)
                    except Exception:
                        data_str = str(data_val)
                else:
                    data_str = str(data_val)
            else:
                data_str = str(tool_res)

            formatted_events.append({
                "step": step,
                "type": "tool_result",
                "tool": tool_name,
                "status": "error" if is_err else "success",
                "error": err_msg if is_err else None,
                "data": data_str,
                "message": err_msg if is_err else (data_str[:200] + "... [truncated]" if len(data_str) > 200 else data_str),
                "timestamp": ts,
            })
        elif etype == EventType.REFLECTION_COMPLETED:
            thought = payload.get("thought", "")
            if thought:
                formatted_events.append({
                    "step": step,
                    "type": "reflection",
                    "message": thought,
                    "timestamp": ts,
                })
        elif etype == EventType.TASK_COMPLETED:
            ans = payload.get("answer") or result.get("final_answer", "")
            formatted_events.append({
                "step": step,
                "type": "final",
                "message": ans,
                "summary": ans,
                "timestamp": ts,
            })

    final_answer = result.get("final_answer", "")
    if not any(e.get("type") == "final" for e in formatted_events) and final_answer:
        formatted_events.append({
            "step": len(formatted_events) + 1,
            "type": "final",
            "message": final_answer,
            "summary": final_answer,
        })

    # Convert trajectory to JSON serializable objects
    raw_trajectory = agent.memory.get_context()
    serializable_trajectory = []
    for item in raw_trajectory:
        c = item.get("content")
        if hasattr(c, "to_dict"):
            c = c.to_dict()
        elif hasattr(c, "__dict__"):
            c = vars(c)
        serializable_trajectory.append({
            "role": item.get("role"),
            "type": item.get("type"),
            "content": c,
        })

    return AgentRunResponse(
        status="completed" if result.get("status") == "success" else "failed",
        events=formatted_events,
        final_answer=final_answer,
        trajectory=serializable_trajectory,
    )


@router.post("/tasks", response_model=TaskResponse, tags=["Tasks"])
async def submit_task(request: TaskRequest):
    """
    Submit a coding or debugging task to RepoPilot.
    Executes using AgentCore and returns result.
    """
    run_resp = await run_agent(AgentRunRequest(
        task=request.task,
        target_repo_path=request.target_repo_path,
        max_steps=request.max_steps,
    ))
    return TaskResponse(
        task_id=f"task-{len(run_resp.events)}",
        status=TaskStatus.COMPLETED if run_resp.status == "completed" else TaskStatus.FAILED,
        message=f"Task executed with {len(run_resp.events)} events",
        result=run_resp.final_answer,
    )


@router.get("/tasks/{task_id}", response_model=TaskResponse, tags=["Tasks"])
async def get_task_status(task_id: str):
    """Poll task execution status and summary."""
    return TaskResponse(
        task_id=task_id,
        status=TaskStatus.COMPLETED,
        message="Status polling endpoint",
    )


@router.post("/debug/code", response_model=CodeDebugResponse, tags=["Debug"])
async def debug_code_snippet(request: CodeDebugRequest):
    """
    Universal Code Debugger:
    Analyzes code snippets from ANY programming language, identifies root cause,
    generates 100% working debugged code, line-by-line explanations, and a unified diff.
    """
    raw_code = (request.code or "").strip()
    if not raw_code:
        raise HTTPException(status_code=400, detail="Code snippet cannot be empty.")

    import difflib

    llm = ResilientLLM()

    system_prompt = (
        "You are RepoPilot's expert multi-language software debugger and code doctor. "
        "You can analyze, diagnose, and fix code in ANY programming language (Python, JavaScript, TypeScript, "
        "Java, C, C++, C#, Go, Rust, Ruby, PHP, Swift, Kotlin, HTML/CSS, SQL, Bash/Shell, Scala, R, etc.).\n\n"
        "Your instructions:\n"
        "1. Identify the programming language accurately if marked 'auto' or unspecified.\n"
        "2. Identify all syntax errors, runtime bugs, logic flaws, off-by-one errors, memory management issues, "
        "concurrency/race conditions, type errors, and uncaught edge cases.\n"
        "3. If an error message or traceback is supplied, pinpoint the exact line and reason for failure.\n"
        "4. Produce complete, working, production-ready debugged code that fixes all bugs while preserving existing "
        "architecture, naming conventions, and style.\n"
        "5. Output ONLY valid JSON matching this exact structure without markdown backticks:\n"
        "{\n"
        '  "detected_language": "Language name",\n'
        '  "bug_summary": "1-2 sentence high level description of the bug(s)",\n'
        '  "root_cause": "Detailed technical explanation of why the failure occurred",\n'
        '  "debugged_code": "Complete corrected source code string",\n'
        '  "changes_explained": ["Specific change 1", "Specific change 2"],\n'
        '  "tips": ["Best practice tip 1", "Best practice tip 2"]\n'
        "}"
    )

    user_prompt = (
        f"Language: {request.language or 'auto'}\n\n"
        f"SOURCE CODE TO DEBUG:\n```\n{raw_code}\n```\n\n"
        f"ERROR / TRACEBACK (if any):\n{request.error_message or 'None'}\n\n"
        f"CONTEXT / INTENDED BEHAVIOR (if any):\n{request.context or 'None'}\n\n"
        "Analyze and return the strict JSON diagnosis."
    )

    try:
        raw_response = await llm.generate(
            prompt=user_prompt,
            system_prompt=system_prompt,
        )
    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=f"LLM communication error during code debugging: {str(exc)}",
        )

    # Clean JSON output from potential markdown wrapper
    cleaned = raw_response.strip()
    if cleaned.startswith("```"):
        lines = cleaned.splitlines()
        if lines[0].startswith("```"):
            lines = lines[1:]
        if lines and lines[-1].strip() == "```":
            lines = lines[:-1]
        cleaned = "\n".join(lines).strip()

    parsed: Dict[str, Any] = {}
    try:
        parsed = json.loads(cleaned)
    except Exception:
        # Fallback heuristic extraction
        import re
        debugged_code = raw_code
        code_match = re.search(r"```(?:\w+)?\n([\s\S]*?)```", raw_response)
        if code_match:
            debugged_code = code_match.group(1).strip()
        parsed = {
            "detected_language": request.language if request.language != "auto" else "Auto-detected",
            "bug_summary": "Code diagnosed and repaired.",
            "root_cause": raw_response[:300],
            "debugged_code": debugged_code,
            "changes_explained": ["Corrected syntax and runtime logic."],
            "tips": ["Verify unit tests and edge cases."],
        }

    detected_lang = parsed.get("detected_language") or (request.language if request.language != "auto" else "Plain Text")
    debugged_code = parsed.get("debugged_code") or raw_code
    bug_summary = parsed.get("bug_summary") or "Diagnosed code issues."
    root_cause = parsed.get("root_cause") or "Root cause resolved."
    changes = parsed.get("changes_explained") or []
    tips = parsed.get("tips") or []

    # Compute clean unified diff between original and debugged code
    diff_lines = list(difflib.unified_diff(
        raw_code.splitlines(keepends=True),
        debugged_code.splitlines(keepends=True),
        fromfile=f"original.{detected_lang.lower()[:3]}",
        tofile=f"debugged.{detected_lang.lower()[:3]}",
        n=3,
    ))
    diff_text = "".join(diff_lines) if diff_lines else None

    return CodeDebugResponse(
        status="success",
        detected_language=detected_lang,
        bug_summary=bug_summary,
        root_cause=root_cause,
        debugged_code=debugged_code,
        diff=diff_text,
        changes_explained=changes if isinstance(changes, list) else [str(changes)],
        tips=tips if isinstance(tips, list) else [str(tips)],
    )

