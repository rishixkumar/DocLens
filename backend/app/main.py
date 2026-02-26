"""
DocLens FastAPI Application Entry Point

Configures and runs the FastAPI application with CORS, routes, and middleware.
The API serves as the backend for the React frontend, handling all AI/LLM
operations via the Groq API.
"""

from fastapi import FastAPI
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.exceptions import RequestValidationError

from app.api.routes import analysis, search, health

app = FastAPI(
    title="DocLens API",
    description="AI-powered document analysis backend using Groq Llama 3.3 70B",
    version="1.0.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc",
)

# CORS configuration for React frontend (dev and prod)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173", "http://localhost:5000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register route modules
app.include_router(health.router, prefix="/api", tags=["Health"])
app.include_router(analysis.router, prefix="/api", tags=["Analysis"])
app.include_router(search.router, prefix="/api", tags=["Search"])


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request, exc: RequestValidationError):
    """Format validation errors for clearer client feedback."""
    errors = exc.errors()
    messages = []
    for e in errors:
        loc = ".".join(str(x) for x in e["loc"] if x != "body")
        msg = e.get("msg", "Invalid value")
        messages.append(f"{loc}: {msg}" if loc else msg)
    return JSONResponse(
        status_code=422,
        content={"detail": "; ".join(messages) if messages else "Validation failed"},
    )


@app.get("/")
async def root():
    """Root endpoint - API info."""
    return {
        "service": "DocLens API",
        "version": "1.0.0",
        "docs": "/api/docs",
    }
