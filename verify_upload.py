"""
Verify that the upload landed in fact_sales without duplicating existing rows
"""
from sqlalchemy import create_engine, text
from dotenv import load_dotenv
import os

load_dotenv()

db_user = os.getenv('POSTGRES_USER', 'postgres')
db_password = os.getenv('POSTGRES_PASSWORD', 'postgres')
db_host = os.getenv('POSTGRES_HOST', 'localhost')
db_port = os.getenv('POSTGRES_PORT', '5432')
db_name = os.getenv('POSTGRES_DB', 'sales_platform')

connection_string = f"postgresql://{db_user}:{db_password}@{db_host}:{db_port}/{db_name}"
engine = create_engine(connection_string)

with engine.connect() as conn:
    # Check fact_sales row count
    result = conn.execute(text("SELECT COUNT(*) FROM fact_sales"))
    fact_count = result.fetchone()[0]
    print(f"fact_sales total rows: {fact_count}")
    
    # Check for test transactions
    result = conn.execute(text("""
        SELECT sale_id, date_id, product_id, customer_id, quantity, revenue 
        FROM fact_sales 
        WHERE sale_id LIKE 'TXN-TEST-%'
    """))
    test_rows = result.fetchall()
    print(f"\nTest transactions in fact_sales: {len(test_rows)}")
    for row in test_rows:
        print(f"  {row}")
    
    # Check staging_sales for test data
    result = conn.execute(text("""
        SELECT COUNT(*) FROM staging_sales 
        WHERE transaction_id LIKE 'TXN-TEST-%'
    """))
    staging_test_count = result.fetchone()[0]
    print(f"\nTest transactions in staging_sales: {staging_test_count}")
    
    # Check for duplicates
    result = conn.execute(text("""
        SELECT sale_id, COUNT(*) as cnt 
        FROM fact_sales 
        GROUP BY sale_id 
        HAVING COUNT(*) > 1
    """))
    duplicates = result.fetchall()
    print(f"\nDuplicate sale_ids in fact_sales: {len(duplicates)}")
    if duplicates:
        for dup in duplicates:
            print(f"  {dup}")

print("\nVerification complete!")
