import os
import random
import pandas as pd
import numpy as np
from datetime import datetime, timedelta

def generate_sales_data(num_rows=2000, output_path="data/sample/sales_data.csv"):
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    
    np.random.seed(42)
    random.seed(42)

    # 10 Products
    products = [
        {"id": "PRD-001", "name": "Enterprise Laptop X1", "category": "Electronics", "subcategory": "Computers", "price": 1200.00},
        {"id": "PRD-002", "name": "Pro Wireless Headset", "category": "Electronics", "subcategory": "Audio", "price": 150.00},
        {"id": "PRD-003", "name": "Smart Monitor 27-inch", "category": "Electronics", "subcategory": "Monitors", "price": 350.00},
        {"id": "PRD-004", "name": "Ergonomic Desk Chair", "category": "Furniture", "subcategory": "Office Chairs", "price": 280.00},
        {"id": "PRD-005", "name": "Standing Desk Converter", "category": "Furniture", "subcategory": "Desks", "price": 220.00},
        {"id": "PRD-006", "name": "Mechanical Keyboard RGB", "category": "Electronics", "subcategory": "Accessories", "price": 110.00},
        {"id": "PRD-007", "name": "Ultra HD Webcam 4K", "category": "Electronics", "subcategory": "Cameras", "price": 130.00},
        {"id": "PRD-008", "name": "Noise Cancelling Earbuds", "category": "Electronics", "subcategory": "Audio", "price": 180.00},
        {"id": "PRD-009", "name": "Filing Cabinet 3-Drawer", "category": "Furniture", "subcategory": "Storage", "price": 160.00},
        {"id": "PRD-010", "name": "LED Desk Lamp with Wireless Charger", "category": "Furniture", "subcategory": "Lighting", "price": 65.00},
    ]

    # 5 Regions
    regions = ["North", "South", "East", "West", "Central"]
    segments = ["Corporate", "Consumer", "Home Office", "Small Business"]

    # Generate 50 Customers
    customers = [
        {"id": f"CUST-{i:03d}", "name": f"Customer_{i}", "region": random.choice(regions), "segment": random.choice(segments)}
        for i in range(1, 51)
    ]

    start_date = datetime(2025, 1, 1)
    end_date = datetime(2025, 12, 31)
    date_range_days = (end_date - start_date).days

    records = []
    
    # 1.5% anomalies -> 30 anomaly indices out of 2000
    anomaly_indices = set(random.sample(range(num_rows), int(num_rows * 0.015)))

    for i in range(num_rows):
        tx_id = f"TXN-{20250000 + i + 1}"
        
        # Seasonality: higher probability for Q4 (Oct-Dec)
        day_offset = int(np.random.beta(2, 1.5) * date_range_days)
        sale_date = start_date + timedelta(days=day_offset)

        prod = random.choice(products)
        cust = random.choice(customers)

        # Base Quantity (1-10) with Poisson distribution
        quantity = max(1, int(np.random.poisson(lam=3)))
        discount = round(random.choice([0.0, 0.05, 0.10, 0.15, 0.20]), 2)
        unit_price = prod["price"]
        
        # Check anomaly injection
        is_anomaly = i in anomaly_indices
        if is_anomaly:
            anomaly_type = random.choice(["spike", "drop", "extreme_discount"])
            if anomaly_type == "spike":
                quantity = random.randint(150, 400) # Huge sudden quantity spike
            elif anomaly_type == "drop":
                quantity = 0 # Drop anomaly
            elif anomaly_type == "extreme_discount":
                discount = 0.90 # 90% discount anomaly

        total_amount = round(quantity * unit_price * (1.0 - discount), 2)

        records.append({
            "transaction_id": tx_id,
            "sale_date": sale_date.strftime("%Y-%m-%d"),
            "product_id": prod["id"],
            "product_name": prod["name"],
            "category": prod["category"],
            "subcategory": prod["subcategory"],
            "customer_id": cust["id"],
            "customer_name": cust["name"],
            "region": cust["region"],
            "segment": cust["segment"],
            "quantity": quantity,
            "unit_price": unit_price,
            "discount": discount,
            "total_amount": total_amount,
            "is_anomaly": is_anomaly
        })

    df = pd.DataFrame(records)
    df.to_csv(output_path, index=False)
    print(f"Successfully generated {len(df)} sales transactions in '{output_path}' with {len(anomaly_indices)} injected anomalies.")
    return df

if __name__ == "__main__":
    generate_sales_data()
