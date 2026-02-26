"""
Health check and config endpoints for monitoring and client configuration.
"""

from fastapi import APIRouter

from app.config import has_server_api_key

router = APIRouter()


@router.get("/health")
async def health_check():
    """
    Simple health check endpoint.

    Returns:
        Status object indicating service is running.
    """
    return {"status": "ok", "service": "doclens-api"}


@router.get("/config")
async def get_config():
    """
    Return client configuration (e.g. whether server has API key).
    Frontend uses this to decide if user needs to enter an API key.
    """
    return {"hasApiKey": has_server_api_key()}
