#!/bin/bash

# Health Check Script for Digital Signature Platform
# Usage: ./scripts/health-check.sh [environment]
# environment: development (default) or production

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Environment
ENV=${1:-development}

if [ "$ENV" = "production" ]; then
    COMPOSE_FILE="docker/docker-compose.prod.yml"
    API_CONTAINER="digital-signature-api-prod"
    MONGO_CONTAINER="digital-signature-mongo-prod"
    REDIS_CONTAINER="digital-signature-redis-prod"
    NGINX_CONTAINER="digital-signature-nginx-prod"
else
    COMPOSE_FILE="docker/docker-compose.yml"
    API_CONTAINER="digital-signature-api"
    MONGO_CONTAINER="digital-signature-mongo"
    REDIS_CONTAINER="digital-signature-redis"
    NGINX_CONTAINER="digital-signature-nginx"
fi

echo "========================================="
echo "  Digital Signature Platform"
echo "  Health Check - $ENV"
echo "========================================="
echo ""

# Function to check container status
check_container() {
    local container=$1
    local service=$2
    
    if docker ps --format '{{.Names}}' | grep -q "^${container}$"; then
        local status=$(docker inspect --format='{{.State.Health.Status}}' $container 2>/dev/null || echo "unknown")
        if [ "$status" = "healthy" ] || [ "$status" = "unknown" ]; then
            echo -e "${GREEN}✓${NC} $service: Running"
            return 0
        else
            echo -e "${RED}✗${NC} $service: Unhealthy (Status: $status)"
            return 1
        fi
    else
        echo -e "${RED}✗${NC} $service: Not running"
        return 1
    fi
}

# Check Docker
echo "1. Checking Docker..."
if ! command -v docker &> /dev/null; then
    echo -e "${RED}✗${NC} Docker is not installed"
    exit 1
fi
echo -e "${GREEN}✓${NC} Docker is installed"
echo ""

# Check containers
echo "2. Checking Containers..."
check_container $MONGO_CONTAINER "MongoDB"
check_container $REDIS_CONTAINER "Redis"
check_container $API_CONTAINER "API"

if [ "$ENV" = "production" ]; then
    check_container $NGINX_CONTAINER "Nginx"
fi
echo ""

# Check API health endpoint
echo "3. Checking API Health..."
if [ "$ENV" = "production" ]; then
    API_URL="http://localhost/health"
else
    API_URL="http://localhost:5001/health"
fi

HEALTH_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" $API_URL 2>/dev/null || echo "000")

if [ "$HEALTH_RESPONSE" = "200" ]; then
    echo -e "${GREEN}✓${NC} API Health: OK"
    curl -s $API_URL | jq '.' 2>/dev/null || echo ""
else
    echo -e "${RED}✗${NC} API Health: Failed (HTTP $HEALTH_RESPONSE)"
fi
echo ""

# Check MongoDB replica set
echo "4. Checking MongoDB Replica Set..."
RS_STATUS=$(docker exec $MONGO_CONTAINER mongosh --quiet --eval "rs.status().ok" 2>/dev/null || echo "0")

if [ "$RS_STATUS" = "1" ]; then
    echo -e "${GREEN}✓${NC} MongoDB Replica Set: OK"
else
    echo -e "${RED}✗${NC} MongoDB Replica Set: Not initialized"
fi
echo ""

# Check Redis connection
echo "5. Checking Redis..."
REDIS_PING=$(docker exec $REDIS_CONTAINER redis-cli ping 2>/dev/null || echo "FAILED")

if [ "$REDIS_PING" = "PONG" ]; then
    echo -e "${GREEN}✓${NC} Redis: Connected"
else
    echo -e "${RED}✗${NC} Redis: Connection failed"
fi
echo ""

# Check disk usage
echo "6. Checking Disk Usage..."
DISK_USAGE=$(df -h / | awk 'NR==2 {print $5}' | sed 's/%//')

if [ "$DISK_USAGE" -lt 80 ]; then
    echo -e "${GREEN}✓${NC} Disk Usage: ${DISK_USAGE}%"
elif [ "$DISK_USAGE" -lt 90 ]; then
    echo -e "${YELLOW}⚠${NC} Disk Usage: ${DISK_USAGE}% (Warning)"
else
    echo -e "${RED}✗${NC} Disk Usage: ${DISK_USAGE}% (Critical)"
fi
echo ""

# Check Docker volumes
echo "7. Checking Docker Volumes..."
docker volume ls | grep digital-signature | while read -r line; do
    echo -e "${GREEN}✓${NC} $line"
done
echo ""

# Summary
echo "========================================="
echo "  Health Check Complete"
echo "========================================="
