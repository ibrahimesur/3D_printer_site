import requests

# Test search endpoint
res = requests.get("http://localhost:8001/api/v1/products?search=Dünya")
print("Status:", res.status_code)
try:
    products = res.json()
    print("Found products:", len(products))
    for p in products:
        print("-", p.get("title"))
except Exception as e:
    print("Error parsing json", e)
