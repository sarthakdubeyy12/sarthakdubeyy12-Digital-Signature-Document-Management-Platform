#!/bin/bash

# Digital Signature Platform - Docker Commands
# Run these commands in your terminal

echo "======================================"
echo "Docker Setup Commands"
echo "======================================"
echo ""

# Step 1: Navigate to docker directory
echo "Step 1: Navigate to docker directory"
echo "cd server/docker"
echo ""

# Step 2: Stop existing containers
echo "Step 2: Stop existing containers"
echo "docker-compose down --remove-orphans"
echo ""

# Step 3: Remove old images (optional - fresh start)
echo "Step 3: Remove old images (optional)"
echo "docker rmi docker-api 2>/dev/null || true"
echo ""

# Step 4: Start services
echo "Step 4: Start services"
echo "docker-compose up -d"
echo ""

# Step 5: Check status
echo "Step 5: Check status (wait 15 seconds first)"
echo "sleep 15"
echo "docker-compose ps"
echo ""

# Step 6: Check logs
echo "Step 6: Check API logs"
echo "docker logs digital-signature-api"
echo ""

# Step 7: Test health endpoint
echo "Step 7: Test health endpoint"
echo "curl http://localhost:5001/health"
echo ""

echo "======================================"
echo "Troubleshooting Commands"
echo "======================================"
echo ""

echo "View API logs:"
echo "docker logs digital-signature-api -f"
echo ""

echo "View MongoDB logs:"
echo "docker logs digital-signature-mongo"
echo ""

echo "View Redis logs:"
echo "docker logs digital-signature-redis"
echo ""

echo "Access API container:"
echo "docker exec -it digital-signature-api sh"
echo ""

echo "Access MongoDB shell:"
echo "docker exec -it digital-signature-mongo mongosh"
echo ""

echo "Access Redis CLI:"
echo "docker exec -it digital-signature-redis redis-cli"
echo ""

echo "Restart API only:"
echo "docker-compose restart api"
echo ""

echo "Rebuild and restart:"
echo "docker-compose up -d --build api"
echo ""

echo "======================================"
echo "Current Status Check"
echo "======================================"
docker ps
