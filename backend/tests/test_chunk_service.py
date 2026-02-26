"""
Tests for the ChunkService.

Covers chunking logic, edge cases, overlap behavior, and boundary conditions.
"""

import pytest

from app.services.chunk_service import ChunkService


def test_chunk_empty_string():
    """Empty string should produce no chunks."""
    service = ChunkService(chunk_words=100, chunk_overlap=20)
    result = service.chunk("")
    assert result == []


def test_chunk_whitespace_only():
    """Whitespace-only string should produce no chunks."""
    service = ChunkService(chunk_words=100, chunk_overlap=20)
    result = service.chunk("   \n\t  ")
    assert result == []


def test_chunk_smaller_than_chunk_size(chunk_service: ChunkService):
    """Document smaller than one chunk should produce single chunk."""
    text = " ".join(["word"] * 50)
    result = chunk_service.chunk(text)
    assert len(result) == 1
    assert result[0]["index"] == 0
    assert result[0]["startWord"] == 0
    assert result[0]["endWord"] == 50
    assert len(result[0]["text"].split()) == 50


def test_chunk_exactly_one_chunk():
    """Document exactly one chunk size with zero overlap produces one chunk."""
    service = ChunkService(chunk_words=100, chunk_overlap=0)
    text = " ".join(["word"] * 100)
    result = service.chunk(text)
    assert len(result) == 1
    assert result[0]["endWord"] == 100


def test_chunk_multiple_chunks_with_overlap(chunk_service: ChunkService):
    """Multiple chunks should have correct overlap."""
    # 100 words per chunk, 20 overlap => step of 80
    # 250 words => chunks at 0-100, 80-180, 160-250
    text = " ".join([f"word{i}" for i in range(250)])
    result = chunk_service.chunk(text)
    assert len(result) >= 2
    # First chunk
    assert result[0]["startWord"] == 0
    assert result[0]["endWord"] == 100
    # Second chunk should start at 80 (overlap)
    assert result[1]["startWord"] == 80
    assert result[1]["endWord"] == 180


def test_chunk_indices_are_sequential(chunk_service: ChunkService):
    """Chunk indices should be 0, 1, 2, ..."""
    text = " ".join(["word"] * 500)
    result = chunk_service.chunk(text)
    for i, chunk in enumerate(result):
        assert chunk["index"] == i


def test_chunk_text_reconstructable(chunk_service: ChunkService):
    """Chunk text should contain the correct words."""
    words = [f"w{i}" for i in range(150)]
    text = " ".join(words)
    result = chunk_service.chunk(text)
    assert len(result) >= 2
    first_chunk_words = result[0]["text"].split()
    assert first_chunk_words == words[:100]


def test_chunk_overlap_zero():
    """With zero overlap, chunks should be contiguous."""
    service = ChunkService(chunk_words=50, chunk_overlap=0)
    text = " ".join(["x"] * 150)
    result = service.chunk(text)
    assert len(result) == 3
    assert result[0]["endWord"] == 50
    assert result[1]["startWord"] == 50
    assert result[1]["endWord"] == 100
    assert result[2]["startWord"] == 100


def test_chunk_single_word():
    """Single word document should produce one chunk."""
    service = ChunkService(chunk_words=100, chunk_overlap=20)
    result = service.chunk("hello")
    assert len(result) == 1
    assert result[0]["text"] == "hello"
    assert result[0]["startWord"] == 0
    assert result[0]["endWord"] == 1


def test_chunk_preserves_word_order(chunk_service: ChunkService):
    """Each chunk's text should match the corresponding word slice."""
    text = "one two three four five " * 25  # 125 words
    words = text.split()
    result = chunk_service.chunk(text)
    for chunk in result:
        start, end = chunk["startWord"], chunk["endWord"]
        chunk_words = chunk["text"].split()
        expected = words[start:end]
        assert chunk_words == expected
