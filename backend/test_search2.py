import requests
import json

res = requests.get("http://localhost:8001/api/v1/products?search=Dünya")
print("Status:", res.status_code)
