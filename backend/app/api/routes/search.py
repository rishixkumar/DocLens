"""
Semantic search API routes.

Handles requests to search within a document using LLM-based
semantic similarity rather than keyword matching. Uses GROQ_API_KEY
from env when client does not provide an api_key.
"""

from fastapi import APIRouter, HTTPException

from app.config import get_groq_api_key
from app.models.schemas import SearchRequest, SearchResultItem
from app.services.chunk_service import ChunkService
from app.services.groq_service import GroqService, GroqServiceError

router = APIRouter()
chunk_service = ChunkService()


@router.post("/search")
async def semantic_search(request: SearchRequest):
    """
    Perform semantic search within a document.

    Chunks the document, sends chunks and query to the LLM, and returns
    ranked results with relevance scores and explanations.

    Args:
        request: SearchRequest with document_text, query, api_key (optional).

    Returns:
        SearchResponse with results, total_chunks, and query.
    """
    api_key = get_groq_api_key(request.api_key)
    if not api_key:
        raise HTTPException(
            status_code=401,
            detail="No API key provided. Set GROQ_API_KEY in .env or send api_key in request.",
        )

    # Chunk the document
    chunks = chunk_service.chunk(request.document_text)

    if not chunks:
        return {
            "results": [],
            "total_chunks": 0,
            "query": request.query,
        }

    try:
        service = GroqService(api_key=api_key)
        raw_results = await service.semantic_search(
            chunks=chunks,
            query=request.query,
        )
    except GroqServiceError as e:
        status = e.status_code or 500
        if status == 401:
            raise HTTPException(status_code=401, detail="Invalid API key")
        if status == 429:
            raise HTTPException(
                status_code=429,
                detail="Rate limit exceeded. Please wait and try again.",
            )
        raise HTTPException(status_code=500, detail=str(e.message))

    # Build response with chunk text for each result
    results = []
    for r in raw_results:
        idx = r["chunkIndex"]
        chunk = next((c for c in chunks if c["index"] == idx), None)
        if chunk:
            results.append(
                SearchResultItem(
                    chunk_index=idx,
                    relevance_score=r["relevanceScore"],
                    reason=r["reason"],
                    chunk_text=chunk["text"],
                )
            )

    return {
        "results": [r.model_dump() for r in results],
        "total_chunks": len(chunks),
        "query": request.query,
    }
