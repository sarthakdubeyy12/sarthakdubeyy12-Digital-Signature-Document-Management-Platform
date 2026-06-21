# 🐳 Docker Setup Guide

Complete guide to set up and run the Digital Signature Platform using Docker.

## Prerequisites

Ensure Docker and Docker Compose are installed:

```bash
# Check Docker version
docker --version
# Should show: Docker version 20.x or higher

# Check Docker Compose version
docker-compose --version
# Should show: Docker Compose version 2.x or higher
```

If not installed:
- **macOS**: [Install Docker Desktop](https://docs.docker.com/desktop/install/mac-install/)
- **Linux**: [Install Docker Engine](https://docs.docker.com/engine/install/)
- **Windows**: [Install Docker Desktop](https://docs.docker.com/desktop/install/windows-install/)

---

## 🚀 Quick Setup (Recommended)

```bash
# 1. Navigate to project root
cd server

# 2. Install dependencies (for development)
npm install

# 3. Copy environment file
cp .env.example .env

# 4. Navigate to docker directory
cd docker

# 5. Start all services
docker-compose up -d

# 6. Check status
docker-compose ps

# 7. View logs
docker-compose logs -f

# 8. Test the API
curl http://localhost:5001/health
```

---

## 📝 Detailed Step-by-Step Setup

### Step 1: Prepare Environment

```bash
# Navigate to server directory
cd server

# Install Node dependencies (needed for local development)
npm install

# Create .env file from example
cp .env.example .env
```

### Step 2: Review Docker Compose Configuration

```bash
# View the docker-compose.yml file
cat docker/docker-compose.yml
```

Services that will be started:
- **MongoDB** - Database (port 27017)
- **Redis** - Cache (port 6379)
- **API** - Node.js Backend (port 5000)
- **Nginx** - Reverse Proxy (port 80)

### Step 3: Build and Start Services

```bash
# Navigate to docker directory
cd docker

# Build and start all services in detached mode
docker-compose up -d

# Or with build flag to force rebuild
docker-compose up -d --build
```

Expected output:
```
Creating network "docker_app-network" with driver "bridge"
Creating volume "docker_mongo-data" with default driver
Creating volume "docker_redis-data" with default driver
Creating digital-signature-mongo ... done
Creating digital-signature-redis ... done
Creating digital-signature-api   ... done
Creating digital-signature-nginx ... done
```

### Step 4: Verify Services

```bash
# Check all containers are running
docker-compose ps

# Expected output:
# NAME                        STATUS    PORTS
# digital-signature-api       Up        0.0.0.0:5000->5000/tcp
# digital-signature-mongo     Up        0.0.0.0:27017->27017/tcp
# digital-signature-redis     Up        0.0.0.0:6379->6379/tcp
# digital-signature-nginx     Up        0.0.0.0:80->80/tcp
```

### Step 5: Check Health

```bash
# Test API directly
curl http://localhost:5001/health

# Test through Nginx
curl http://localhost/health

# Expected response:
# {"success":true,"message":"Server is healthy","timestamp":"...","uptime":...}
```

### Step 6: View Logs

```bash
# View all logs
docker-compose logs

# View logs for specific service
docker-compose logs api
docker-compose logs mongo
docker-compose logs redis
docker-compose logs nginx

# Follow logs (live tail)
docker-compose logs -f api

# View last 100 lines
docker-compose logs --tail=100 api
```

---

## 🔧 Common Docker Commands

### Container Management

```bash
# Start services
docker-compose up -d

# Stop services
docker-compose down

# Stop and remove volumes (⚠️ deletes data)
docker-compose down -v

# Restart all services
docker-compose restart

# Restart specific service
docker-compose restart api

# Stop specific service
docker-compose stop api

# Start specific service
docker-compose start api

# Rebuild and restart
docker-compose up -d --build
```

### Viewing Information

```bash
# List containers
docker-compose ps

# View container logs
docker-compose logs -f api

# View container stats (CPU, memory)
docker stats

# Inspect container
docker-compose exec api sh -c "env"
```

### Accessing Containers

```bash
# Access API container shell
docker-compose exec api sh

# Access MongoDB shell
docker-compose exec mongo mongosh

# Access Redis CLI
docker-compose exec redis redis-cli

# Run command in container
docker-compose exec api npm run seed
```

### Cleaning Up

```bash
# Stop and remove containers
docker-compose down

# Remove containers, networks, volumes, images
docker-compose down -v --rmi all

# Remove all unused Docker resources
docker system prune -a --volumes
```

---

## 🗄️ Database Access

### MongoDB

```bash
# Access MongoDB shell
docker-compose exec mongo mongosh

# In mongosh, run:
use digital-signature-platform
show collections
db.users.find()
exit

# Or connect with credentials
docker-compose exec mongo mongosh -u admin -p admin123 --authenticationDatabase admin
```

### Redis

```bash
# Access Redis CLI
docker-compose exec redis redis-cli

# In redis-cli, run:
PING
KEYS *
GET key_name
exit
```

---

## 📊 Monitoring

### Check Container Health

```bash
# View health status
docker-compose ps

# Check specific container health
docker inspect --format='{{json .State.Health}}' digital-signature-api | jq

# View container resource usage
docker stats digital-signature-api
```

### View Logs

```bash
# All logs
docker-compose logs

# Live logs for API
docker-compose logs -f api

# Logs from last 1 hour
docker-compose logs --since 1h api

# Logs with timestamps
docker-compose logs -f -t api
```

---

## 🛠️ Development Workflow

### Full Stack Development

```bash
# Start only database services
docker-compose up -d mongo redis

# Run API locally (in another terminal)
cd ../
npm run dev

# This allows hot-reload while using containerized databases
```

### Rebuild After Code Changes

```bash
# Rebuild and restart API
docker-compose up -d --build api

# Or stop, rebuild, start
docker-compose stop api
docker-compose build api
docker-compose up -d api
```

---

## 🔍 Troubleshooting

### Issue: Containers Not Starting

```bash
# Check logs
docker-compose logs

# Check specific service
docker-compose logs mongo
docker-compose logs redis
docker-compose logs api

# Check Docker daemon
docker ps
```

### Issue: Port Already in Use

```bash
# Find process using port
lsof -i :5000
lsof -i :27017
lsof -i :6379
lsof -i :80

# Kill process
kill -9 <PID>

# Or use different ports in docker-compose.yml
```

### Issue: MongoDB Connection Failed

```bash
# Check MongoDB is running
docker-compose ps mongo

# Check MongoDB logs
docker-compose logs mongo

# Restart MongoDB
docker-compose restart mongo

# Access MongoDB shell
docker-compose exec mongo mongosh
```

### Issue: Redis Connection Failed

```bash
# Check Redis is running
docker-compose ps redis

# Check Redis logs
docker-compose logs redis

# Test Redis connection
docker-compose exec redis redis-cli ping

# Restart Redis
docker-compose restart redis
```

### Issue: API Not Responding

```bash
# Check API logs
docker-compose logs api

# Check if API is running
docker-compose ps api

# Check API health
docker-compose exec api sh -c "curl localhost:5001/health"

# Restart API
docker-compose restart api
```

### Issue: Permission Denied

```bash
# Fix storage permissions
chmod -R 755 ../storage
chmod -R 755 ../logs

# Rebuild with proper permissions
docker-compose down
docker-compose up -d --build
```

### Issue: Out of Disk Space

```bash
# Check Docker disk usage
docker system df

# Clean up unused resources
docker system prune -a --volumes

# Remove specific volumes
docker volume ls
docker volume rm <volume_name>
```

---

## 🔐 Production Configuration

### Update Environment Variables

```bash
# Edit .env file
nano ../.env

# Update these for production:
NODE_ENV=production
JWT_SECRET=<strong-random-secret>
JWT_REFRESH_SECRET=<strong-random-secret>
MONGODB_URI=mongodb://admin:admin123@mongo:27017/digital-signature-platform?authSource=admin
```

### Use Production Docker Compose

Create `docker-compose.prod.yml`:

```yaml
version: '3.8'

services:
  mongo:
    restart: always
    environment:
      MONGO_INITDB_ROOT_USERNAME: ${MONGO_USERNAME}
      MONGO_INITDB_ROOT_PASSWORD: ${MONGO_PASSWORD}
    volumes:
      - mongo-data:/data/db

  redis:
    restart: always
    command: redis-server --requirepass ${REDIS_PASSWORD}
    volumes:
      - redis-data:/data

  api:
    restart: always
    environment:
      NODE_ENV: production
    deploy:
      replicas: 2
      resources:
        limits:
          cpus: '1'
          memory: 512M
```

Run with:
```bash
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

---

## 📈 Scaling

### Scale API Service

```bash
# Scale API to 3 instances
docker-compose up -d --scale api=3

# Check scaled containers
docker-compose ps
```

### Load Balancing with Nginx

Nginx is already configured to load balance between API instances.

---

## 💾 Backup & Restore

### Backup MongoDB

```bash
# Create backup
docker-compose exec mongo mongodump --out=/data/backup

# Copy backup to host
docker cp digital-signature-mongo:/data/backup ./backup
```

### Restore MongoDB

```bash
# Copy backup to container
docker cp ./backup digital-signature-mongo:/data/backup

# Restore
docker-compose exec mongo mongorestore /data/backup
```

### Backup Redis

```bash
# Create Redis snapshot
docker-compose exec redis redis-cli BGSAVE

# Copy RDB file
docker cp digital-signature-redis:/data/dump.rdb ./redis-backup.rdb
```

---

## 🧪 Testing Setup

### Run Tests in Docker

```bash
# Run unit tests
docker-compose exec api npm test

# Run with coverage
docker-compose exec api npm run test:coverage

# Run specific test suite
docker-compose exec api npm run test:unit
```

---

## 📋 Quick Reference

### Start/Stop Commands

| Command | Description |
|---------|-------------|
| `docker-compose up -d` | Start all services |
| `docker-compose down` | Stop all services |
| `docker-compose ps` | Check status |
| `docker-compose logs -f api` | View API logs |
| `docker-compose restart api` | Restart API |
| `docker-compose exec api sh` | Access API shell |

### URLs

| Service | URL |
|---------|-----|
| API Direct | http://localhost:5001 |
| API via Nginx | http://localhost:80 |
| Health Check | http://localhost:5001/health |
| MongoDB | mongodb://localhost:27017 |
| Redis | redis://localhost:6379 |

### Default Credentials

| Service | Username | Password |
|---------|----------|----------|
| MongoDB | admin | admin123 |
| Redis | - | (no password) |

---

## ✅ Setup Verification

After setup, verify everything is working:

```bash
# 1. Check all containers are running
docker-compose ps

# 2. Test API health
curl http://localhost:5001/health

# 3. Test MongoDB connection
docker-compose exec mongo mongosh --eval "db.version()"

# 4. Test Redis connection
docker-compose exec redis redis-cli ping

# 5. Check API logs for errors
docker-compose logs api | grep -i error
```

Expected: No errors, all services healthy ✅

---

## 🎉 You're All Set!

Docker setup is complete. Your services are running:

- ✅ MongoDB on port 27017
- ✅ Redis on port 6379
- ✅ API on port 5000
- ✅ Nginx on port 80

**Next Steps:**
1. Review [SETUP_COMPLETE.md](../SETUP_COMPLETE.md)
2. Start implementing business logic
3. Test your endpoints

---

**Docker Setup Version**: 1.0.0  
**Last Updated**: 2026-06-21
