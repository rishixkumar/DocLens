"""
Tests for semantic search API routes.

Covers request validation, empty document handling, chunk integration,
and error responses.
"""

import pytest
from httpx import AsyncClient
from unittest.mock import AsyncMock, patch


@pytest.fixture
def sample_search_document():
    """Sample document for search tests (needs enough text to chunk)."""
    return " ".join([f"paragraph{i} word " * 50 for i in range(10)])


@pytest.mark.asyncio
async def test_search_requires_query(
    client: AsyncClient,
    sample_search_document: str,
    sample_api_key: str,
):
    """Search endpoint should reject empty query."""
    response = await client.post(
        "/api/search",
        json={
            "document_text": sample_search_document,
            "query": "",
            "api_key": sample_api_key,
        },
    )
    assert response.status_code == 422


@pytest.mark.asyncio
async def test_search_requires_document(
    client: AsyncClient,
    sample_api_key: str,
):
    """Search endpoint should reject empty document."""
    response = await client.post(
        "/api/search",
        json={
            "document_text": "",
            "query": "payment terms",
            "api_key": sample_api_key,
        },
    )
    assert response.status_code == 422


@pytest.mark.asyncio
async def test_search_empty_document_returns_empty_results(
    client: AsyncClient,
    sample_api_key: str,
):
    """Empty document (after validation) - use minimal valid doc."""
    # Single word is valid but chunks to one chunk
    with patch("app.api.routes.search.GroqService") as mock_groq:
        mock_instance = AsyncMock()
        mock_instance.semantic_search = AsyncMock(return_value=[])
        mock_groq.return_value = mock_instance

        response = await client.post(
            "/api/search",
            json={
                "document_text": "hello",
                "query": "test",
                "api_key": sample_api_key,
            },
        )
        assert response.status_code == 200
        data = response.json()
        assert "results" in data
        assert "total_chunks" in data
        assert data["total_chunks"] >= 1


@pytest.mark.asyncio
async def test_search_returns_results_with_chunk_text(
    client: AsyncClient,
    sample_search_document: str,
    sample_api_key: str,
):
    """Search should return results with chunk_text populated."""
    with patch("app.api.routes.search.GroqService") as mock_groq:
        mock_instance = AsyncMock()
        mock_instance.semantic_search = AsyncMock(
            return_value=[
                {"chunkIndex": 0, "relevanceScore": 8, "reason": "Relevant."},
            ]
        )
        mock_groq.return_value = mock_instance

        response = await client.post(
            "/api/search",
            json={
                "document_text": sample_search_document,
                "query": "payment",
                "api_key": sample_api_key,
            },
        )
        assert response.status_code == 200
        data = response.json()
        assert data["query"] == "payment"
        assert data["total_chunks"] > 0
        if data["results"]:
            r = data["results"][0]
            assert "chunk_text" in r
            assert "relevance_score" in r
            assert "reason" in r


@pytest.mark.asyncio
async def test_search_401_on_invalid_api_key(
    client: AsyncClient,
    sample_search_document: str,
):
    """Invalid API key should return 401."""
    with patch("app.api.routes.search.GroqService") as mock_groq:
        from app.services.groq_service import GroqServiceError
        mock_instance = AsyncMock()
        mock_instance.semantic_search = AsyncMock(
            side_effect=GroqServiceError("Invalid API key", 401)
        )
        mock_groq.return_value = mock_instance

        response = await client.post(
            "/api/search",
            json={
                "document_text": sample_search_document,
                "query": "test",
                "api_key": "bad_key",
            },
        )
        assert response.status_code == 401
