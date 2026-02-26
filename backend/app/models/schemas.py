"""
Pydantic schemas for API request/response validation.

These models define the structure of incoming requests and outgoing responses,
ensuring type safety and automatic OpenAPI documentation.
"""

from typing import Optional

from pydantic import BaseModel, Field


class AnalyzeRequest(BaseModel):
    """Request body for document analysis endpoint."""

    document_text: str = Field(..., min_length=1, max_length=200000)
    document_type: str = Field(
        default="general",
        description="Type of document: contracts, research, business, or general",
    )
    api_key: Optional[str] = Field(
        default=None,
        description="Groq API key (optional if server has GROQ_API_KEY in env)",
    )


class SearchRequest(BaseModel):
    """Request body for semantic search endpoint."""

    document_text: str = Field(..., min_length=1, max_length=100000)
    query: str = Field(..., min_length=1, max_length=500)
    api_key: Optional[str] = Field(
        default=None,
        description="Groq API key (optional if server has GROQ_API_KEY in env)",
    )


class SearchResultItem(BaseModel):
    """Single search result with relevance metadata."""

    chunk_index: int
    relevance_score: int = Field(..., ge=1, le=10)
    reason: str
    chunk_text: str


class SearchResponse(BaseModel):
    """Response containing semantic search results."""

    results: list[SearchResultItem]
    total_chunks: int
    query: str
