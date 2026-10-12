"""
Test script for the FastAPI upload endpoint
"""
import requests

url = "http://127.0.0.1:8000/ingest/upload"
file_path = "data/sample/test_upload.csv"

with open(file_path, 'rb') as f:
    files = {'file': ('test_upload.csv', f, 'text/csv')}
    response = requests.post(url, files=files, timeout=30)

print(f"Status Code: {response.status_code}")
print(f"Response: {response.json()}")
