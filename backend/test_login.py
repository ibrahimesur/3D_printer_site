import urllib.request
import json

url = 'http://localhost:8001/api/v1/auth/login'
data = json.dumps({'email': 'ibraim2002@gmail.com', 'password': 'password'}).encode('utf-8')
req = urllib.request.Request(url, data=data, headers={'Content-Type': 'application/json'}, method='POST')

try:
    with urllib.request.urlopen(req) as response:
        print("Status Code:", response.getcode())
        print("Response text:", response.read().decode('utf-8'))
except urllib.error.HTTPError as e:
    print("Status Code:", e.code)
    print("Error body:", e.read().decode('utf-8'))
