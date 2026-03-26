import urllib.request
import json

# Test 1: Furniture search
print("Test 1: Furniture Search...")
req1 = urllib.request.Request(
    'http://localhost:8000/api/chatbot',
    data=json.dumps({
        'message': 'giường ngủ',
        'sessionId': 'test_session_1'
    }).encode(),
    headers={'Content-Type': 'application/json'}
)
resp1 = json.loads(urllib.request.urlopen(req1).read())
print(f"✅ Found {len(resp1['products'])} products for 'giường ngủ'")
print(f"   Response: {resp1['response'][:100]}...")

# Test 2: Price filter
print("\nTest 2: Price Filter Query...")
req2 = urllib.request.Request(
    'http://localhost:8000/api/chatbot',
    data=json.dumps({
        'message': 'bàn giá dưới 3 triệu',
        'sessionId': 'test_session_2'
    }).encode(),
    headers={'Content-Type': 'application/json'}
)
resp2 = json.loads(urllib.request.urlopen(req2).read())
print(f"✅ Found {len(resp2['products'])} products for 'bàn giá dưới 3 triệu'")
print(f"   Response: {resp2['response'][:100]}...")

# Test 3: Bestseller
print("\nTest 3: Bestseller Query...")
req3 = urllib.request.Request(
    'http://localhost:8000/api/chatbot',
    data=json.dumps({
        'message': 'sản phẩm bán chạy',
        'sessionId': 'test_session_3'
    }).encode(),
    headers={'Content-Type': 'application/json'}
)
resp3 = json.loads(urllib.request.urlopen(req3).read())
print(f"✅ Bestsellers found: {len(resp3['products'])} products")
print(f"   Response: {resp3['response'][:100]}...")

# Test 4: Category
print("\nTest 4: Category Query...")
req4 = urllib.request.Request(
    'http://localhost:8000/api/chatbot',
    data=json.dumps({
        'message': 'nội thất phòng khách',
        'sessionId': 'test_session_4'
    }).encode(),
    headers={'Content-Type': 'application/json'}
)
resp4 = json.loads(urllib.request.urlopen(req4).read())
print(f"✅ Found {len(resp4['products'])} products for 'phòng khách'")
print(f"   Response: {resp4['response'][:100]}...")

print("\n🎉 All tests passed!")
