"""
Pytest configuration and fixtures for backend tests.

Provides shared fixtures for API client, mock services, and test data.
"""

import pytest
from httpx import ASGITransport, AsyncClient

from app.main import app


@pytest.fixture
def anyio_backend():
    """Use asyncio for pytest-asyncio."""
    return "asyncio"


@pytest.fixture
async def client():
    """Async HTTP client for testing FastAPI endpoints."""
    async with AsyncClient(
        transport=ASGITransport(app=app),
        base_url="http://test",
    ) as ac:
        yield ac


@pytest.fixture
def sample_document_text():
    """Sample document for analysis tests."""
    return """
    CONTRACT AGREEMENT

    This Agreement is entered into between Acme Corporation ("Company") and John Doe ("Contractor").

    Payment Terms: Contractor shall receive $50,000 upon completion of deliverables.
    Termination: Either party may terminate with 30 days written notice.
    Penalties: Breach of confidentiality may result in damages up to $100,000.

    Effective Date: January 1, 2025.
    """


@pytest.fixture
def sample_api_key():
    """Valid-looking API key for request validation (not used for real calls in mocks)."""
    return "gsk_test_1234567890abcdef"


@pytest.fixture
def chunk_service():
    """ChunkService instance for unit tests."""
    from app.services.chunk_service import ChunkService
    return ChunkService(chunk_words=100, chunk_overlap=20)
