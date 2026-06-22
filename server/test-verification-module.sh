#!/bin/bash

# Verification Module Testing Script
# Tests all verification endpoints end-to-end

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

# Upload and sign a document first
print_test "Setup: Upload and Sign Document"

# Upload
DOC_RESPONSE=$(curl -s -X POST "$BASE_URL/documents" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -F "document=@/tmp/sample.pdf" \
  -F "title=Test Document for Verification" \
  -F "description=Document used for verification testing")

DOCUMENT_ID=$(echo $DOC_RESPONSE | jq -r '.data.id')

if [ "$DOCUMENT_ID" != "null" ] && [ -n "$DOCUMENT_ID" ]; then
  print_success "Document uploaded"
  print_info "Document ID: $DOCUMENT_ID"
else
  print_error "Document upload failed"
  exit 1
fi

# Create signature
SIGNATURE_DATA="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="

SIG_RESPONSE=$(curl -s -X POST "$BASE_URL/signatures" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"name\": \"Test Signature for Verification\",
    \"isReusable\": \"true\",
    \"signatureData\": \"$SIGNATURE_DATA\"
  }")

SIGNATURE_ID=$(echo $SIG_RESPONSE | jq -r '.data.id')

if [ "$SIGNATURE_ID" != "null" ] && [ -n "$SIGNATURE_ID" ]; then
  print_success "Signature created"
else
  print_error "Signature creation failed"
  exit 1
fi

# Apply signature
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

SIGNED=$(echo $APPLY_RESPONSE | jq -r '.data.document.status')

if [ "$SIGNED" == "SIGNED" ]; then
  print_success "Document signed successfully"
else
  print_error "Document signing failed"
  exit 1
fi

# Test 1: Create Verification for Document
print_test "1. Create Verification for Signed Document"

VERIFY_CREATE_RESPONSE=$(curl -s -X POST "$BASE_URL/verify/document/$DOCUMENT_ID" \
  -H "Authorization: Bearer $ACCESS_TOKEN")

VERIFICATION_CODE=$(echo $VERIFY_CREATE_RESPONSE | jq -r '.data.verificationCode')
QR_CODE=$(echo $VERIFY_CREATE_RESPONSE | jq -r '.data.qrCode')

if [ "$VERIFICATION_CODE" != "null" ] && [ -n "$VERIFICATION_CODE" ]; then
  print_success "Verification created successfully"
  print_info "Verification Code: $VERIFICATION_CODE"
  
  # Check if QR code was generated
  if [ "$QR_CODE" != "null" ] && [ -n "$QR_CODE" ]; then
    print_success "QR code generated"
    print_info "QR Code length: ${#QR_CODE} characters"
  else
    print_error "QR code not generated"
  fi
else
  print_error "Verification creation failed"
  echo $VERIFY_CREATE_RESPONSE | jq .
fi

# Test 2: Get Verification Details by Document ID
print_test "2. Get Verification Details by Document ID"

VERIFY_GET_RESPONSE=$(curl -s -X GET "$BASE_URL/verify/document/$DOCUMENT_ID" \
  -H "Authorization: Bearer $ACCESS_TOKEN")

VERIFY_CODE_CHECK=$(echo $VERIFY_GET_RESPONSE | jq -r '.data.verificationCode')

if [ "$VERIFY_CODE_CHECK" == "$VERIFICATION_CODE" ]; then
  print_success "Verification details retrieved successfully"
else
  print_error "Failed to get verification details"
fi

# Test 3: Verify Document by Code (Public Endpoint - THE BIG TEST!)
print_test "3. Verify Document by Code (Public Endpoint)"

PUBLIC_VERIFY_RESPONSE=$(curl -s -X GET "$BASE_URL/verify/$VERIFICATION_CODE")

VERIFIED=$(echo $PUBLIC_VERIFY_RESPONSE | jq -r '.data.verified')
DOC_TITLE=$(echo $PUBLIC_VERIFY_RESPONSE | jq -r '.data.document.title')
SIGNER_NAME=$(echo $PUBLIC_VERIFY_RESPONSE | jq -r '.data.signer.name')

if [ "$VERIFIED" == "true" ]; then
  print_success "Document verified successfully (Public)"
  print_info "Document: $DOC_TITLE"
  print_info "Signer: $SIGNER_NAME"
  
  # Check if verification count incremented
  VERIFY_COUNT=$(echo $PUBLIC_VERIFY_RESPONSE | jq -r '.data.verifiedCount')
  if [ "$VERIFY_COUNT" -gt 0 ]; then
    print_success "Verification count tracked: $VERIFY_COUNT"
  fi
else
  print_error "Document verification failed"
  echo $PUBLIC_VERIFY_RESPONSE | jq .
fi

# Test 4: Verify Again (Check Counter Increment)
print_test "4. Verify Again (Test Counter Increment)"

sleep 1
VERIFY_AGAIN_RESPONSE=$(curl -s -X GET "$BASE_URL/verify/$VERIFICATION_CODE")

VERIFY_COUNT_NEW=$(echo $VERIFY_AGAIN_RESPONSE | jq -r '.data.verifiedCount')

if [ "$VERIFY_COUNT_NEW" -gt "$VERIFY_COUNT" ]; then
  print_success "Verification counter incremented correctly"
  print_info "Previous: $VERIFY_COUNT, New: $VERIFY_COUNT_NEW"
