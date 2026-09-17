"""
Safe Deterministic Calculator Tool.

Owner: Person 2 (Tools)

Responsibilities:
- Perform deterministic mathematical calculations without shell/Python execution.
- Safe AST-based evaluation restricted strictly to numeric arithmetic.
- Prohibit imports, attribute access, function calls, and arbitrary code execution.
- Catch division by zero, overflow, and invalid syntax returning structured observations.
"""

import ast
import math
from typing import Any, Dict, Optional, Union

from backend.tools.base import BaseTool, ToolResult


class CalculatorTool(BaseTool):
    """Tool for evaluating mathematical expressions deterministically and safely."""

    name: str = "calculator_tool"
    description: str = "Safely compute mathematical expressions (e.g. arithmetic, percentages, operations) without code execution."

    MAX_EXPRESSION_LENGTH: int = 500
    MAX_EXPONENT: int = 1000
    MAX_INT_DIGITS: int = 1000  # Reasonable upper bound on integer digits

    @property
    def input_schema(self) -> Dict[str, Any]:
        """Return JSON Schema describing CalculatorTool parameters."""
        return {
            "type": "object",
            "properties": {
                "expression": {
                    "type": "string",
                    "description": "Mathematical expression to safely compute (e.g. '2 + 2', '(100 * 5) / 4', '2 ** 8')."
                }
            },
            "required": ["expression"]
        }

    def execute(self, arguments: Optional[Union[Dict[str, Any], str]] = None, **kwargs) -> ToolResult:
        """
        Evaluate mathematical expression safely.
        Supports dictionary argument passing or direct keyword arguments.
        """
        params: Dict[str, Any] = {}
        if isinstance(arguments, dict):
            params.update(arguments)
        elif isinstance(arguments, str):
            params["expression"] = arguments
        params.update(kwargs)

        raw_expr = params.get("expression")
        if raw_expr is None:
            return ToolResult({
                "status": "error",
                "error": "Missing required argument: 'expression'"
            })

        if not isinstance(raw_expr, str):
            return ToolResult({
                "status": "error",
                "error": f"Invalid expression argument type: expected string, got {type(raw_expr).__name__}"
            })

        expression = raw_expr.strip()
        if not expression:
            return ToolResult({
                "status": "error",
                "error": "Empty or invalid expression: expression cannot be blank"
            })

        if len(expression) > self.MAX_EXPRESSION_LENGTH:
            return ToolResult({
                "status": "error",
                "error": f"Expression exceeds maximum length limit of {self.MAX_EXPRESSION_LENGTH} characters"
            })

        # Parse AST in mode='eval'
        try:
            parsed = ast.parse(expression, mode="eval")
        except SyntaxError as se:
            return ToolResult({
                "status": "error",
                "error": f"Malformed mathematical expression: {str(se)}"
            })
        except Exception as exc:
            return ToolResult({
                "status": "error",
                "error": f"Failed to parse expression: {str(exc)}"
            })

        # Evaluate AST safely
        try:
            val = self._evaluate_node(parsed.body)

            # Check for NaN / Infinity
            if isinstance(val, float):
                if math.isnan(val) or math.isinf(val):
                    return ToolResult({
                        "status": "error",
                        "error": "Calculation resulted in undefined value (NaN or infinity)"
                    })

            # Check for excessive integer digit size
            if isinstance(val, int) and val.bit_length() > 3500:
                return ToolResult({
                    "status": "error",
                    "error": "Result exceeds maximum allowable number size"
                })

            # Check for complex numbers (non-serializable to standard JSON)
            if isinstance(val, complex):
                return ToolResult({
                    "status": "error",
                    "error": "Complex number results are not supported"
                })

            return ToolResult({
                "status": "success",
                "data": {
                    "expression": expression,
                    "result": val
                }
            })
        except ZeroDivisionError as zde:
            return ToolResult({
                "status": "error",
                "error": str(zde) or "Division by zero"
            })
        except OverflowError:
            return ToolResult({
                "status": "error",
                "error": "Numerical overflow: result exceeds numerical bounds"
            })
        except ValueError as ve:
            return ToolResult({
                "status": "error",
                "error": str(ve)
            })
        except TypeError as te:
            return ToolResult({
                "status": "error",
                "error": str(te)
            })
        except Exception as exc:
            return ToolResult({
                "status": "error",
                "error": f"Calculation error: {str(exc)}"
            })

    def _evaluate_node(self, node: ast.AST) -> Union[int, float]:
        """Recursively and safely evaluate an AST node adhering strictly to mathematical grammar."""
        # 1. Numeric constants (Python 3.8+ ast.Constant, backwards-compatible with ast.Num)
        if isinstance(node, ast.Constant):
            if isinstance(node.value, (int, float)) and not isinstance(node.value, bool):
                return node.value
            raise ValueError(f"Unsupported literal type: '{type(node.value).__name__}' (only numbers are allowed)")

        if hasattr(ast, "Num") and isinstance(node, ast.Num):  # pragma: no cover
            return node.n

        # 2. Unary operators (+x, -x)
        if isinstance(node, ast.UnaryOp):
            operand = self._evaluate_node(node.operand)
            if isinstance(node.op, ast.UAdd):
                return +operand
            elif isinstance(node.op, ast.USub):
                return -operand
            else:
                raise ValueError(f"Unsupported unary operator: '{type(node.op).__name__}'")

        # 3. Binary operators (x + y, x - y, x * y, x / y, x // y, x % y, x ** y)
        if isinstance(node, ast.BinOp):
            left = self._evaluate_node(node.left)
            right = self._evaluate_node(node.right)

            if isinstance(node.op, ast.Add):
                return left + right
            elif isinstance(node.op, ast.Sub):
                return left - right
            elif isinstance(node.op, ast.Mult):
                return left * right
            elif isinstance(node.op, ast.Div):
                if right == 0:
                    raise ZeroDivisionError("Division by zero")
                return left / right
            elif isinstance(node.op, ast.FloorDiv):
                if right == 0:
                    raise ZeroDivisionError("Division by zero")
                return left // right
            elif isinstance(node.op, ast.Mod):
                if right == 0:
                    raise ZeroDivisionError("Modulo by zero")
                return left % right
            elif isinstance(node.op, ast.Pow):
                # Guard against exponentiation DoS
                if abs(right) > self.MAX_EXPONENT:
                    raise ValueError(f"Exponent exceeds safety limit of {self.MAX_EXPONENT}")
                if isinstance(left, int) and isinstance(right, int) and right > 0:
                    # Check approximate digit count before executing power
                    if left != 0 and right * math.log10(abs(left) if abs(left) > 0 else 1) > self.MAX_INT_DIGITS:
                        raise OverflowError("Exponentiation exceeds maximum allowable digit size")
                return left ** right
            else:
                raise ValueError(f"Unsupported binary operator: '{type(node.op).__name__}'")

        # 4. Explicit rejection of non-arithmetic syntax
        node_name = type(node).__name__
        if isinstance(node, (ast.Call, ast.Attribute, ast.Name, ast.Subscript)):
            raise ValueError(f"Security violation: code execution, functions, or variable access not permitted ('{node_name}')")

        raise ValueError(f"Unsupported expression component: '{node_name}' (only numeric arithmetic is allowed)")
