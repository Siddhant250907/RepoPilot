"""
Temporary test script to verify real Gemini connection using existing LLMInterface.
"""

import asyncio
import os
from dotenv import load_dotenv
import pytest

# Load environment using project's existing configuration approach
load_dotenv()

from backend.agent.llm import LLMInterface


def test_real_gemini_connection():
    """Verify that LLMInterface can make a real API call to Gemini."""
    llm = LLMInterface()
    assert bool(llm.api_key), "Gemini API key not found in environment or .env"

    prompt = "Reply with exactly: GEMINI_CONNECTION_SUCCESS"
    response = asyncio.run(llm.generate(prompt=prompt))

    print(f"\n[Gemini Response]: {response}")
    assert response and len(response.strip()) > 0, "Received empty response from Gemini"
