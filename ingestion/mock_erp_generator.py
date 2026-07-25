import os
import random
import pandas as pd
import numpy as np
from datetime import datetime, timedelta

def generate_mock_erp_data(num_rows=800, output_path="data/sample/erp_sales_data.csv"):
    """
    Generates synthetic ERP sales dataset with different column names and 
    date formats (DD/MM/YYYY) to simulate legacy ERP system export messiness.
    """
    os.makedirs(os.path.dirname(output_path), exist_ok=True)

    np.random.seed(101)
    random.seed(101)

    product_codes = [f"PRD-{i:03d}" for i in range(1, 11)]
    customer_ids = [f"CUST-{i:03d}" for i in range(1, 51)]

    start_date = datetime(2025, 1, 1)
    end_date = datetime(2025, 12, 31)
    date_range_days = (end_date - start_date).days

    records = []

    for i in range(num_rows):
        erp_ref = f"ERP-ORDER-{90000 + i + 1}"
        
        # Legacy Date format: DD/MM/YYYY
        random_days = random.randint(0, date_range_days)
        trans_dt = (start_date + timedelta(days=random_days)).strftime("%d/%m/%Y")

        prod_code = random.choice(product_codes)
        cust_id = random.choice(customer_ids)
        qty = random.randint(1, 20)
        unit_val = round(random.uniform(50.0, 1500.0), 2)
        gross_val = round(qty * unit_val, 2)
        disc_pct = f"{random.choice([0, 5, 10, 15, 25])}%"

        records.append({
            "ERP_ORDER_REF": erp_ref,
            "TRANS_DT": trans_dt,
            "PROD_CODE": prod_code,
            "CUST_ID": cust_id,
            "QUANTITY_SOLD": qty,
            "UNIT_VAL": unit_val,
            "GROSS_VAL": gross_val,
            "DISC_PCT": disc_pct,
            "SYSTEM_FLAG": "ERP_SAP_V2"
        })

    df = pd.DataFrame(records)
    df.to_csv(output_path, index=False)
    print(f"Successfully generated {len(df)} messy ERP records in '{output_path}'.")
    return df

if __name__ == "__main__":
    generate_mock_erp_data()
