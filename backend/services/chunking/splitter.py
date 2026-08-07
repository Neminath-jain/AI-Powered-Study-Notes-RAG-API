import uuid
from typing import List
from backend.services.chunking.schemas import Chunk

class RecursiveCharacterTextSplitter:
    def __init__(
        self,
        chunk_size: int = 1000,
        chunk_overlap: int = 200,
        separators: List[str] = None
    ):
        self.chunk_size = chunk_size
        self.chunk_overlap = chunk_overlap
        self.separators = separators or ["\n\n", "\n", " ", ""]

    def _split_text(self, text: str, separators: List[str]) -> List[str]:
        if not separators or len(text) <= self.chunk_size:
            return [text]

        separator = separators[0]
        next_separators = separators[1:]

        # Split text on the current separator
        if separator == "":
            # Fallback to single character splitting
            return list(text)

        splits = text.split(separator)
        
        chunks = []
        current_chunk = []
        current_len = 0

        for part in splits:
            part_len = len(part)
            
            # If a single part is larger than chunk_size, recursively split it
            if part_len > self.chunk_size:
                if current_chunk:
                    chunks.append(separator.join(current_chunk))
                    current_chunk = []
                    current_len = 0
                
                # Split with next separator
                sub_splits = self._split_text(part, next_separators)
                chunks.extend(sub_splits)
            else:
                join_len = len(separator) if current_chunk else 0
                if current_len + join_len + part_len <= self.chunk_size:
                    current_chunk.append(part)
                    current_len += join_len + part_len
                else:
                    if current_chunk:
                        chunks.append(separator.join(current_chunk))
                    
                    # Accumulate overlap elements
                    overlap_chunk = []
                    overlap_len = 0
                    for prev_part in reversed(current_chunk):
                        prev_join = len(separator) if overlap_chunk else 0
                        if overlap_len + prev_join + len(prev_part) <= self.chunk_overlap:
                            overlap_chunk.insert(0, prev_part)
                            overlap_len += prev_join + len(prev_part)
                        else:
                            break
                    
                    current_chunk = overlap_chunk
                    current_chunk.append(part)
                    current_len = overlap_len + (len(separator) if overlap_chunk else 0) + part_len

        if current_chunk:
            chunks.append(separator.join(current_chunk))

        # Re-verify and filter out empty strings
        return [c for c in chunks if c.strip()]

    def split_text(self, text: str) -> List[str]:
        """Splits the text into size-bound string chunks."""
        return self._split_text(text, self.separators)

def split_page_text(
    page_text: str,
    document_id: uuid.UUID,
    page_number: int,
    start_chunk_index: int = 0,
    figures: List[str] = None,
) -> List[Chunk]:
    """
    Split page-level text into Chunk objects containing character offset indexes
    and structural metadata.
    """
    splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=200)
    text_runs = splitter.split_text(page_text)
    
    chunks = []
    current_search_pos = 0
    for idx, text in enumerate(text_runs):
        # Locate start and end offset in original text
        char_start = page_text.find(text, current_search_pos)
        if char_start == -1:
            # Fallback if find fails due to whitespace normalization anomalies
            char_start = current_search_pos
            
        char_end = char_start + len(text)
        
        # Advance search head incorporating overlap bounds
        current_search_pos = max(char_start + 1, char_end - 100)
        
        chunks.append(Chunk(
            document_id=document_id,
            chunk_index=start_chunk_index + idx,
            page_number=page_number,
            char_start=char_start,
            char_end=char_end,
            text=text,
            figures=figures or []
        ))
    return chunks
