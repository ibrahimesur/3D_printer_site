import subprocess
import time
import urllib.request
import json

print('Starting uvicorn...')
p = subprocess.Popen(['.\\.venv\\Scripts\\python.exe', '-m', 'uvicorn', 'app.main:app', '--port', '8002'], stdout=subprocess.PIPE, stderr=subprocess.STDOUT)
time.sleep(3)

print('Testing login...')
url = 'http://localhost:8002/api/v1/auth/login'
data = json.dumps({'email': 'ibraim2002@gmail.com', 'password': 'password'}).encode('utf-8')
req = urllib.request.Request(url, data=data, headers={'Content-Type': 'application/json'}, method='POST')

try:
    with urllib.request.urlopen(req) as response:
        print("Status Code:", response.getcode())
        print("Response text:", response.read().decode('utf-8'))
except urllib.error.HTTPError as e:
    print("Status Code:", e.code)
    print("Error body:", e.read().decode('utf-8'))
except Exception as e:
    print("Failed to request:", e)

p.kill()
stdout, _ = p.communicate()
print('--- UVICORN LOGS ---')
print(stdout.decode('utf-8', errors='replace'))
