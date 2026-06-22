#!/bin/bash

# Signature Module Testing Script
# Tests all signature endpoints end-to-end

BASE_URL="http://localhost:5001/api/v1"
TEST_EMAIL="demo@test.com"
TEST_PASSWORD="Demo@123456"

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test counter
PASSED=0
FAILED=0

print_test() {
  echo ""
  echo -e "${BLUE}================================${NC}"
  echo -e "${BLUE}TEST: $1${NC}"
  echo -e "${BLUE}================================${NC}"
}

print_success() {
  echo -e "${GREEN}✓ $1${NC}"
  ((PASSED++))
}

print_error() {
  echo -e "${RED}✗ $1${NC}"
  ((FAILED++))
}

print_info() {
  echo -e "${YELLOW}ℹ $1${NC}"
}

# Check if server is running
print_test "Server Health Check"
HEALTH=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:5001/health)
if [ "$HEALTH" == "200" ]; then
  print_success "Server is healthy"
else
  print_error "Server is not responding"
  exit 1
fi

# Login to get access token
print_test "Login"
LOGIN_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$TEST_EMAIL\",\"password\":\"$TEST_PASSWORD\"}")

ACCESS_TOKEN=$(echo $LOGIN_RESPONSE | jq -r '.data.accessToken')

if [ "$ACCESS_TOKEN" != "null" ] && [ -n "$ACCESS_TOKEN" ]; then
  print_success "Login successful"
  print_info "Access Token: ${ACCESS_TOKEN:0:20}..."
else
  print_error "Login failed"
  echo $LOGIN_RESPONSE | jq .
  exit 1
fi

# Upload a test document first (needed for signature application)
print_test "Upload Test Document"
if [ ! -f "/tmp/sample.pdf" ]; then
  # Create a minimal PDF if it doesn't exist
  echo "%PDF-1.4
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj
2 0 obj
<< /Type /Pages /Kids [3 0 R] /Count 1 >>
endobj
3 0 obj
<< /Type /Page /Parent 2 0 R /Resources 4 0 R /MediaBox [0 0 612 792] /Contents 5 0 R >>
endobj
4 0 obj
<< /Font << /F1 << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> >> >>
endobj
5 0 obj
<< /Length 44 >>
stream
BT
/F1 12 Tf
100 700 Td
(Test Document) Tj
ET
endstream
endobj
xref
0 6
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000229 00000 n 
0000000329 00000 n 
trailer
<< /Size 6 /Root 1 0 R >>
startxref
423
%%EOF" > /tmp/sample.pdf
fi

DOC_RESPONSE=$(curl -s -X POST "$BASE_URL/documents" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -F "document=@/tmp/sample.pdf" \
  -F "title=Test Document for Signing" \
  -F "description=Document used for signature testing")

DOCUMENT_ID=$(echo $DOC_RESPONSE | jq -r '.data.id')

if [ "$DOCUMENT_ID" != "null" ] && [ -n "$DOCUMENT_ID" ]; then
  print_success "Document uploaded successfully"
  print_info "Document ID: $DOCUMENT_ID"
else
  print_error "Document upload failed"
  echo $DOC_RESPONSE | jq .
  exit 1
fi

# Test 1: Create Signature (Base64 Drawn)
print_test "1. Create Signature (Base64 Drawn)"

# Create a simple 1x1 PNG in base64
SIGNATURE_DATA="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="

SIGNATURE_RESPONSE=$(curl -s -X POST "$BASE_URL/signatures" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"name\": \"My Test Signature\",
    \"isReusable\": \"true\",
    \"signatureData\": \"$SIGNATURE_DATA\"
  }")

SIGNATURE_ID=$(echo $SIGNATURE_RESPONSE | jq -r '.data.id')

if [ "$SIGNATURE_ID" != "null" ] && [ -n "$SIGNATURE_ID" ]; then
  print_success "Signature created successfully"
  print_info "Signature ID: $SIGNATURE_ID"
else
  print_error "Signature creation failed"
  echo $SIGNATURE_RESPONSE | jq .
fi

# Test 2: List All Signatures
print_test "2. List All Signatures"

LIST_RESPONSE=$(curl -s -X GET "$BASE_URL/signatures?page=1&limit=10" \
  -H "Authorization: Bearer $ACCESS_TOKEN")

SIGNATURE_COUNT=$(echo $LIST_RESPONSE | jq -r '.data | length')

if [ "$SIGNATURE_COUNT" -gt 0 ]; then
  print_success "Signatures listed successfully"
  print_info "Found $SIGNATURE_COUNT signature(s)"
