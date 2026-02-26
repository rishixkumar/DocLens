"""
Document Chunking Service

Splits document text into overlapping chunks for semantic search.
Chunk size and overlap are configurable for optimal retrieval.
"""

# Default chunk configuration (matches original spec)
CHUNK_WORDS = 400
CHUNK_OVERLAP = 50


class ChunkService:
    """
    Service for splitting documents into searchable chunks.

    Uses a sliding window approach with configurable word count
    and overlap to preserve context across chunk boundaries.
    """

    def __init__(
        self,
        chunk_words: int = CHUNK_WORDS,
        chunk_overlap: int = CHUNK_OVERLAP,
    ):
        """
        Initialize chunker with size and overlap.

        Args:
            chunk_words: Approximate words per chunk.
            chunk_overlap: Words to overlap between adjacent chunks.
        """
        self.chunk_words = chunk_words
        self.chunk_overlap = chunk_overlap
        self.step = chunk_words - chunk_overlap

    def chunk(self, text: str) -> list[dict]:
        """
        Split document text into overlapping chunks.

        Args:
            text: Raw document text.

        Returns:
            List of chunk dicts with keys: index, text, startWord, endWord.
        """
        words = text.strip().split()
        words = [w for w in words if w]  # filter empty
        chunks = []
        i = 0

        while i < len(words):
            chunk_words = words[i : i + self.chunk_words]
            chunks.append({
                "index": len(chunks),
                "text": " ".join(chunk_words),
                "startWord": i,
                "endWord": min(i + self.chunk_words, len(words)),
            })
            i += self.step

        return chunks
