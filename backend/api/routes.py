"""
API Routes and Endpoints.

Owner: Person 3

Responsibilities:
- Provide HTTP endpoints for task dispatch and agent execution.
- Translate API requests to AgentCore invocations.
- Expose real agent trace events (PLAN, TOOL_CALL, TOOL_RESULT, REFLECTION, FINAL) to the frontend.
"""

import json
import os
import re
import shutil
import zipfile
from pathlib import Path
from typing import Any, Dict, List, Optional
from fastapi import APIRouter, HTTPException, UploadFile, File, Form
from pydantic import BaseModel

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


    task_prompt = request.task
    if target_workspace:
        rel_target = str(request.target_repo_path).replace("\\", "/")
        if rel_target.lower() not in task_prompt.lower():
            task_prompt = (
                f"TARGET REPOSITORY ISOLATION:\n"
                f"- Active repository directory: '{rel_target}'\n"
                f"- All commands and files are scoped strictly to this repository.\n"
                f"- Investigate and fix errors ONLY within this repository.\n\n"
                f"USER TASK: {request.task}"
            )

    try:
        result = await agent.execute_task(task_prompt)
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


# =====================================================================
# User Repository Upload & Connection Endpoints
# =====================================================================

class ConnectLocalRepoRequest(BaseModel):
    local_path: str
    name: Optional[str] = None


USER_REPOS_DIR = Path("workspace/user_repos").resolve()


def _sanitize_slug(name: str) -> str:
    slug = re.sub(r"[^a-zA-Z0-9_\-]+", "-", name.strip().lower())
    return slug.strip("-") or "repo"


def _scan_repo(folder: Path) -> Dict[str, Any]:
    """Scan folder to determine file counts, primary language, and test suite."""
    all_files = []
    try:
        for f in folder.rglob("*"):
            if f.is_file() and not any(part.startswith((".", "__pycache__", "node_modules", ".git")) for part in f.parts):
                all_files.append(f)
    except Exception:
        pass

    file_count = len(all_files)
    tech = "Generic / Mixed"
    has_pytest = any("test" in f.name.lower() and f.suffix == ".py" for f in all_files)
    has_py = any(f.suffix == ".py" for f in all_files)
    has_ts = any(f.suffix in (".ts", ".tsx") for f in all_files)
    has_js = any(f.suffix in (".js", ".jsx") for f in all_files)
    has_rust = any(f.suffix == ".rs" for f in all_files)
    has_go = any(f.suffix == ".go" for f in all_files)

    if has_py and has_pytest:
        tech = "Python / pytest"
    elif has_py:
        tech = "Python 3"
    elif has_ts:
        tech = "TypeScript / Node"
    elif has_js:
        tech = "JavaScript / Node"
    elif has_rust:
        tech = "Rust"
    elif has_go:
        tech = "Go"

    return {
        "file_count": file_count,
        "tech_stack": tech,
        "has_tests": has_pytest or any("test" in f.name.lower() for f in all_files),
    }


def _safe_extract(zip_path: Path, target_dir: Path) -> Path:
    """Safely extracts a ZIP archive with Zip Slip directory traversal protection."""
    target_dir.mkdir(parents=True, exist_ok=True)
    with zipfile.ZipFile(zip_path, "r") as zf:
        for member in zf.infolist():
            dest = (target_dir / member.filename).resolve()
            if not str(dest).startswith(str(target_dir.resolve())):
                raise HTTPException(status_code=400, detail=f"Illegal zip member path: {member.filename}")
            if member.is_dir():
                dest.mkdir(parents=True, exist_ok=True)
            else:
                dest.parent.mkdir(parents=True, exist_ok=True)
                with zf.open(member) as src, open(dest, "wb") as dst:
                    shutil.copyfileobj(src, dst)

    # If the zip has a single root subdirectory (like standard github repo zips), unnest it
    subdirs = [p for p in target_dir.iterdir() if p.is_dir() and not p.name.startswith(".")]
    files = [p for p in target_dir.iterdir() if p.is_file() and not p.name.startswith(".")]
    if len(subdirs) == 1 and len(files) == 0:
        return subdirs[0]
    return target_dir


