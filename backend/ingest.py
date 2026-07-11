import os
import sys
import logging

# Configure logging
logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")
logger = logging.getLogger("ingest")

# Add the current directory to python path to allow importing app module
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.config import settings
from app.services.csv_loader import CSVLoaderService
from app.rag.embeddings import BGEEmbeddings
from app.rag.vector_store import VectorStoreManager

def main():
    logger.info("Starting standalone database ingestion...")
    
    # 1. Load configuration paths
    csv_path = settings.TRADE_KNOWLEDGE_CSV
    logger.info(f"Target knowledge CSV: {csv_path}")
    logger.info(f"Vector Database: MongoDB Atlas ({settings.MONGODB_DB_NAME})")
    
    if not os.path.exists(csv_path):
        logger.error(f"Ingestion source file not found at: {csv_path}")
        sys.exit(1)
        
    try:
        # 2. Initialize Embeddings and Vector Store
        embeddings = BGEEmbeddings()
        vector_store = VectorStoreManager(embeddings)
        
        # Log status before
        count_before = vector_store.get_count()
        logger.info(f"Existing records count in ChromaDB: {count_before}")
        
        # 3. Load and clean CSV
        logger.info("Loading and cleaning trade knowledge entries...")
        records = CSVLoaderService.load_and_clean(csv_path)
        
        if not records:
            logger.error("No valid records found in the CSV file.")
            sys.exit(1)
            
        # 4. Clear database first if requested or to prevent duplicates
        logger.info("Clearing existing vector collection to ensure fresh indexing...")
        vector_store.clear()
        
        # 5. Ingest and embed records
        logger.info(f"Generating embeddings and indexing {len(records)} records...")
        indexed_count = vector_store.add_documents(records, source_name="Kaizen_Ops_Chatbot_Dataset.csv")
        
        # Log status after
        count_after = vector_store.get_count()
        logger.info(f"Ingestion complete. Indexed {indexed_count} items. Total items in DB: {count_after}")
        
        # Record history metadata
        _log_ingestion_metadata(count_after)
        
    except Exception as e:
        logger.error(f"Ingestion failed with exception: {str(e)}")
        sys.exit(1)

def _log_ingestion_metadata(count: int):
    """
    Log ingestion operation details to source_registry.json.
    """
    import json
    import time
    registry_path = os.path.join(settings.REPO_ROOT, "data", "sources_registry.json")
    
    entry = {
        "filename": "Kaizen_Ops_Chatbot_Dataset.csv",
        "file_type": "csv",
        "records_count": count,
        "last_modified": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
    }
    
    try:
        os.makedirs(os.path.dirname(registry_path), exist_ok=True)
        history = []
        if os.path.exists(registry_path):
            with open(registry_path, 'r', encoding='utf-8') as f:
                history = json.load(f)
        
        # Dedup
        history = [h for h in history if h["filename"] != "Kaizen_Ops_Chatbot_Dataset.csv"]
        history.append(entry)
        
        with open(registry_path, 'w', encoding='utf-8') as f:
            json.dump(history, f, indent=2)
    except Exception as e:
        logger.warning(f"Failed to write history metadata: {str(e)}")

if __name__ == "__main__":
    main()
