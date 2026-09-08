"""
Database initialization wrapper.
Delegates to root init_db.py to maintain a single source of truth.
"""
import sys
from pathlib import Path

# Add project root to sys.path
PROJECT_ROOT = Path(__file__).resolve().parent.parent
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from init_db import init_database

if __name__ == "__main__":
    success = init_database()
    sys.exit(0 if success else 1)