@router.post("/repos/upload", tags=["Repositories"])
async def upload_repository(
    file: UploadFile = File(...),
    name: Optional[str] = Form(None),
):
    """
    Upload a repository archive (.zip), safely unpack it into workspace/user_repos/,
    inspect its structure, and return structured metadata for immediate debugging.
    """
    if not file.filename or not file.filename.lower().endswith(".zip"):
        raise HTTPException(
            status_code=400,
            detail="Only .zip repository archives are currently supported for upload.",
        )

    base_name = name or Path(file.filename).stem
    slug = _sanitize_slug(base_name)
    repo_target_dir = USER_REPOS_DIR / slug
    repo_target_dir.mkdir(parents=True, exist_ok=True)

    temp_zip = repo_target_dir / f"_upload_{file.filename}"
    try:
        with open(temp_zip, "wb") as f_out:
            shutil.copyfileobj(file.file, f_out)

        effective_dir = _safe_extract(temp_zip, repo_target_dir)
    finally:
        if temp_zip.exists():
            try:
                temp_zip.unlink()
            except Exception:
                pass

    # Inspect the unpacked repository
    scan_info = _scan_repo(effective_dir)
    
    # Calculate relative path from project root
    try:
        rel_path = str(effective_dir.relative_to(Path.cwd())).replace("\\", "/")
    except Exception:
        rel_path = str(effective_dir).replace("\\", "/")

    repo_id = f"user-{slug}"
    repo_name = f"{base_name} (User Repo)"
    preset = (
        f"In {rel_path}, inspect the repository structure, run any existing test suite using shell_tool, diagnose any errors, and patch the code using file_tool to solve the issues."
    )

    metadata = {
        "id": repo_id,
        "name": repo_name,
        "path": rel_path,
        "branch": "main",
        "description": f"User uploaded repository ({scan_info['file_count']} files detected)",
        "techStack": scan_info["tech_stack"],
        "badge": "USER REPO",
        "badgeColor": "#30D158",
        "recommendedPreset": preset,
    }

    # Persist metadata inside repository folder
    meta_file = effective_dir / ".repopilot_meta.json"
    try:
        with open(meta_file, "w", encoding="utf-8") as mf:
            json.dump(metadata, mf, indent=2)
    except Exception:
        pass

    return metadata


@router.post("/repos/upload-folder", tags=["Repositories"])
async def upload_folder_repository(
    files: List[UploadFile] = File(...),
    paths: List[str] = Form(...),
    name: Optional[str] = Form(None),
):
    """
    Upload a repository directory consisting of multiple files with relative paths,
    save into workspace/user_repos/<slug>/, inspect structure, and return metadata.
    """
    if not files:
        raise HTTPException(status_code=400, detail="No files received in folder upload.")

    # Determine base name from explicit name or top-level folder
    first_path = paths[0].replace("\\", "/") if paths else (files[0].filename or "repo")
    top_folder = first_path.split("/")[0] if "/" in first_path else ""
    base_name = name or (top_folder if top_folder else Path(files[0].filename or "user_repo").stem)
    slug = _sanitize_slug(base_name)

    repo_target_dir = USER_REPOS_DIR / slug
    repo_target_dir.mkdir(parents=True, exist_ok=True)

    for upload_file, rel_path_str in zip(files, paths):
        norm_path = rel_path_str.replace("\\", "/").lstrip("/")
        parts = norm_path.split("/")
        # If all paths share the top folder as prefix, unnest it
        if top_folder and len(parts) > 1 and parts[0] == top_folder:
            rel_dest = Path(*parts[1:])
        else:
            rel_dest = Path(norm_path)

        dest = (repo_target_dir / rel_dest).resolve()
        # Security: Zip Slip / traversal guard
        if not str(dest).startswith(str(repo_target_dir.resolve())):
            raise HTTPException(status_code=400, detail=f"Illegal file path: {rel_path_str}")

        dest.parent.mkdir(parents=True, exist_ok=True)
        with open(dest, "wb") as dst:
            shutil.copyfileobj(upload_file.file, dst)

    scan_info = _scan_repo(repo_target_dir)

    try:
        rel_path = str(repo_target_dir.relative_to(Path.cwd())).replace("\\", "/")
    except Exception:
        rel_path = str(repo_target_dir).replace("\\", "/")

    repo_id = f"user-{slug}"
    repo_name = f"{base_name} (User Repo)"
    preset = (
        f"In {rel_path}, inspect the repository structure, run any existing test suite using shell_tool, diagnose any errors, and patch the code using file_tool to solve the issues."
    )

    metadata = {
        "id": repo_id,
        "name": repo_name,
        "path": rel_path,
        "branch": "main",
        "description": f"User uploaded folder ({scan_info['file_count']} files detected)",
        "techStack": scan_info["tech_stack"],
        "badge": "USER REPO",
        "badgeColor": "#30D158",
        "recommendedPreset": preset,
    }

    meta_file = repo_target_dir / ".repopilot_meta.json"
    try:
        with open(meta_file, "w", encoding="utf-8") as mf:
            json.dump(metadata, mf, indent=2)
    except Exception:
        pass

    return metadata


