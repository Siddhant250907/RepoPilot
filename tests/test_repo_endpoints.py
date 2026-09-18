"""
Unit tests for user repository upload and connection endpoints.
"""

import io
import zipfile
from pathlib import Path
import pytest
from starlette.datastructures import UploadFile

from backend.api.routes import (
    upload_repository,
    connect_local_repository,
    list_user_repositories,
    ConnectLocalRepoRequest,
)


@pytest.mark.anyio
async def test_connect_local_repo(tmp_path):
    test_file = tmp_path / "app.py"
    test_file.write_text("def hello():\n    return 'world'\n", encoding="utf-8")
    
    test_suite = tmp_path / "test_app.py"
    test_suite.write_text("def test_hello():\n    assert True\n", encoding="utf-8")

    req = ConnectLocalRepoRequest(local_path=str(tmp_path), name="TestLocalProject")
    data = await connect_local_repository(req)

    assert "TestLocalProject" in data["name"]
    assert data["badge"] == "LOCAL REPO"
    assert "Python / pytest" in data["techStack"]
    assert "recommendedPreset" in data


@pytest.mark.anyio
async def test_upload_repo_zip():
    buf = io.BytesIO()
    with zipfile.ZipFile(buf, "w") as zf:
        zf.writestr("calc.py", "def add(a, b):\n    return a + b\n")
        zf.writestr("tests/test_calc.py", "def test_add():\n    assert add(1, 2) == 3\n")
    buf.seek(0)

    upload_file = UploadFile(filename="my_custom_project.zip", file=buf)
    res_data = await upload_repository(file=upload_file, name="MyCustomProject")

    assert "MyCustomProject" in res_data["name"]
    assert res_data["badge"] == "USER REPO"
    assert "Python / pytest" in res_data["techStack"]

    list_res = await list_user_repositories()
    repos = list_res.get("repositories", [])
    assert any("MyCustomProject" in r["name"] for r in repos)

    # Verify tool execution and containment in the uploaded repo
    from backend.tools.file_tool import FileTool
    tool = FileTool(workspace_root=res_data["path"])

    # 1. Read directly by file name
    res_direct = tool.execute({"action": "read", "path": "calc.py"})
    assert res_direct["status"] == "success"
    assert "def add(a, b):" in res_direct["data"]

    # 2. Read with full repo prefix
    res_prefixed = tool.execute({"action": "read", "path": f"{res_data['path']}/calc.py"})
    assert res_prefixed["status"] == "success"
    assert "def add(a, b):" in res_prefixed["data"]

    # 3. Path traversal outside repo is safely rejected
    res_escape = tool.execute({"action": "read", "path": "../../backend/main.py"})
    assert res_escape["status"] == "error"
    assert "Path traversal error" in res_escape["error"]


@pytest.mark.anyio
async def test_upload_repo_folder():
    from backend.api.routes import upload_folder_repository

    file1 = UploadFile(filename="calc.py", file=io.BytesIO(b"def multiply(a, b):\n    return a * b\n"))
    file2 = UploadFile(filename="test_calc.py", file=io.BytesIO(b"def test_mult():\n    assert True\n"))

    files = [file1, file2]
    paths = ["my_folder_project/calc.py", "my_folder_project/tests/test_calc.py"]

    data = await upload_folder_repository(files=files, paths=paths, name="MyFolderProject")

    assert "MyFolderProject" in data["name"]
    assert data["badge"] == "USER REPO"
    assert "Python / pytest" in data["techStack"]

    # Verify tool execution on folder-uploaded repo
    from backend.tools.file_tool import FileTool
    tool = FileTool(workspace_root=data["path"])
    res = tool.execute({"action": "read", "path": "calc.py"})
    assert res["status"] == "success"
    assert "def multiply(a, b):" in res["data"]

