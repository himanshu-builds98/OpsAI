import os
import sys

# Add backend directory to paths
root_dir = os.path.dirname(os.path.abspath(__file__))
backend_dir = os.path.join(root_dir, "backend")
sys.path.insert(0, backend_dir)

if __name__ == "__main__":
    from backend.ingest import main
    main()