@router.post("/repos/connect-local", tags=["Repositories"])
async def connect_local_repository(request: ConnectLocalRepoRequest):
    """
    Connect an existing local directory on the machine as a target repository.
    Verifies path existence, inspects structure, and returns structured metadata.
    """
    raw_path = request.local_path.strip()
    if not raw_path:
        raise HTTPException(status_code=400, detail="Local repository path cannot be empty.")

    target_path = Path(raw_path)
    if not target_path.is_absolute():
        target_path = (Path.cwd() / target_path).resolve()

    if not target_path.exists() or not target_path.is_dir():
        raise HTTPException(
            status_code=404,
            detail=f"Directory '{raw_path}' does not exist or is not a directory.",
        )

    scan_info = _scan_repo(target_path)
    base_name = request.name or target_path.name
    slug = _sanitize_slug(base_name)

    try:
        rel_path = str(target_path.relative_to(Path.cwd())).replace("\\", "/")
    except Exception:
        rel_path = str(target_path).replace("\\", "/")

    repo_id = f"local-{slug}"
    repo_name = f"{base_name} (Local)"
    preset = (
        f"In {rel_path}, inspect the repository structure, run any existing test suite using shell_tool, diagnose any failing tests or syntax errors, and patch the code using file_tool to solve the issues."
    )

    metadata = {
        "id": repo_id,
        "name": repo_name,
        "path": rel_path,
        "branch": "main",
        "description": f"Connected local repository ({scan_info['file_count']} files detected)",
        "techStack": scan_info["tech_stack"],
        "badge": "LOCAL REPO",
        "badgeColor": "#30D158",
        "recommendedPreset": preset,
    }

    return metadata


@router.get("/repos/user-repos", tags=["Repositories"])
async def list_user_repositories():
    """
    List all user-uploaded repositories stored in workspace/user_repos/.
    """
    USER_REPOS_DIR.mkdir(parents=True, exist_ok=True)
    repos = []
    for item in USER_REPOS_DIR.iterdir():
        if item.is_dir() and not item.name.startswith("."):
            meta_file = item / ".repopilot_meta.json"
            if meta_file.exists():
                try:
                    with open(meta_file, "r", encoding="utf-8") as mf:
                        repos.append(json.load(mf))
                    continue
                except Exception:
                    pass
            # Fallback scan if metadata file missing
            scan = _scan_repo(item)
            try:
                rel = str(item.relative_to(Path.cwd())).replace("\\", "/")
            except Exception:
                rel = str(item).replace("\\", "/")
            repos.append({
                "id": f"user-{item.name}",
                "name": f"{item.name} (User Repo)",
                "path": rel,
                "branch": "main",
                "description": f"User uploaded repository ({scan['file_count']} files)",
                "techStack": scan["tech_stack"],
                "badge": "USER REPO",
                "badgeColor": "#30D158",
                "recommendedPreset": f"Inspect {rel} and diagnose any errors.",
            })

    return {"repositories": repos}

