"""
Tests for health check endpoints.

Covers basic connectivity and service status verification.
"""

import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_health_returns_ok(client: AsyncClient):
    """Health endpoint should return 200 with status ok."""
    response = await client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert data["service"] == "doclens-api"


@pytest.mark.asyncio
async def test_health_response_structure(client: AsyncClient):
    """Health response should have expected keys."""
    response = await client.get("/api/health")
    data = response.json()
    assert "status" in data
    assert "service" in data
    assert isinstance(data["status"], str)
    assert isinstance(data["service"], str)


@pytest.mark.asyncio
async def test_root_endpoint(client: AsyncClient):
    """Root endpoint should return API info."""
    response = await client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert "service" in data
    assert "version" in data
    assert "docs" in data
