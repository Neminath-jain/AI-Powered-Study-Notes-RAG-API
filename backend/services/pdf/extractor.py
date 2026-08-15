import io
import re
from typing import List, Dict, Any
from pypdf import PdfReader
from backend.core.logging import logger

import os

def extract_pages(pdf_bytes: bytes, note_id: str = None) -> List[Dict[str, Any]]:
    """
    Extracts raw text, page numbers, and images from PDF bytes.
    Saves extracted images under ./storage/figures/{note_id}/
    Returns: [{"page": page_num, "raw_text": text, "figures": [urls...]}, ...]
    """
    try:
        reader = PdfReader(io.BytesIO(pdf_bytes))
        pages = []

        figures_dir = None
        if note_id:
            figures_dir = os.path.join("storage", "figures", str(note_id))
            os.makedirs(figures_dir, exist_ok=True)

        for idx, page in enumerate(reader.pages):
            page_num = idx + 1
            text = page.extract_text() or ""
            figure_urls = []

            # OCR Fallback for scanned/handwritten PDF pages with little or no text
            if len(text.strip()) < 30:
                try:
                    import pytesseract
                    from PIL import Image
                    ocr_texts = []

                    # Method 1: Try pdf2image with low DPI (72) & thumbnail resize to keep RAM < 30MB
                    try:
                        from pdf2image import convert_from_bytes
                        rendered_images = convert_from_bytes(pdf_bytes, first_page=page_num, last_page=page_num, dpi=72)
                        for r_img in rendered_images:
                            r_img.thumbnail((1000, 1000))
                            ocr_txt = pytesseract.image_to_string(r_img)
                            if ocr_txt.strip():
                                ocr_texts.append(ocr_txt.strip())
                            del r_img
                        del rendered_images
                        import gc
                        gc.collect()
                    except Exception as pdf2img_err:
                        logger.debug("pdf2image page render skipped", page=page_num, error=str(pdf2img_err))

                    # Method 2: Fallback to page.images extraction if pdf2image unavailable
                    if not ocr_texts and hasattr(page, "images"):
                        for img in page.images:
                            img_obj = Image.open(io.BytesIO(img.data))
                            ocr_txt = pytesseract.image_to_string(img_obj)
                            if ocr_txt.strip():
                                ocr_texts.append(ocr_txt.strip())

                    if ocr_texts:
                        text = "\n".join(ocr_texts)
                        logger.info("Successfully executed OCR fallback on scanned page", page=page_num, text_length=len(text))
                except Exception as ocr_err:
                    logger.debug("OCR fallback skipped or pytesseract not configured", error=str(ocr_err))

            if figures_dir and hasattr(page, "images"):
                try:
                    from PIL import Image
                    for img_idx, img in enumerate(page.images):
                        # Filter 1: Byte size cutoff (< 4KB is usually a tiny graphic icon)
                        if not img.data or len(img.data) < 4000:
                            continue

                        try:
                            pil_img = Image.open(io.BytesIO(img.data))
                            width, height = pil_img.size
                            
                            # Filter 2: Dimensions cutoff (< 100px width/height is an icon/bullet)
                            if width < 100 or height < 100:
                                continue
                                
                            # Filter 3: Aspect ratio cutoff (> 4.5:1 or < 1:4.5 is a header/footer banner/watermark line)
                            aspect = width / max(height, 1)
                            if aspect > 4.5 or aspect < 0.22:
                                continue

                            # Filter 4: Check if image is mostly a single watermark text like VTUCircle
                            try:
                                import pytesseract
                                img_ocr = pytesseract.image_to_string(pil_img).lower()
                                if any(wm in img_ocr for wm in ["vtucircle", "vtu circle", "watermark", "downloaded from"]):
                                    logger.info("Filtered out publisher watermark image", page=page_num, ocr=img_ocr.strip())
                                    continue
                            except Exception:
                                pass
                        except Exception:
                            pass

                        ext = "png"
                        if hasattr(img, "name") and "." in img.name:
                            ext = img.name.split(".")[-1].lower()
                        
                        img_filename = f"page_{page_num}_img_{img_idx + 1}.{ext}"
                        img_path = os.path.join(figures_dir, img_filename)
                        
                        with open(img_path, "wb") as fp:
                            fp.write(img.data)
                        
                        rel_url = f"/static/storage/figures/{note_id}/{img_filename}"
                        figure_urls.append(rel_url)
                except Exception as img_err:
                    logger.warning("Failed to extract image from PDF page", page=page_num, error=str(img_err))

            pages.append({
                "page": page_num,
                "raw_text": text,
                "figures": figure_urls,
            })
        return pages
    except Exception as e:
        logger.error("PDF text extraction failed", error=str(e))
        raise ValueError("Invalid PDF file or unable to read text.") from e

def clean_page_text(raw_text: str) -> str:
    """
    Strips page numbers, common running headers/footers, and boilerplate.
    Preserves paragraph structure by maintaining double newlines while normalizing spacing.
    """
    if not raw_text:
        return ""

    lines = raw_text.split("\n")
    cleaned_lines = []

    # Heuristics to strip running headers, footers, page counts
    for line in lines:
        stripped = line.strip()
        # Skip empty lines at this stage (we rebuild paragraph gaps later)
        if not stripped:
            continue
        # Skip purely numeric lines (page numbers)
        if re.match(r"^\d+$", stripped):
            continue
        # Skip "Page X" or "Page X of Y" labels
        if re.match(r"^(page\s+\d+|\d+\s+of\s+\d+|page\s+\d+\s+of\s+\d+)$", stripped, re.IGNORECASE):
            continue
        # Skip common academic headers like "running head:" or "chapter \d+" if simple
        if re.match(r"^(running head|chapter\s+\d+|section\s+\d+(\.\d+)*)$", stripped, re.IGNORECASE):
            continue
        
        cleaned_lines.append(line)

    # Join the lines back
    text_processed = "\n".join(cleaned_lines)

    # Detect paragraphs using double newlines (or empty/blank line runs)
    paragraphs = re.split(r'\n\s*\n', text_processed)
    cleaned_paragraphs = []

    for paragraph in paragraphs:
        # Inside each paragraph, replace word-wrapping single newlines with spaces
        para_single_line = re.sub(r'(?<!\n)\n(?!\n)', ' ', paragraph)
        # Normalize double spacing and trailing whitespace
        para_clean = re.sub(r'[ \t]+', ' ', para_single_line).strip()
        if para_clean:
            cleaned_paragraphs.append(para_clean)

    # Return paragraphs separated by clear double newlines
    return "\n\n".join(cleaned_paragraphs)

def prepare_text_for_chunking(pages: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """
    Runs cleaning across all pages and returns normalized text mapped to page numbers and figures.
    Returns: [{"page": page_num, "cleaned_text": text, "figures": [urls...]}, ...]
    """
    prepared_pages = []
    for p in pages:
        cleaned = clean_page_text(p["raw_text"])
        if cleaned or p.get("figures"):
            prepared_pages.append({
                "page": p["page"],
                "cleaned_text": cleaned,
                "figures": p.get("figures", [])
            })
    return prepared_pages
