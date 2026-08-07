import unittest
from backend.services.pdf.extractor import clean_page_text, prepare_text_for_chunking

class TestPDFPipeline(unittest.TestCase):
    def test_clean_page_text_removes_page_numbers(self):
        raw_text = "Page 3\nThis is the actual page content.\n123"
        cleaned = clean_page_text(raw_text)
        self.assertEqual(cleaned, "This is the actual page content.")

    def test_clean_page_text_removes_headers_footers(self):
        raw_text = "Chapter 4: Advanced Algorithms\nThis is core subject text.\nRunning head: algorithms"
        cleaned = clean_page_text(raw_text)
        self.assertEqual(cleaned, "This is core subject text.")

    def test_clean_page_text_preserves_paragraphs(self):
        raw_text = (
            "Paragraph one is here.\nIt continues on single line wraps.\n\n"
            "Paragraph two starts after a double newline gap."
        )
        cleaned = clean_page_text(raw_text)
        expected = (
            "Paragraph one is here. It continues on single line wraps.\n\n"
            "Paragraph two starts after a double newline gap."
        )
        self.assertEqual(cleaned, expected)

    def test_prepare_text_for_chunking(self):
        pages = [
            {"page": 1, "raw_text": "Page 1\nSome contents."},
            {"page": 2, "raw_text": "Page 2\nOther contents."}
        ]
        prepared = prepare_text_for_chunking(pages)
        self.assertEqual(len(prepared), 2)
        self.assertEqual(prepared[0]["page"], 1)
        self.assertEqual(prepared[0]["cleaned_text"], "Some contents.")

if __name__ == "__main__":
    unittest.main()
