import requests

def debug_upload():
    url = "http://127.0.0.1:8000/sinapi/test-upload"
    files = {'file': ('test.txt', b'hello world', 'text/plain')}
    try:
        r = requests.post(url, files=files)
        print(f"Status: {r.status_code}")
        print(f"Response: {r.text}")
    except Exception as e:
        print(f"Request failed: {e}")

if __name__ == "__main__":
    debug_upload()