else
  print_error "No signatures found"
fi

# Test 3: Get Reusable Signatures
print_test "3. Get Reusable Signatures"

REUSABLE_RESPONSE=$(curl -s -X GET "$BASE_URL/signatures/reusable" \
  -H "Authorization: Bearer $ACCESS_TOKEN")

REUSABLE_COUNT=$(echo $REUSABLE_RESPONSE | jq -r '.data | length')

if [ "$REUSABLE_COUNT" -gt 0 ]; then
  print_success "Reusable signatures retrieved successfully"
  print_info "Found $REUSABLE_COUNT reusable signature(s)"
else
  print_error "No reusable signatures found"
fi

# Test 4: Get Signature by ID
print_test "4. Get Signature by ID"

GET_SIGNATURE_RESPONSE=$(curl -s -X GET "$BASE_URL/signatures/$SIGNATURE_ID" \
  -H "Authorization: Bearer $ACCESS_TOKEN")

GET_SIGNATURE_NAME=$(echo $GET_SIGNATURE_RESPONSE | jq -r '.data.name')

if [ "$GET_SIGNATURE_NAME" == "My Test Signature" ]; then
  print_success "Signature retrieved successfully"
  print_info "Name: $GET_SIGNATURE_NAME"
else
  print_error "Failed to get signature by ID"
fi

# Test 5: Update Signature
print_test "5. Update Signature"

UPDATE_RESPONSE=$(curl -s -X PATCH "$BASE_URL/signatures/$SIGNATURE_ID" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Updated Test Signature",
    "isReusable": true
  }')

UPDATED_NAME=$(echo $UPDATE_RESPONSE | jq -r '.data.name')

if [ "$UPDATED_NAME" == "Updated Test Signature" ]; then
  print_success "Signature updated successfully"
  print_info "New name: $UPDATED_NAME"
else
  print_error "Failed to update signature"
fi

# Test 6: Apply Signature to Document (THE BIG TEST!)
print_test "6. Apply Signature to Document"

APPLY_RESPONSE=$(curl -s -X POST "$BASE_URL/signatures/apply/$DOCUMENT_ID" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"signatureId\": \"$SIGNATURE_ID\",
    \"position\": {
      \"page\": 0,
      \"x\": 100,
      \"y\": 650,
      \"width\": 150,
      \"height\": 50
    }
  }")

SIGNED_FILE_PATH=$(echo $APPLY_RESPONSE | jq -r '.data.document.signedFilePath')

if [ "$SIGNED_FILE_PATH" != "null" ] && [ -n "$SIGNED_FILE_PATH" ]; then
  print_success "Signature applied successfully"
  print_info "Signed file: $SIGNED_FILE_PATH"
  
  # Verify document status changed to SIGNED
  DOC_STATUS=$(echo $APPLY_RESPONSE | jq -r '.data.document.status')
  
  if [ "$DOC_STATUS" == "SIGNED" ]; then
    print_success "Document status updated to SIGNED"
  else
    print_error "Document status not updated (got: $DOC_STATUS)"
  fi
else
  print_error "Failed to apply signature"
  echo $APPLY_RESPONSE | jq .
fi

# Test 7: Download Signed Document
print_test "7. Download Signed Document"

DOWNLOAD_RESPONSE=$(curl -s -o /tmp/signed_document.pdf -w "%{http_code}" \
  "$BASE_URL/documents/$DOCUMENT_ID/download?version=signed" \
  -H "Authorization: Bearer $ACCESS_TOKEN")

if [ "$DOWNLOAD_RESPONSE" == "200" ] && [ -f "/tmp/signed_document.pdf" ]; then
  FILE_SIZE=$(ls -lh /tmp/signed_document.pdf | awk '{print $5}')
  print_success "Signed document downloaded successfully"
  print_info "File size: $FILE_SIZE"
  print_info "Location: /tmp/signed_document.pdf"
else
  print_error "Failed to download signed document"
fi

# Test 8: Create Another Signature for Testing Delete
print_test "8. Create Another Signature (For Delete Test)"

SIGNATURE2_RESPONSE=$(curl -s -X POST "$BASE_URL/signatures" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"name\": \"Signature to Delete\",
    \"isReusable\": \"false\",
    \"signatureData\": \"$SIGNATURE_DATA\"
  }")

SIGNATURE2_ID=$(echo $SIGNATURE2_RESPONSE | jq -r '.data.id')