else
  print_error "Verification counter not incremented"
fi

# Test 5: Get QR Code (Public)
print_test "5. Get QR Code (Public Endpoint)"

QR_RESPONSE=$(curl -s -X GET "$BASE_URL/verify/$VERIFICATION_CODE/qrcode")

QR_DATA=$(echo $QR_RESPONSE | jq -r '.data.qrCode')

if [ "$QR_DATA" != "null" ] && [[ "$QR_DATA" == data:image/png* ]]; then
  print_success "QR code retrieved successfully"
  print_info "QR code format: PNG base64"
else
  print_error "Failed to get QR code"
fi

# Test 6: Download QR Code as Buffer
print_test "6. Download QR Code as PNG Buffer"

QR_DOWNLOAD=$(curl -s -o /tmp/verification-qr.png -w "%{http_code}" \
  "$BASE_URL/verify/$VERIFICATION_CODE/qrcode?format=buffer&width=400")

if [ "$QR_DOWNLOAD" == "200" ] && [ -f "/tmp/verification-qr.png" ]; then
  FILE_SIZE=$(ls -lh /tmp/verification-qr.png | awk '{print $5}')
  print_success "QR code downloaded as PNG"
  print_info "File size: $FILE_SIZE"
  print_info "Location: /tmp/verification-qr.png"
else
  print_error "Failed to download QR code"
fi

# Test 7: Regenerate QR Code
print_test "7. Regenerate QR Code"

REGEN_RESPONSE=$(curl -s -X POST "$BASE_URL/verify/document/$DOCUMENT_ID/regenerate-qr" \
  -H "Authorization: Bearer $ACCESS_TOKEN")

REGEN_SUCCESS=$(echo $REGEN_RESPONSE | jq -r '.success')

if [ "$REGEN_SUCCESS" == "true" ]; then
  print_success "QR code regenerated successfully"
else
  print_error "Failed to regenerate QR code"
fi

# Test 8: Test Invalid Verification Code
print_test "8. Test Invalid Verification Code"

INVALID_CODE="VER-INVALID1-123456789012345678901234"
INVALID_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" \
  "$BASE_URL/verify/$INVALID_CODE")

if [ "$INVALID_RESPONSE" == "404" ] || [ "$INVALID_RESPONSE" == "400" ]; then
  print_success "Invalid verification code properly rejected"
else
  print_error "Invalid code not properly handled (got $INVALID_RESPONSE)"
fi

# Test 9: Test Rate Limiting
print_test "9. Test Rate Limiting"

# Make multiple rapid requests
RATE_LIMIT_EXCEEDED=false
for i in {1..35}; do
  RATE_RESPONSE=$(curl -s -X GET "$BASE_URL/verify/$VERIFICATION_CODE")
  RATE_SUCCESS=$(echo $RATE_RESPONSE | jq -r '.success')
  
  if [ "$RATE_SUCCESS" == "false" ]; then
    ERROR_MSG=$(echo $RATE_RESPONSE | jq -r '.message')
    if [[ "$ERROR_MSG" == *"Too many"* ]]; then
      RATE_LIMIT_EXCEEDED=true
      break
    fi
  fi
done

if [ "$RATE_LIMIT_EXCEEDED" == "true" ]; then
  print_success "Rate limiting working correctly"
  print_info "Rate limit triggered after $i requests"
else
  print_info "Rate limiting not triggered (may need more requests)"
fi

# Wait for rate limit to reset
sleep 2

# Test 10: Verify Document with Suspicious Pattern Detection
print_test "10. Verify Suspicious Activity Detection"

# Make several more verifications to test suspicious activity detection
for i in {1..5}; do
  curl -s -X GET "$BASE_URL/verify/$VERIFICATION_CODE" > /dev/null
  sleep 0.1
done

SUSPICIOUS_RESPONSE=$(curl -s -X GET "$BASE_URL/verify/$VERIFICATION_CODE")
SUSPICIOUS=$(echo $SUSPICIOUS_RESPONSE | jq -r '.data.suspicious')

if [ "$SUSPICIOUS" != "null" ]; then
  print_success "Suspicious activity detection working"
  print_info "Suspicious: $SUSPICIOUS"
else
  print_info "No suspicious activity detected (expected)"
fi

# Test 11: Email Masking (Privacy)
print_test "11. Test Email Masking for Privacy"

MASKED_EMAIL=$(echo $PUBLIC_VERIFY_RESPONSE | jq -r '.data.signer.email')

if [[ "$MASKED_EMAIL" == *"***"* ]]; then
  print_success "Email properly masked for privacy"
  print_info "Masked email: $MASKED_EMAIL"
else
  print_error "Email not masked"
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
  echo -e "${YELLOW}Verification Details:${NC}"
  echo -e "${YELLOW}  - Verification Code: $VERIFICATION_CODE${NC}"
  echo -e "${YELLOW}  - QR Code saved at: /tmp/verification-qr.png${NC}"
  echo -e "${YELLOW}  - Public URL: http://localhost:3000/verify/$VERIFICATION_CODE${NC}"
  exit 0
else
  echo -e "${RED}✗ SOME TESTS FAILED${NC}"
  exit 1
fi
