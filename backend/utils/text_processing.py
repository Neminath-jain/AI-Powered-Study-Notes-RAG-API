import io
import re
from typing import List, Dict, Any
from pypdf import PdfReader
from backend.core.logging import logger

def extract_text_from_pdf(pdf_bytes: bytes) -> List[Dict[str, Any]]:
    """
    Extracts text page-by-page from a PDF file.
    Returns a list of dicts: [{"page": page_num, "text": text}, ...]
    """
    try:
        reader = PdfReader(io.BytesIO(pdf_bytes))
        pages_data = []
        for i, page in enumerate(reader.pages):
            text = page.extract_text() or ""
            pages_data.append({"page": i + 1, "text": text})
        return pages_data
    except Exception as e:
        logger.error("Failed to extract text from PDF", error=str(e))
        raise ValueError("Invalid PDF format or unreadable text") from e

def clean_text(text: str) -> str:
    """Clean whitespaces, double spacing, and trim."""
    # Replace any multiple space/newline chars with single space
    text = re.sub(r"\s+", " ", text)
    return text.strip()

def chunk_text(
    pages_data: List[Dict[str, Any]], 
    chunk_size: int = 800, 
    chunk_overlap: int = 150
) -> List[Dict[str, Any]]:
    """
    Chunks cleaned page texts using a sliding window.
    Tracks exact page numbers for each chunk to support accurate frontend citations.
    """
    chunks = []
    
    for page_item in pages_data:
        page_num = page_item["page"]
        text = clean_text(page_item["text"])
        if not text or len(text) < 10:
            continue
            
        length = len(text)
        start = 0
        while start < length:
            end = min(start + chunk_size, length)
            
            # Adjust end to align with word boundary if possible
            if end < length:
                # Look back up to 20% of chunk size for a spacing/punctuation boundary
                lookback_limit = max(start, end - 150)
                boundary_index = end
                while boundary_index > lookback_limit:
                    if text[boundary_index - 1] in (" ", "\n", ".", "!", "?"):
                        end = boundary_index
                        break
                    boundary_index -= 1
                    
            chunk_content = text[start:end].strip()
            if chunk_content:
                chunks.append({
                    "text": chunk_content,
                    "page": page_num
                })
                
            # Slide window
            if end == length:
                break
            start = end - chunk_overlap
            if start >= end:
                start = end  # Prevent infinite loops
                
    return chunks
