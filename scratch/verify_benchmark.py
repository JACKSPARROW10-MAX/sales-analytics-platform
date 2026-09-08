import requests
import json
import sys
from pathlib import Path

# Add project root to path and set utf-8 encoding
sys.stdout.reconfigure(encoding='utf-8')
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from etl.load_staging import get_db_connection
from sqlalchemy import text

engine = get_db_connection()

# Clean slate for clean isolated test
with engine.begin() as conn:
    conn.execute(text('TRUNCATE fact_sales, staging_sales, staging_products, staging_customers CASCADE;'))
print('Cleaned fact_sales and staging tables for isolated benchmark.')

# 1. Upload Dataset A
print('\n=== UPLOADING DATASET A (ENTERPRISE TECH) ===')
with open('scratch/dataset_a_enterprise_tech.csv', 'rb') as f:
    r_a = requests.post(
        'http://127.0.0.1:8000/api/v1/ingest/upload', 
        files={'file': ('dataset_a_enterprise_tech.csv', f, 'text/csv')}
    )
print('Upload A Status:', r_a.status_code, r_a.json())

# Query Live APIs for Dataset A
kpis_a = requests.get('http://127.0.0.1:8000/api/v1/kpis').json()
prods_a = requests.get('http://127.0.0.1:8000/api/v1/analytics/products').json()
cats_a = requests.get('http://127.0.0.1:8000/api/v1/analytics/categories').json()
regs_a = requests.get('http://127.0.0.1:8000/api/v1/analytics/regions').json()
anoms_a = requests.get('http://127.0.0.1:8000/api/v1/anomalies').json()
recs_a = requests.get('http://127.0.0.1:8000/api/v1/recommendations').json()
pdf_a = requests.get('http://127.0.0.1:8000/api/v1/reports/download')

print('\n--- RESULTS FOR DATASET A ---')
print('Revenue A:', kpis_a['totalRevenue']['formatted'])
print('Orders A:', kpis_a['total_orders'])
print('Top Product A:', prods_a[0]['product_name'], f"₹{prods_a[0]['total_revenue']:,.0f}")
print('Top Category A:', cats_a[0]['category'], f"₹{cats_a[0]['total_revenue']:,.0f}")
print('Top Region A:', regs_a[0]['region'])
print('Anomalies Count A:', len(anoms_a), 'First Anomaly ID:', anoms_a[0]['id'] if anoms_a else 'None')
print('Top Recommendation A:', recs_a[0]['title'] if recs_a else 'None')
print('PDF Size A:', len(pdf_a.content), 'bytes')

# 2. Upload Dataset B
print('\n=== UPLOADING DATASET B (RETAIL FMCG) ===')
with engine.begin() as conn:
    conn.execute(text('TRUNCATE fact_sales, staging_sales, staging_products, staging_customers CASCADE;'))

with open('scratch/dataset_b_retail_fmcg.csv', 'rb') as f:
    r_b = requests.post(
        'http://127.0.0.1:8000/api/v1/ingest/upload', 
        files={'file': ('dataset_b_retail_fmcg.csv', f, 'text/csv')}
    )
print('Upload B Status:', r_b.status_code, r_b.json())

# Query Live APIs for Dataset B
kpis_b = requests.get('http://127.0.0.1:8000/api/v1/kpis').json()
prods_b = requests.get('http://127.0.0.1:8000/api/v1/analytics/products').json()
cats_b = requests.get('http://127.0.0.1:8000/api/v1/analytics/categories').json()
regs_b = requests.get('http://127.0.0.1:8000/api/v1/analytics/regions').json()
anoms_b = requests.get('http://127.0.0.1:8000/api/v1/anomalies').json()
recs_b = requests.get('http://127.0.0.1:8000/api/v1/recommendations').json()
pdf_b = requests.get('http://127.0.0.1:8000/api/v1/reports/download')

print('\n--- RESULTS FOR DATASET B ---')
print('Revenue B:', kpis_b['totalRevenue']['formatted'])
print('Orders B:', kpis_b['total_orders'])
print('Top Product B:', prods_b[0]['product_name'], f"₹{prods_b[0]['total_revenue']:,.0f}")
print('Top Category B:', cats_b[0]['category'], f"₹{cats_b[0]['total_revenue']:,.0f}")
print('Top Region B:', regs_b[0]['region'])
print('Anomalies Count B:', len(anoms_b), 'First Anomaly ID:', anoms_b[0]['id'] if anoms_b else 'None')
print('Top Recommendation B:', recs_b[0]['title'] if recs_b else 'None')
print('PDF Size B:', len(pdf_b.content), 'bytes')

# 3. Dynamic Assertions
print('\n=== VERIFYING DYNAMIC ATTRIBUTES ===')
assert kpis_a['totalRevenue']['value'] != kpis_b['totalRevenue']['value'], 'Revenue did not change!'
print('✓ KPI Revenue changed dynamically:', kpis_a['totalRevenue']['formatted'], '->', kpis_b['totalRevenue']['formatted'])

assert prods_a[0]['product_name'] != prods_b[0]['product_name'], 'Top product did not change!'
print('✓ Top Product changed dynamically:', prods_a[0]['product_name'], '->', prods_b[0]['product_name'])

assert cats_a[0]['category'] != cats_b[0]['category'], 'Top category did not change!'
print('✓ Top Category changed dynamically:', cats_a[0]['category'], '->', cats_b[0]['category'])

assert regs_a[0]['region'] != regs_b[0]['region'], 'Top region did not change!'
print('✓ Top Region changed dynamically:', regs_a[0]['region'], '->', regs_b[0]['region'])

assert recs_a[0]['title'] != recs_b[0]['title'], 'Recommendations did not change!'
print('✓ AI Recommendations changed dynamically:\n   A:', recs_a[0]['title'], '\n   B:', recs_b[0]['title'])

assert anoms_a[0]['id'] != anoms_b[0]['id'], 'Anomaly IDs did not change!'
print('✓ Anomaly IDs changed dynamically:', anoms_a[0]['id'], '->', anoms_b[0]['id'])

print('\n>>> ALL ACCEPTANCE TESTS PASSED WITH 100% SUCCESS! <<<')
