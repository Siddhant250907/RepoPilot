import unittest
import asyncio
from fastapi import HTTPException
from backend.api.routes import debug_code_snippet
from backend.api.schemas import CodeDebugRequest


class TestUniversalCodeDebugger(unittest.TestCase):
    """Test suite for debug_code_snippet handler."""

    def test_debug_empty_code_raises_400(self):
        """Empty code payload should raise 400 HTTPException."""
        req = CodeDebugRequest(code="")
        with self.assertRaises(HTTPException) as ctx:
            asyncio.run(debug_code_snippet(req))
        self.assertEqual(ctx.exception.status_code, 400)
        self.assertIn("cannot be empty", ctx.exception.detail)

    def test_debug_endpoint_structure(self):
        """Valid snippet returns required fields in CodeDebugResponse schema."""
        req = CodeDebugRequest(
            code="def multiply(a, b):\n    return a + b",
            language="python",
            error_message="multiply(2, 3) returned 5 instead of 6",
            context="Should multiply numbers",
        )
        res = asyncio.run(debug_code_snippet(req))
        self.assertEqual(res.status, "success")
        self.assertIn("Python", res.detected_language)
        self.assertTrue(len(res.bug_summary) > 0)
        self.assertTrue(len(res.root_cause) > 0)
        self.assertIn("a * b", res.debugged_code)
        self.assertIsInstance(res.changes_explained, list)


if __name__ == "__main__":
    unittest.main()

