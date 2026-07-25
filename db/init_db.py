import os
import sys
from pathlib import Path
from dotenv import load_dotenv
from sqlalchemy import create_engine, inspect, text

def init_database():
    # Load environment variables from root .env file
    project_root = Path(__file__).resolve().parent.parent
    env_path = project_root / ".env"
    load_dotenv(dotenv_path=env_path)

    user = os.getenv("POSTGRES_USER", "postgres")
    password = os.getenv("POSTGRES_PASSWORD", "postgres")
    host = os.getenv("POSTGRES_HOST", "localhost")
    port = os.getenv("POSTGRES_PORT", "5432")
    db_name = os.getenv("POSTGRES_DB", "sales_platform")

    db_url = f"postgresql://{user}:{password}@{host}:{port}/{db_name}"
    print(f"Connecting to PostgreSQL database '{db_name}' at {host}:{port}...")

    schema_file = project_root / "db" / "schema.sql"
    if not schema_file.exists():
        print(f"Error: Schema file not found at {schema_file}")
        sys.exit(1)

    try:
        engine = create_engine(db_url)
        with open(schema_file, "r", encoding="utf-8") as f:
            schema_sql = f.read()

        print("Executing schema.sql DDL statements...")
        with engine.begin() as conn:
            conn.execute(text(schema_sql))

        print("\nDatabase Schema Initialization Successful!")
        
        # Verify created tables
        inspector = inspect(engine)
        tables = inspector.get_table_names()
        
        print("\nCreated Database Tables:")
        print("-----------------------")
        for table in sorted(tables):
            print(f"  [+] {table}")
            
        print(f"\nTotal tables created: {len(tables)}")
        return tables

    except Exception as e:
        print(f"\nDatabase Initialization Failed: {e}")
        print("\nTroubleshooting Tips:")
        print("1. Is PostgreSQL container running? Run: docker-compose up -d")
        print("2. Check port 5432 availability and .env credentials.")
        sys.exit(1)

if __name__ == "__main__":
    init_database()
