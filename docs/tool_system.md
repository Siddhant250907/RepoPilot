# Tool System & Registry

## BaseTool Contract

Every tool in RepoPilot implements the `BaseTool` abstract interface:

```python
class BaseTool(ABC):
    name: str
    description: str

    @abstractmethod
    async def execute(self, **kwargs) -> Any:
        pass

    def to_schema(self) -> Dict[str, Any]:
        pass
```

## Tool Catalog

1. **`FileTool`**:
   - Capabilities: `read_file`, `list_directory`, `find_files`.
   - Security: Path containment validation preventing directory traversal outside the target repository.

2. **`ShellTool`**:
   - Capabilities: Execute commands such as `pytest`, `git status`, `npm test`.
   - Safety: Strict process timeouts (default 30s), output truncation to protect context windows, and command sanitization.

3. **`SearchTool`**:
   - Capabilities: Query external documentation or search engines for unknown error traces or syntax quirks.

4. **`CalculatorTool`**:
   - Capabilities: Deterministic arithmetic evaluations.

## Autonomous Tool Routing

RepoPilot enforces that tool routing is dynamic:
- All registered tools publish their JSON schemas to the LLM system prompt.
- The LLM reasons about which tool is required for the current sub-goal.
- The `ToolRegistry` dispatches the execution dynamically and captures errors.
