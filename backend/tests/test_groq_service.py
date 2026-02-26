"""
Tests for GroqService.

Covers API request construction, error handling, and response parsing.
Uses mocked HTTP to avoid real API calls.
"""

import pytest
from unittest.mock import AsyncMock, patch
import json

from app.services.groq_service import GroqService, GroqServiceError


@pytest.mark.asyncio
async def test_chat_completion_constructs_correct_payload():
    """Chat completion should send correct structure to Groq."""
    with patch("httpx.AsyncClient") as mock_client:
        mock_response = AsyncMock()
        mock_response.status_code = 200
        mock_response.json = lambda: {
            "choices": [{"message": {"content": "Hello"}}]
        }
        mock_post = AsyncMock(return_value=mock_response)
        mock_client.return_value.__aenter__.return_value.post = mock_post

        service = GroqService(api_key="test_key")
        result = await service.chat_completion(
            [{"role": "user", "content": "Hi"}],
            "You are helpful.",
        )
        assert result == "Hello"
        call_args = mock_post.call_args
        assert call_args[1]["json"]["model"] == "llama-3.3-70b-versatile"
        assert call_args[1]["json"]["messages"][0]["role"] == "system"
        assert call_args[1]["headers"]["Authorization"] == "Bearer test_key"


@pytest.mark.asyncio
async def test_chat_completion_raises_on_401():
    """401 response should raise GroqServiceError."""
    with patch("httpx.AsyncClient") as mock_client:
        mock_response = AsyncMock()
        mock_response.status_code = 401
        mock_response.json = lambda: {"error": {"message": "Invalid key"}}
        mock_response.text = "Unauthorized"
        mock_post = AsyncMock(return_value=mock_response)
        mock_client.return_value.__aenter__.return_value.post = mock_post

        service = GroqService(api_key="bad")
        with pytest.raises(GroqServiceError) as exc_info:
            await service.chat_completion(
                [{"role": "user", "content": "Hi"}],
                "System",
            )
        assert exc_info.value.status_code == 401


@pytest.mark.asyncio
async def test_analyze_document_calls_chat_with_correct_prompt():
    """analyze_document should use document-type-specific prompt."""
    with patch.object(GroqService, "chat_completion", new_callable=AsyncMock) as mock_chat:
        mock_chat.return_value = "EXECUTIVE_SUMMARY\nDone."

        service = GroqService(api_key="key")
        result = await service.analyze_document(
            document_text="Contract text here.",
            document_type="contracts",
        )
        assert result == "EXECUTIVE_SUMMARY\nDone."
        call_args = mock_chat.call_args
        system_prompt = call_args[0][1]
        assert "contracts" in system_prompt.lower() or "Contracts" in system_prompt
        assert "EXECUTIVE_SUMMARY" in system_prompt


@pytest.mark.asyncio
async def test_semantic_search_parses_json_response():
    """semantic_search should parse LLM JSON response correctly."""
    with patch.object(GroqService, "chat_completion", new_callable=AsyncMock) as mock_chat:
        mock_chat.return_value = json.dumps([
            {"chunkIndex": 0, "relevanceScore": 9, "reason": "Matches."},
            {"chunkIndex": 2, "relevanceScore": 7, "reason": "Related."},
        ])

        service = GroqService(api_key="key")
        chunks = [
            {"index": 0, "text": "First chunk"},
            {"index": 1, "text": "Second chunk"},
            {"index": 2, "text": "Third chunk"},
        ]
        result = await service.semantic_search(chunks=chunks, query="first")
        assert len(result) == 2
        assert result[0]["chunkIndex"] == 0
        assert result[0]["relevanceScore"] == 9
        assert result[1]["chunkIndex"] == 2


@pytest.mark.asyncio
async def test_semantic_search_handles_invalid_json():
    """Invalid JSON in response should return empty list."""
    with patch.object(GroqService, "chat_completion", new_callable=AsyncMock) as mock_chat:
        mock_chat.return_value = "This is not valid JSON at all {{{"

        service = GroqService(api_key="key")
        chunks = [{"index": 0, "text": "Chunk"}]
        result = await service.semantic_search(chunks=chunks, query="test")
        assert result == []


@pytest.mark.asyncio
async def test_semantic_search_strips_markdown_fences():
    """Response with ```json fences should still parse."""
    with patch.object(GroqService, "chat_completion", new_callable=AsyncMock) as mock_chat:
        mock_chat.return_value = '```json\n[{"chunkIndex": 0, "relevanceScore": 8, "reason": "Ok"}]\n```'

        service = GroqService(api_key="key")
        chunks = [{"index": 0, "text": "Chunk"}]
        result = await service.semantic_search(chunks=chunks, query="test")
        assert len(result) == 1
        assert result[0]["chunkIndex"] == 0