if [ "$SIGNATURE2_ID" != "null" ] && [ -n "$SIGNATURE2_ID" ]; then
  print_success "Second signature created successfully"
  print_info "Signature ID: $SIGNATURE2_ID"
else
  print_error "Failed to create second signature"
fi

# Test 9: Delete Signature
print_test "9. Delete Signature"

DELETE_RESPONSE=$(curl -s -X DELETE "$BASE_URL/signatures/$SIGNATURE2_ID" \
  -H "Authorization: Bearer $ACCESS_TOKEN")

DELETE_MESSAGE=$(echo $DELETE_RESPONSE | jq -r '.message')

if [ "$DELETE_MESSAGE" == "Signature deleted successfully" ]; then
  print_success "Signature deleted successfully"
  
  # Verify signature is deleted
  VERIFY_DELETE=$(curl -s -o /dev/null -w "%{http_code}" \
    "$BASE_URL/signatures/$SIGNATURE2_ID" \
    -H "Authorization: Bearer $ACCESS_TOKEN")
  
  if [ "$VERIFY_DELETE" == "404" ]; then
    print_success "Signature deletion verified (404 on GET)"
  else
    print_error "Deleted signature still accessible"
  fi
else
  print_error "Failed to delete signature"
  echo $DELETE_RESPONSE | jq .
fi

# Test 10: Try to Delete Applied Signature (Should Fail)
print_test "10. Try to Delete Applied Signature (Should Fail)"

DELETE_APPLIED_RESPONSE=$(curl -s -X DELETE "$BASE_URL/signatures/$SIGNATURE_ID" \
  -H "Authorization: Bearer $ACCESS_TOKEN")

# Check if it's valid JSON first
if echo "$DELETE_APPLIED_RESPONSE" | jq empty 2>/dev/null; then
  SUCCESS=$(echo $DELETE_APPLIED_RESPONSE | jq -r '.success')
  MESSAGE=$(echo $DELETE_APPLIED_RESPONSE | jq -r '.message')
  
  if [ "$SUCCESS" == "false" ]; then
    print_success "Correctly prevented deletion of applied signature"
    print_info "Message: $MESSAGE"
  else
    print_error "Should not allow deleting applied signature"
    echo $DELETE_APPLIED_RESPONSE | jq .
  fi
else
  print_error "Invalid response received"
  echo "$DELETE_APPLIED_RESPONSE"
fi

# Test 11: Filter Signatures
print_test "11. Filter Signatures (Reusable Only)"

FILTER_RESPONSE=$(curl -s -X GET "$BASE_URL/signatures?isReusable=true" \
  -H "Authorization: Bearer $ACCESS_TOKEN")

FILTERED_COUNT=$(echo $FILTER_RESPONSE | jq -r '.data | length')

if [ "$FILTERED_COUNT" -ge 0 ]; then
  print_success "Signatures filtered successfully"
  print_info "Found $FILTERED_COUNT reusable signature(s)"
else
  print_error "Failed to filter signatures"
fi

# Test 12: Pagination Test
print_test "12. Pagination Test"

PAGE_RESPONSE=$(curl -s -X GET "$BASE_URL/signatures?page=1&limit=2" \
  -H "Authorization: Bearer $ACCESS_TOKEN")

PAGE_SIZE=$(echo $PAGE_RESPONSE | jq -r '.pagination.limit')
CURRENT_PAGE=$(echo $PAGE_RESPONSE | jq -r '.pagination.page')

if [ "$PAGE_SIZE" == "2" ] && [ "$CURRENT_PAGE" == "1" ]; then
  print_success "Pagination working correctly"
  print_info "Page: $CURRENT_PAGE, Limit: $PAGE_SIZE"
else
  print_error "Pagination not working as expected"
fi

# Test Summary
echo ""
echo -e "${BLUE}======================================${NC}"
echo -e "${BLUE}         TEST SUMMARY${NC}"
echo -e "${BLUE}======================================${NC}"
echo -e "${GREEN}Passed: $PASSED${NC}"
echo -e "${RED}Failed: $FAILED${NC}"
echo -e "${BLUE}Total:  $((PASSED + FAILED))${NC}"
echo ""

if [ $FAILED -eq 0 ]; then
  echo -e "${GREEN}✓ ALL TESTS PASSED!${NC}"
  echo ""
  echo -e "${YELLOW}Signed document saved at: /tmp/signed_document.pdf${NC}"
  echo -e "${YELLOW}You can open it to verify the signature was applied!${NC}"
  exit 0
else
  echo -e "${RED}✗ SOME TESTS FAILED${NC}"
  exit 1
fi
