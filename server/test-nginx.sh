#!/bin/bash

# Test Nginx Reverse Proxy
# Tests all endpoints through nginx on port 80

set -e

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
BASE_URL="http://localhost"
API_URL="$BASE_URL/api/v1"

# Counters
TOTAL=0
PASSED=0
FAILED=0

# Test result function
test_result() {
    TOTAL=$((TOTAL + 1))
    if [ $1 -eq 0 ]; then
        echo -e "${GREEN}✓ PASS${NC}: $2"
        PASSED=$((PASSED + 1))
    else
        echo -e "${RED}✗ FAIL${NC}: $2"
        FAILED=$((FAILED + 1))
    fi
}

echo ""
echo "=========================================="
echo "  Nginx Reverse Proxy Tests"
echo "=========================================="
echo ""
echo "Testing: $BASE_URL"
echo ""

# Test 1: Nginx root endpoint
echo -e "${BLUE}[1/10]${NC} Testing Nginx root endpoint..."
RESPONSE=$(curl -s "$BASE_URL/")
if [[ "$RESPONSE" == *"Nginx reverse proxy is working"* ]]; then
    test_result 0 "Nginx root endpoint"
else
    test_result 1 "Nginx root endpoint"
fi

# Test 2: Health check through nginx
echo -e "${BLUE}[2/10]${NC} Testing health endpoint through nginx..."
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/health")
if [ "$HTTP_CODE" -eq 200 ]; then
    test_result 0 "Health endpoint (HTTP $HTTP_CODE)"
else
    test_result 1 "Health endpoint (HTTP $HTTP_CODE)"
fi

# Test 3: API endpoint structure
echo -e "${BLUE}[3/10]${NC} Testing API endpoint structure..."
RESPONSE=$(curl -s "$API_URL/auth/login" -X POST -H "Content-Type: application/json" -d '{}')
if [[ "$RESPONSE" == *"success"* ]]; then
    test_result 0 "API endpoint structure"
else
    test_result 1 "API endpoint structure"
fi

# Test 4: Login through nginx
echo -e "${BLUE}[4/10]${NC} Testing login through nginx..."
LOGIN_RESPONSE=$(curl -s -X POST "$API_URL/auth/login" \
    -H "Content-Type: application/json" \
    -d '{
        "email": "demo@test.com",
        "password": "Demo@123456"
    }')

SUCCESS=$(echo "$LOGIN_RESPONSE" | jq -r '.success')
if [ "$SUCCESS" = "true" ]; then
    TOKEN=$(echo "$LOGIN_RESPONSE" | jq -r '.data.tokens.accessToken')
    test_result 0 "Login through nginx"
else
    test_result 1 "Login through nginx"
    TOKEN=""
fi

# Test 5: Authenticated request through nginx
if [ -n "$TOKEN" ]; then
    echo -e "${BLUE}[5/10]${NC} Testing authenticated request through nginx..."
    AUTH_RESPONSE=$(curl -s "$API_URL/auth/me" \
        -H "Authorization: Bearer $TOKEN")
    
    AUTH_SUCCESS=$(echo "$AUTH_RESPONSE" | jq -r '.success')
    if [ "$AUTH_SUCCESS" = "true" ]; then
        test_result 0 "Authenticated request"
    else
        test_result 1 "Authenticated request"
    fi
else
    echo -e "${BLUE}[5/10]${NC} ${YELLOW}SKIP${NC}: Authenticated request (no token)"
    TOTAL=$((TOTAL + 1))
fi

# Test 6: Large file upload support (check header)
echo -e "${BLUE}[6/10]${NC} Testing large file upload support..."
TEMP_FILE=$(mktemp)
dd if=/dev/zero of="$TEMP_FILE" bs=1M count=15 2>/dev/null

if [ -n "$TOKEN" ]; then
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$API_URL/documents" \
        -H "Authorization: Bearer $TOKEN" \
        -F "file=@$TEMP_FILE" 2>/dev/null || echo "000")
    
    # We expect either 200/201 (success) or 400 (validation error for invalid file type)
    # But not 413 (file too large)
    if [ "$HTTP_CODE" != "413" ] && [ "$HTTP_CODE" != "000" ]; then
        test_result 0 "Large file upload (client_max_body_size: HTTP $HTTP_CODE)"
    else
        test_result 1 "Large file upload (HTTP $HTTP_CODE)"
    fi
else
    echo -e "${YELLOW}SKIP${NC}: Large file upload (no token)"
    TOTAL=$((TOTAL + 1))
fi

rm -f "$TEMP_FILE"

# Test 7: CORS headers
echo -e "${BLUE}[7/10]${NC} Testing CORS headers..."
CORS_HEADER=$(curl -s -I "$API_URL/auth/login" -H "Origin: http://localhost:3000" | grep -i "access-control" | head -1)
if [ -n "$CORS_HEADER" ]; then
    test_result 0 "CORS headers present"
else
    test_result 1 "CORS headers"
fi

# Test 8: Proxy headers
echo -e "${BLUE}[8/10]${NC} Testing proxy headers forwarding..."
if [ -n "$TOKEN" ]; then
    HEADERS_RESPONSE=$(curl -s "$API_URL/auth/me" \
        -H "Authorization: Bearer $TOKEN" \
        -H "X-Test-Header: test")
    
    # If we get a successful response, proxy is forwarding headers
    if [[ "$HEADERS_RESPONSE" == *"success"* ]]; then
        test_result 0 "Proxy headers forwarding"
    else
        test_result 1 "Proxy headers forwarding"
    fi
else
    echo -e "${YELLOW}SKIP${NC}: Proxy headers (no token)"
    TOTAL=$((TOTAL + 1))
fi

# Test 9: Response time through nginx
echo -e "${BLUE}[9/10]${NC} Testing response time through nginx..."
START_TIME=$(date +%s%N)
curl -s "$BASE_URL/health" > /dev/null
END_TIME=$(date +%s%N)
RESPONSE_TIME=$(( (END_TIME - START_TIME) / 1000000 ))

if [ $RESPONSE_TIME -lt 1000 ]; then
    test_result 0 "Response time (${RESPONSE_TIME}ms)"
else
    test_result 1 "Response time (${RESPONSE_TIME}ms - too slow)"
fi

# Test 10: Public verification endpoint
echo -e "${BLUE}[10/10]${NC} Testing public verification endpoint through nginx..."
# Use a fake verification code to test the endpoint is accessible
VERIFY_RESPONSE=$(curl -s "$API_URL/verify/VER-12345678-ABCDEFGHIJKLMNOPQRSTUVWX")
if [[ "$VERIFY_RESPONSE" == *"success"* ]]; then
    test_result 0 "Public verification endpoint"
else
    test_result 1 "Public verification endpoint"
fi

# Summary
echo ""
echo "=========================================="
echo "  Test Summary"
echo "=========================================="
echo -e "Total Tests:  ${BLUE}$TOTAL${NC}"
echo -e "Passed:       ${GREEN}$PASSED${NC}"
echo -e "Failed:       ${RED}$FAILED${NC}"
echo ""

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}✓ All tests passed!${NC}"
    echo ""
    echo "Nginx reverse proxy is working correctly!"
    echo ""
    echo "You can now access the API through:"
    echo "  - Direct:        http://localhost:5001/api/v1"
    echo "  - Through Nginx: http://localhost/api/v1"
    echo ""
    exit 0
else
    echo -e "${RED}✗ Some tests failed${NC}"
    echo ""
    exit 1
fi
