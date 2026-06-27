import os
import logging
from typing import List, Dict, Any
from pypdf import PdfReader
from app.services.csv_loader import CSVLoaderService

logger = logging.getLogger("uvicorn.error")

class DocumentProcessorService:
    """
    Parses and chunks uploaded documents (PDF, CSV, TXT) into indexable knowledge units.
    """
    @staticmethod
    def process_file(filepath: str, filename: str) -> List[Dict[str, Any]]:
        ext = os.path.splitext(filename)[1].lower()
        logger.info(f"Processing uploaded file: {filename} (Ext: {ext})")
        
        if ext == ".csv":
            return DocumentProcessorService._process_csv(filepath)
        elif ext == ".pdf":
            return DocumentProcessorService._process_pdf(filepath, filename)
        elif ext == ".txt":
            return DocumentProcessorService._process_txt(filepath, filename)
        else:
            raise ValueError(f"Unsupported file type: {ext}")

    @staticmethod
    def _process_csv(filepath: str) -> List[Dict[str, Any]]:
        # Use existing CSV loader to clean and normalize columns
        return CSVLoaderService.load_and_clean(filepath)

    @staticmethod
    def _process_pdf(filepath: str, filename: str) -> List[Dict[str, Any]]:
        try:
            reader = PdfReader(filepath)
            full_text = ""
            for idx, page in enumerate(reader.pages):
                text = page.extract_text()
                if text:
                    full_text += f"\n--- Page {idx + 1} ---\n{text}"
            
            if not full_text.strip():
                raise ValueError("PDF file is empty or scanned without OCR text.")

            return DocumentProcessorService._chunk_text(full_text, filename)
        except Exception as e:
            logger.error(f"Error parsing PDF '{filename}': {str(e)}")
            raise e

    @staticmethod
    def _process_txt(filepath: str, filename: str) -> List[Dict[str, Any]]:
        try:
            with open(filepath, 'r', encoding='utf-8') as f:
                text = f.read()
            
            if not text.strip():
                raise ValueError("Text file is empty.")

            return DocumentProcessorService._chunk_text(text, filename)
        except Exception as e:
            logger.error(f"Error parsing TXT '{filename}': {str(e)}")
            raise e

    @staticmethod
    def _chunk_text(text: str, filename: str) -> List[Dict[str, Any]]:
        # Simple character-based splitting with overlap
        chunk_size = 1000
        overlap = 150
        chunks = []
        
        start = 0
        while start < len(text):
            end = start + chunk_size
            chunk = text[start:end].strip()
            if chunk:
                chunks.append(chunk)
            start += (chunk_size - overlap)
            
        normalized_records = []
        for idx, chunk in enumerate(chunks):
            # Create a pseudo-term mapping for unstructured chunks
            term_title = f"{filename} (Section {idx + 1})"
            normalized_records.append({
                "Term": term_title,
                "Definition": chunk,
                "Created By": "Uploaded Reference Document",
                "Used By": "Logistics & Operations Teams",
                "Purpose": f"Extracted reference from file: {filename}",
                "Common Problems": "Contextual validation required"
            })
            
        return normalized_records
