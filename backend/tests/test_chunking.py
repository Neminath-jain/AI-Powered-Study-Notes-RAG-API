import unittest
import uuid
from backend.services.chunking.splitter import RecursiveCharacterTextSplitter, split_page_text

class TestChunking(unittest.TestCase):
    def test_recursive_splitter_basic(self):
        splitter = RecursiveCharacterTextSplitter(chunk_size=15, chunk_overlap=2)
        text = "hello world\n\nthis is tests"
        chunks = splitter.split_text(text)
        
        # Verify splits happen on delimiter boundaries where possible
        self.assertTrue(len(chunks) > 1)
        for c in chunks:
            self.assertTrue(len(c) <= 15)

    def test_splitter_overlap_retained(self):
        splitter = RecursiveCharacterTextSplitter(chunk_size=20, chunk_overlap=8, separators=[" "])
        text = "word1 word2 word3 word4 word5"
        chunks = splitter.split_text(text)
        
        # Verify contiguous chunks overlap
        self.assertTrue(len(chunks) > 1)
        # Check first and second chunks
        # e.g., "word1 word2 word3" and "word2 word3 word4 word5"
        self.assertTrue(any(word in chunks[1] for word in chunks[0].split()))

    def test_split_page_metadata_offsets(self):
        doc_id = uuid.uuid4()
        page_text = "This is a full sentence to check character boundaries offsets."
        # Split into small chunks to enforce multiple items
        chunks = split_page_text(page_text, document_id=doc_id, page_number=1)
        
        self.assertTrue(len(chunks) > 0)
        for idx, chunk in enumerate(chunks):
            self.assertEqual(chunk.document_id, doc_id)
            self.assertEqual(chunk.page_number, 1)
            # Check character ranges correspond to text slice
            sliced = page_text[chunk.char_start:chunk.char_end]
            self.assertEqual(sliced, chunk.text)

if __name__ == "__main__":
    unittest.main()
