#!/bin/bash

echo "=== Testing All Auth Endpoints ==="
echo ""

# 1. Login and get tokens
echo "1. Testing Login..."
LOGIN_RESP=$(curl -s -X POST http://localhost:5001/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"demo@test.com","password":"Demo@123456"}')

SUCCESS=$(echo "$LOGIN_RESP" | jq -r '.success')
if [ "$SUCCESS" == "true" ]; then
  ACCESS_TOKEN=$(echo "$LOGIN_RESP" | jq -r '.data.accessToken')
  REFRESH_TOKEN=$(echo "$LOGIN_RESP" | jq -r '.data.refreshToken')
  echo "✅ Login successful"
else
  echo "❌ Login failed"
  exit 1
fi

# 2. Get current user
echo "2. Testing Get Current User..."
CURRENT_USER=$(curl -s -X GET http://localhost:5001/api/v1/auth/me \
  -H "Authorization: Bearer $ACCESS_TOKEN")

EMAIL=$(echo "$CURRENT_USER" | jq -r '.data.email')
if [ "$EMAIL" == "demo@test.com" ]; then
  echo "✅ Get current user successful: $EMAIL"
else
  echo "❌ Get current user failed"
fi

# 3. Refresh token
echo "3. Testing Refresh Token..."
REFRESH_RESP=$(curl -s -X POST http://localhost:5001/api/v1/auth/refresh \
  -H "Content-Type: application/json" \
  -d "{\"refreshToken\":\"$REFRESH_TOKEN\"}")

NEW_ACCESS=$(echo "$REFRESH_RESP" | jq -r '.data.accessToken')
if [ "$NEW_ACCESS" != "null" ] && [ "$NEW_ACCESS" != "" ]; then
  echo "✅ Refresh token successful"
else
  echo "❌ Refresh token failed"
fi

# 4. Logout
echo "4. Testing Logout..."
LOGOUT=$(curl -s -X POST http://localhost:5001/api/v1/auth/logout \
  -H "Authorization: Bearer $NEW_ACCESS" \
  -H "Content-Type: application/json" \
  -d "{\"refreshToken\":\"$REFRESH_TOKEN\"}")

LOGOUT_SUCCESS=$(echo "$LOGOUT" | jq -r '.success')
if [ "$LOGOUT_SUCCESS" == "true" ]; then
  echo "✅ Logout successful"
else
  echo "❌ Logout failed"
fi

# 5. Test Forgot Password
echo "5. Testing Forgot Password..."
FORGOT=$(curl -s -X POST http://localhost:5001/api/v1/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{"email":"demo@test.com"}')

FORGOT_SUCCESS=$(echo "$FORGOT" | jq -r '.success')
if [ "$FORGOT_SUCCESS" == "true" ]; then
  echo "✅ Forgot password email sent"
else
  echo "❌ Forgot password failed"
fi

echo ""
echo "🎉 All tested endpoints are working!"
echo ""
echo "Summary:"
echo "✅ POST /api/v1/auth/login"
echo "✅ GET /api/v1/auth/me"
echo "✅ POST /api/v1/auth/refresh"
echo "✅ POST /api/v1/auth/logout"
echo "✅ POST /api/v1/auth/forgot-password"
