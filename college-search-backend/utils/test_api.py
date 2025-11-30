"""
Simple test script to verify API endpoints are working
"""
import requests
import json

BASE_URL = 'http://localhost:5000'

def print_response(title, response):
    """Pretty print API response"""
    print(f"\n{'='*60}")
    print(f"🧪 {title}")
    print(f"{'='*60}")
    print(f"Status Code: {response.status_code}")
    
    try:
        data = response.json()
        print(f"Response: {json.dumps(data, indent=2)[:500]}...")  # First 500 chars
    except:
        print(f"Response: {response.text[:500]}")
    print(f"{'='*60}\n")


def test_health_check():
    """Test health check endpoint"""
    response = requests.get(f'{BASE_URL}/')
    print_response("Health Check", response)
    return response.status_code == 200


def test_api_health():
    """Test detailed API health"""
    response = requests.get(f'{BASE_URL}/api/health')
    print_response("API Health", response)
    return response.status_code == 200


def test_api_docs():
    """Test API documentation"""
    response = requests.get(f'{BASE_URL}/api/docs')
    print_response("API Documentation", response)
    return response.status_code == 200


def test_filter_schools():
    """Test filtering schools"""
    params = {
        'state': 'CA',
        'cost_max': 40000,
        'limit': 5
    }
    response = requests.get(f'{BASE_URL}/api/schools/filter', params=params)
    print_response("Filter Schools (CA, cost<40k)", response)
    return response.status_code == 200


def test_search_schools():
    """Test school search"""
    params = {'q': 'Stanford', 'limit': 5}
    response = requests.get(f'{BASE_URL}/api/schools/search', params=params)
    print_response("Search Schools (Stanford)", response)
    return response.status_code == 200


def test_get_states():
    """Test getting states list"""
    response = requests.get(f'{BASE_URL}/api/schools/states')
    print_response("Get States List", response)
    return response.status_code == 200


def test_get_majors():
    """Test getting available majors"""
    response = requests.get(f'{BASE_URL}/api/programs/majors')
    print_response("Get Available Majors", response)
    return response.status_code == 200


def test_state_aggregations():
    """Test state aggregations"""
    response = requests.get(f'{BASE_URL}/api/aggregations/state?state=CA')
    print_response("State Aggregations (CA)", response)
    return response.status_code == 200


def test_roi():
    """Test ROI aggregation"""
    params = {'state': 'CA', 'year': 2020}
    response = requests.get(f'{BASE_URL}/api/aggregations/roi', params=params)
    print_response("ROI Aggregation (CA, 2020)", response)
    return response.status_code == 200


def run_all_tests():
    """Run all test functions"""
    tests = [
        ("Health Check", test_health_check),
        ("API Health", test_api_health),
        ("API Docs", test_api_docs),
        ("Filter Schools", test_filter_schools),
        ("Search Schools", test_search_schools),
        ("Get States", test_get_states),
        ("Get Majors", test_get_majors),
        ("State Aggregations", test_state_aggregations),
        ("ROI Aggregation", test_roi),
    ]
    
    print("\n" + "="*60)
    print("🚀 Starting API Tests")
    print("="*60)
    
    results = []
    for name, test_func in tests:
        try:
            passed = test_func()
            results.append((name, passed))
        except Exception as e:
            print(f"❌ {name} failed with error: {e}")
            results.append((name, False))
    
    # Print summary
    print("\n" + "="*60)
    print("📊 Test Summary")
    print("="*60)
    
    passed_count = sum(1 for _, passed in results if passed)
    total_count = len(results)
    
    for name, passed in results:
        status = "✅ PASS" if passed else "❌ FAIL"
        print(f"{status} - {name}")
    
    print(f"\n{passed_count}/{total_count} tests passed")
    print("="*60 + "\n")
    
    return passed_count == total_count


if __name__ == '__main__':
    print("\n⚠️  Make sure the API server is running on http://localhost:5000")
    print("Run: python app.py\n")
    
    input("Press Enter to start tests...")
    
    success = run_all_tests()
    
    if success:
        print("✅ All tests passed!")
    else:
        print("❌ Some tests failed. Check the output above.")
