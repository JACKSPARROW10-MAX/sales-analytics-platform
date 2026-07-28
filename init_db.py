"""
Initialize the database schema.
Run this after starting Docker with: docker-compose up -d
"""
import logging
import os
from sqlalchemy import create_engine, text
from dotenv import load_dotenv

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

load_dotenv()


def get_db_connection():
    """Create SQLAlchemy engine using environment variables."""
    db_user = os.getenv('POSTGRES_USER', 'postgres')
    db_password = os.getenv('POSTGRES_PASSWORD', 'postgres')
    db_host = os.getenv('POSTGRES_HOST', 'localhost')
    db_port = os.getenv('POSTGRES_PORT', '5432')
    db_name = os.getenv('POSTGRES_DB', 'sales_platform')
    
    # Connect to default 'postgres' database first to create the target database
    connection_string = f"postgresql://{db_user}:{db_password}@{db_host}:{db_port}/postgres"
    engine = create_engine(connection_string)
    
    return engine, db_name


def init_database():
    """Initialize the database by creating the database and schema."""
    engine, db_name = get_db_connection()
    
    try:
        with engine.connect() as conn:
            # Check if database exists
            result = conn.execute(text(
                "SELECT 1 FROM pg_database WHERE datname = :db_name"
            ), {'db_name': db_name})
            
            if not result.fetchone():
                # Create database
                conn.execute(text(f"COMMIT"))
                conn.execute(text(f"CREATE DATABASE {db_name}"))
                logger.info(f"Created database: {db_name}")
            else:
                logger.info(f"Database {db_name} already exists")
        
        # Now connect to the target database and create schema
        connection_string = f"postgresql://{os.getenv('POSTGRES_USER', 'postgres')}:{os.getenv('POSTGRES_PASSWORD', 'postgres')}@{os.getenv('POSTGRES_HOST', 'localhost')}:{os.getenv('POSTGRES_PORT', '5432')}/{db_name}"
        engine = create_engine(connection_string)
        
        # Read and execute schema
        schema_path = "db/schema.sql"
        with open(schema_path, 'r') as f:
            schema_sql = f.read()
        
        with engine.connect() as conn:
            conn.execute(text(schema_sql))
            conn.commit()
        
        logger.info("Database schema created successfully")
        
        # Verify tables
        with engine.connect() as conn:
            result = conn.execute(text("""
                SELECT tablename FROM pg_tables 
                WHERE schemaname = 'public'
                ORDER BY tablename
            """))
            tables = [row[0] for row in result]
            logger.info(f"Tables created: {tables}")
        
        return True
    
    except Exception as e:
        logger.error(f"Error initializing database: {e}")
        raise


if __name__ == "__main__":
    init_database()
    print("Database initialization complete!")
