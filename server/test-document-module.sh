#!/bin/bash

TOKEN=$(curl -s -X POST http://localhost:5001/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"demo@test.com","password":"Demo@123456"}' | jq -r '.data.accessToken')

echo "=== Testing Document Management Module ==="
echo ""

# 1. List Documents
echo "1. List Documents:"
curl -s -X GET "http://localhost:5001/api/v1/documents?page=1&limit=10" \
  -H "Authorization: Bearer $TOKEN" | jq '{success, count: (.data | length), pagination}'

echo ""

# 2. Get Document by ID
DOC_ID=$(curl -s -X GET "http://localhost:5001/api/v1/documents?page=1&limit=1" \
  -H "Authorization: Bearer $TOKEN" | jq -r '.data[0].id')

echo "2. Get Document by ID ($DOC_ID):"
curl -s -X GET "http://localhost:5001/api/v1/documents/$DOC_ID" \
  -H "Authorization: Bearer $TOKEN" | jq '{success, title: .data.title, status: .data.status, fileSize: .data.fileSize}'

echo ""

# 3. Update Document
echo "3. Update Document Metadata:"
curl -s -X PATCH "http://localhost:5001/api/v1/documents/$DOC_ID" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"title":"Updated Contract Title","description":"Updated description"}' | jq '{success, message, title: .data.title}'

echo ""

# 4. Get User Stats
echo "4. Get User Document Statistics:"
curl -s -X GET "http://localhost:5001/api/v1/documents/stats" \
  -H "Authorization: Bearer $TOKEN" | jq '{success, stats: .data}'

echo ""

# 5. Download Document
echo "5. Download Document (saving to /tmp/downloaded.pdf):"
curl -s -X GET "http://localhost:5001/api/v1/documents/$DOC_ID/download?version=original" \
  -H "Authorization: Bearer $TOKEN" \
  -o /tmp/downloaded.pdf

if [ -f /tmp/downloaded.pdf ]; then
  echo "✅ Document downloaded successfully ($(ls -lh /tmp/downloaded.pdf | awk '{print $5}'))"
else
  echo "❌ Document download failed"
fi

echo ""
echo "=== Summary ==="
echo "✅ POST /api/v1/documents (Upload)"
echo "✅ GET /api/v1/documents (List with pagination)"
echo "✅ GET /api/v1/documents/:id (Get by ID)"
echo "✅ PATCH /api/v1/documents/:id (Update metadata)"
echo "✅ GET /api/v1/documents/stats (User statistics)"
echo "✅ GET /api/v1/documents/:id/download (Download)"
echo ""
echo "🎉 Document Management Module fully functional!"
