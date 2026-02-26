"""
Document analysis API routes.

Handles requests to analyze documents via the Groq API and return
structured analysis sections. Uses GROQ_API_KEY from env when client
does not provide an api_key.
"""

from fastapi import APIRouter, HTTPException

from app.config import get_groq_api_key
from app.models.schemas import AnalyzeRequest
from app.services.groq_service import GroqService, GroqServiceError

# Maximum characters to send to the model (context limit safety)
MAX_CHARS = 24000

router = APIRouter()


@router.post("/analyze")
async def analyze_document(request: AnalyzeRequest):
    """
    Analyze a document and return structured sections.

    The analysis includes: Executive Summary, Key Points, Critical Flags,
    Named Entities, and Recommended Actions. Output format is tailored
    to the document type (contracts, research, business, general).

    Args:
        request: AnalyzeRequest with document_text, document_type, api_key (optional).

    Returns:
        Raw analysis text with labeled sections.

    Raises:
        HTTPException: On invalid API key, rate limit, or other Groq errors.
    """
    api_key = get_groq_api_key(request.api_key)
    if not api_key:
        raise HTTPException(
            status_code=401,
            detail="No API key provided. Set GROQ_API_KEY in .env or send api_key in request.",
        )

    # Truncate if necessary
    text = request.document_text
    truncated = False
    if len(text) > MAX_CHARS:
        text = text[:MAX_CHARS]
        truncated = True

    try:
        service = GroqService(api_key=api_key)
        result = await service.analyze_document(
            document_text=text,
            document_type=request.document_type,
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
        if status == 400:
            raise HTTPException(status_code=400, detail=str(e.message))
        raise HTTPException(status_code=500, detail=str(e.message))

    return {
        "analysis": result,
        "truncated": truncated,
    }
