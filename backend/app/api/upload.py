import os
import shutil
import logging
import json
from fastapi import APIRouter, Depends, UploadFile, File, HTTPException
from app.models.schemas import UploadResponse, KnowledgeStatusResponse
from app.services.document_processor import DocumentProcessorService
from app.rag.vector_store import VectorStoreManager
from app.dependencies import get_vector_store
from app.config import settings

logger = logging.getLogger("uvicorn.error")
router = APIRouter()

@router.post("/upload-document", response_model=UploadResponse)
async def upload_document(
    file: UploadFile = File(...),
    vector_store: VectorStoreManager = Depends(get_vector_store)
):
    """
    POST /api/upload-document
    Ingests PDF, CSV, or TXT document logs into ChromaDB for context enrichment.
    """
    filename = file.filename
    ext = os.path.splitext(filename)[1].lower()
    
    if ext not in [".csv", ".pdf", ".txt"]:
        raise HTTPException(
            status_code=400,
            detail="Unsupported document format. Only PDF, CSV, and TXT files are allowed."
        )
        
    # Enforce 10MB file size limit
    max_size = 10 * 1024 * 1024
    file.file.seek(0, 2)
    file_size = file.file.tell()
    file.file.seek(0)
    
    if file_size > max_size:
        raise HTTPException(
            status_code=400,
            detail="File size exceeds the 10MB upload limit."
        )
        
    # Write uploaded stream to disk
    os.makedirs(settings.UPLOADS_DIR, exist_ok=True)
    temp_filepath = os.path.join(settings.UPLOADS_DIR, filename)
    
    try:
        with open(temp_filepath, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
            
        # Parse and chunk document
        parsed_records = DocumentProcessorService.process_file(temp_filepath, filename)
        
        if not parsed_records:
            raise ValueError("No valid text records could be extracted from this document.")
            
        # Write to vector store
        records_indexed = vector_store.add_documents(parsed_records, source_name=filename)
        
        # Log to sources registry
        _log_upload_history(filename, ext.lstrip('.'), records_indexed)
        
        return UploadResponse(
            filename=filename,
            status="success",
            records_indexed=records_indexed,
            message=f"Ingestion successful. Indexed {records_indexed} segments from '{filename}' into vector database."
        )
        
    except Exception as e:
        logger.error(f"Upload ingestion failed: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to process and upload document '{filename}': {str(e)}"
        )
        
    finally:
        # Cleanup temp file
        if os.path.exists(temp_filepath):
            os.remove(temp_filepath)

def _log_upload_history(filename: str, file_type: str, count: int):
    """
    Records upload transactions to data/sources_registry.json for tracking knowledge state.
    """
    registry_path = os.path.join(settings.REPO_ROOT, "data", "sources_registry.json")
    import time
    
    history = []
    if os.path.exists(registry_path):
        try:
            with open(registry_path, 'r', encoding='utf-8') as f:
                history = json.load(f)
        except Exception:
            pass
            
    # Update entry if duplicate
    import json
    history = [item for item in history if item["filename"] != filename]
    
    history.append({
        "filename": filename,
        "file_type": file_type,
        "records_count": count,
        "last_modified": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
    })
    
    try:
        with open(registry_path, 'w', encoding='utf-8') as f:
            json.dump(history, f, indent=2)
    except Exception:
        pass


@router.get("/knowledge-status", response_model=KnowledgeStatusResponse)
async def get_knowledge_status(
    vector_store: VectorStoreManager = Depends(get_vector_store)
):
    """
    GET /api/knowledge-status
    Returns the initialization status, total vectors, and source files registry.
    """
    import json
    registry_path = os.path.join(settings.REPO_ROOT, "data", "sources_registry.json")
    
    source_files = []
    last_sync_time = None
    if os.path.exists(registry_path):
        try:
            with open(registry_path, 'r', encoding='utf-8') as f:
                source_files = json.load(f)
                if source_files:
                    # Find the latest last_modified time
                    last_sync_time = max(file.get("last_modified", "") for file in source_files)
        except Exception:
            pass
            
    try:
        total_vectors = vector_store.get_count()
    except Exception:
        total_vectors = 0
        
    is_initialized = total_vectors > 0
    
    return KnowledgeStatusResponse(
        is_initialized=is_initialized,
        total_terms=total_vectors,
        total_vectors=total_vectors,
        last_sync_time=last_sync_time,
        source_files=source_files
    )

