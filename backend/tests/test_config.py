"""
Tests for /api/config endpoint.

Verifies that the config endpoint returns hasApiKey based on env.
"""

import pytest
from httpx import AsyncClient
from unittest.mock import patch


@pytest.mark.asyncio
async def test_config_returns_has_api_key(client: AsyncClient):
    """Config endpoint should return hasApiKey boolean."""
    response = await client.get("/api/config")
    assert response.status_code == 200
    data = response.json()
    assert "hasApiKey" in data
    assert isinstance(data["hasApiKey"], bool)


@pytest.mark.asyncio
async def test_config_has_api_key_when_env_set(client: AsyncClient):
    """When GROQ_API_KEY is in env, hasApiKey should be True."""
    with patch("app.api.routes.health.has_server_api_key", return_value=True):
        response = await client.get("/api/config")
    assert response.json()["hasApiKey"] is True


@pytest.mark.asyncio
async def test_config_no_api_key_when_env_unset(client: AsyncClient):
    """When GROQ_API_KEY is not in env, hasApiKey should be False."""
    with patch("app.api.routes.health.has_server_api_key", return_value=False):
        response = await client.get("/api/config")
    assert response.json()["hasApiKey"] is False
