"""
Tests for document analysis API routes.

Covers request validation, error handling, truncation, and integration
with mocked Groq service.
"""

import pytest
from httpx import AsyncClient
from unittest.mock import AsyncMock, patch


@pytest.mark.asyncio
async def test_analyze_requires_document_text(client: AsyncClient, sample_api_key: str):
    """Analyze endpoint should reject empty document_text."""
    response = await client.post(
        "/api/analyze",
        json={
            "document_text": "",
            "document_type": "general",
            "api_key": sample_api_key,
        },
    )
    assert response.status_code == 422  # Validation error


@pytest.mark.asyncio
async def test_analyze_401_when_no_api_key_available(
    client: AsyncClient, sample_document_text: str
):
    """Analyze endpoint should return 401 when no API key (request or env) is available."""
    with patch("app.api.routes.analysis.get_groq_api_key", return_value=None):
        response = await client.post(
            "/api/analyze",
            json={
                "document_text": sample_document_text,
                "document_type": "general",
            },
        )
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_analyze_accepts_valid_document_types(
    client: AsyncClient,
    sample_document_text: str,
    sample_api_key: str,
):
    """Analyze should accept contracts, research, business, general."""
    with patch("app.api.routes.analysis.GroqService") as mock_groq:
        mock_instance = AsyncMock()
        mock_instance.analyze_document = AsyncMock(
            return_value="EXECUTIVE_SUMMARY\nTest summary.\n\nKEY_POINTS\n1. Point"
        )
        mock_groq.return_value = mock_instance

        for doc_type in ["contracts", "research", "business", "general"]:
            response = await client.post(
                "/api/analyze",
                json={
                    "document_text": sample_document_text,
                    "document_type": doc_type,
                    "api_key": sample_api_key,
                },
            )
            assert response.status_code == 200, f"Failed for type: {doc_type}"
            data = response.json()
            assert "analysis" in data
            assert "truncated" in data


@pytest.mark.asyncio
async def test_analyze_returns_truncated_flag_when_over_limit(
    client: AsyncClient,
    sample_api_key: str,
):
    """When document exceeds MAX_CHARS, response should have truncated=True."""
    long_text = "word " * 10000  # ~50k chars
    with patch("app.api.routes.analysis.GroqService") as mock_groq:
        mock_instance = AsyncMock()
        mock_instance.analyze_document = AsyncMock(
            return_value="EXECUTIVE_SUMMARY\nSummary."
        )
        mock_groq.return_value = mock_instance

        response = await client.post(
            "/api/analyze",
            json={
                "document_text": long_text,
                "document_type": "general",
                "api_key": sample_api_key,
            },
        )
        assert response.status_code == 200
        data = response.json()
        assert data["truncated"] is True


@pytest.mark.asyncio
async def test_analyze_401_on_invalid_api_key(
    client: AsyncClient,
    sample_document_text: str,
):
    """Invalid API key should return 401."""
    with patch("app.api.routes.analysis.GroqService") as mock_groq:
        from app.services.groq_service import GroqServiceError
        mock_instance = AsyncMock()
        mock_instance.analyze_document = AsyncMock(
            side_effect=GroqServiceError("Invalid API key", 401)
        )
        mock_groq.return_value = mock_instance

        response = await client.post(
            "/api/analyze",
            json={
                "document_text": sample_document_text,
                "document_type": "general",
                "api_key": "invalid_key",
            },
        )
        assert response.status_code == 401


@pytest.mark.asyncio
async def test_analyze_429_on_rate_limit(
    client: AsyncClient,
    sample_document_text: str,
    sample_api_key: str,
):
    """Rate limit from Groq should return 429."""
    with patch("app.api.routes.analysis.GroqService") as mock_groq:
        from app.services.groq_service import GroqServiceError
        mock_instance = AsyncMock()
        mock_instance.analyze_document = AsyncMock(
            side_effect=GroqServiceError("Rate limit", 429)
        )
        mock_groq.return_value = mock_instance

        response = await client.post(
            "/api/analyze",
            json={
                "document_text": sample_document_text,
                "document_type": "general",
                "api_key": sample_api_key,
            },
        )
        assert response.status_code == 429
