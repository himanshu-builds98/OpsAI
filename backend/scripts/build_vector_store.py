import sys
from pathlib import Path

# Add backend to Python path
ROOT = Path(__file__).resolve().parents[1]
sys.path.append(str(ROOT))

from app.dependencies import get_vector_store
from app.services.csv_loader import CSVLoaderService
from app.config import settings

CSV_PATH = r"C:\Users\Divyam Chandak\Desktop\DivyamChandak\divyam\kaizen_ops_bot\Kaizen_OPS_ChatBot_Info.csv"

print("=" * 60)
print("Building Chroma Vector Store")
print("=" * 60)

vector_store = get_vector_store()

# Clear existing vectors
vector_store.clear()

# Load CSV
records = CSVLoaderService.load_and_clean(CSV_PATH)

print(f"Loaded {len(records)} records")

# Build embeddings
indexed = vector_store.add_documents(
    records,
    source_name="Kaizen_OPS_ChatBot_Info.csv"
)

print(f"Indexed {indexed} documents")
print(f"Final vector count: {vector_store.get_count()}")

print("Done.")