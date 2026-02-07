
import httpx
import sys

print(f"Python Version: {sys.version}")
print(f"Httpx Version: {httpx.__version__}")

try:
    c = httpx.Client(proxy="http://test.com")
    print("SUCCESS: httpx.Client(proxy=...) accepted")
except Exception as e:
    print(f"ERROR: httpx.Client(proxy=...) failed: {e}")

try:
    c = httpx.Client(proxies="http://test.com")
    print("SUCCESS: httpx.Client(proxies=...) accepted")
except Exception as e:
    print(f"ERROR: httpx.Client(proxies=...) failed: {e}")
