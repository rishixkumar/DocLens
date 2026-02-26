"""
Groq API Service

Handles all communication with the Groq OpenAI-compatible API.
Uses the Llama 3.3 70B model for document analysis and semantic search.
"""

import json
import re
from typing import Any

import httpx

# Groq API configuration
GROQ_ENDPOINT = "https://api.groq.com/openai/v1/chat/completions"
MODEL = "llama-3.3-70b-versatile"
MAX_TOKENS = 2048
TEMPERATURE = 0.2


class GroqServiceError(Exception):
    """Custom exception for Groq API errors."""

    def __init__(self, message: str, status_code: int | None = None):
        self.message = message
        self.status_code = status_code
        super().__init__(self.message)


class GroqService:
    """
    Service class for interacting with the Groq API.

    Handles document analysis and semantic search by constructing
    appropriate prompts and parsing LLM responses.
    """

    def __init__(self, api_key: str):
        """
        Initialize the Groq service with an API key.

        Args:
            api_key: Groq API key for authentication.
        """
        self.api_key = api_key
        self._headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
        }

    async def chat_completion(
        self,
        messages: list[dict[str, str]],
        system_prompt: str,
    ) -> str:
        """
        Send a chat completion request to the Groq API.

        Args:
            messages: List of message dicts with 'role' and 'content'.
            system_prompt: System prompt to guide model behavior.

        Returns:
            The content of the assistant's response.

        Raises:
            GroqServiceError: On API errors (auth, rate limit, etc.).
        """
        full_messages = [
            {"role": "system", "content": system_prompt},
            *messages,
        ]
        payload = {
            "model": MODEL,
            "messages": full_messages,
            "temperature": TEMPERATURE,
            "max_tokens": MAX_TOKENS,
        }

        async with httpx.AsyncClient(timeout=60.0) as client:
            response = await client.post(
                GROQ_ENDPOINT,
                headers=self._headers,
                json=payload,
            )

        if response.status_code != 200:
            try:
                err_data = response.json()
                msg = err_data.get("error", {}).get("message", response.text)
            except Exception:
                msg = response.text
            raise GroqServiceError(msg, response.status_code)

        data = response.json()
        content = (
            data.get("choices", [{}])[0].get("message", {}).get("content") or ""
        )
        return content

    async def analyze_document(
        self,
        document_text: str,
        document_type: str,
    ) -> str:
        """
        Analyze a document and return structured analysis sections.

        Args:
            document_text: Raw text content of the document.
            document_type: Type hint (contracts, research, business, general).

        Returns:
            Raw text response with labeled sections.
        """
        type_prompts = {
            "contracts": "Contracts & Legal Docs — focus on obligations, penalties, termination clauses, payment terms, defined terms, and risk flags.",
            "research": "Research Papers — focus on abstract, methodology, key findings, limitations, conclusions, and citations of note.",
            "business": "Business Reports — focus on KPIs, financial figures, strategic decisions, action items, timelines, and named stakeholders.",
            "general": "General PDF / Other — broad extraction of the most important facts, themes, and recommendations.",
        }
        type_context = type_prompts.get(
            document_type, type_prompts["general"]
        )

        system_prompt = f"""You are an expert document analyst specializing in {type_context} Analyze the following document and respond with exactly these five sections, each preceded by its label on its own line: EXECUTIVE_SUMMARY, KEY_POINTS, CRITICAL_FLAGS, NAMED_ENTITIES, RECOMMENDED_ACTIONS. Under EXECUTIVE_SUMMARY write 3-5 sentences. Under KEY_POINTS write a numbered list of the most important facts, clauses, or findings. Under CRITICAL_FLAGS list any risks, deadlines, penalties, obligations, or unusual items — write NONE if there are none. Under NAMED_ENTITIES list people, organizations, dates, and monetary amounts as comma-separated items grouped by type. Under RECOMMENDED_ACTIONS list what the reader should do or pay attention to. Be concise, precise, and prioritize information a busy professional would need immediately."""

        return await self.chat_completion(
            [{"role": "user", "content": document_text}],
            system_prompt,
        )

    async def semantic_search(
        self,
        chunks: list[dict[str, Any]],
        query: str,
    ) -> list[dict[str, Any]]:
        """
        Perform semantic search over document chunks using the LLM.

        Args:
            chunks: List of chunk dicts with 'index' and 'text'.
            query: User's search query.

        Returns:
            List of result dicts with chunkIndex, relevanceScore, reason.
        """
        chunks_text = "\n\n".join(
            f"[{c['index']}] {c['text']}" for c in chunks
        )
        user_message = f'Search Query: "{query}"\n\nDocument Chunks:\n{chunks_text}'

        system_prompt = """You are a semantic search engine. The user has provided a search query and a numbered list of document chunks. Return a JSON array of objects. Each object must have: 'chunkIndex' (integer), 'relevanceScore' (integer 1-10), and 'reason' (one sentence explaining why this chunk matches the query). Include every chunk that is contextually, semantically, or thematically relevant to the query — even if the exact words don't appear. Only include chunks with a relevanceScore of 6 or higher. Sort results by relevanceScore descending. If no chunks are relevant, return an empty array. Return ONLY valid JSON, no markdown, no preamble."""

        content = await self.chat_completion(
            [{"role": "user", "content": user_message}],
            system_prompt,
        )

        # Parse JSON from response (handle markdown fences)
        cleaned = re.sub(r"```json\n?|\n?```", "", content).strip()
        try:
            results = json.loads(cleaned)
        except json.JSONDecodeError:
            return []

        if not isinstance(results, list):
            return []

        # Validate and filter results
        valid = []
        for r in results:
            if not isinstance(r, dict):
                continue
            idx = r.get("chunkIndex")
            score = r.get("relevanceScore", 0)
            reason = r.get("reason", "")
            if idx is not None and isinstance(score, (int, float)):
                valid.append({
                    "chunkIndex": int(idx),
                    "relevanceScore": max(1, min(10, int(score))),
                    "reason": str(reason) if reason else "",
                })
        return valid
