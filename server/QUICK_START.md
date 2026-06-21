# Quick Start Guide 🚀

Get the Digital Signature Platform backend up and running in 5 minutes!

## Prerequisites

- Node.js 18+ installed
- Docker & Docker Compose installed (optional but recommended)

## Option 1: Docker (Recommended) 🐳

```bash
# 1. Navigate to server directory
cd server

# 2. Install dependencies
npm install

# 3. Copy environment file
cp .env.example .env

# 4. Start all services with Docker
cd docker
docker-compose up -d

# 5. Check status
docker-compose ps

# 6. View logs
docker-compose logs -f api

# 7. Test the API
curl http://localhost:5000/health
```

**Done!** API is running on `http://localhost:5000`

## Option 2: Local Development 💻

```bash
# 1. Navigate to server directory
cd server

# 2. Install dependencies
npm install

# 3. Create directories
npm run setup

# 4. Copy and configure environment
cp .env.example .env
# Edit .env and set your MongoDB and Redis URLs

# 5. Start MongoDB (if not running)
# macOS: brew services start mongodb-community
# or use Docker: docker run -d -p 27017:27017 mongo

# 6. Start Redis (if not running)
# macOS: brew services start redis
# or use Docker: docker run -d -p 6379:6379 redis

# 7. Start development server
npm run dev
```

**Done!** API is running on `http://localhost:5000`

## Verify Installation ✅

```bash
# Health check
curl http://localhost:5000/health

# Expected response:
# {"success":true,"message":"Server is healthy","timestamp":"...","uptime":...}

# API info
curl http://localhost:5000/api/v1

# Expected response:
# {"success":true,"message":"Digital Signature & Document Management Platform API",...}
```

## Access Services

- **API**: http://localhost:5000
- **Health Check**: http://localhost:5000/health
- **API Routes**: http://localhost:5000/api/v1
- **MongoDB**: localhost:27017 (admin/admin123 in Docker)
- **Redis**: localhost:6379

## Common Commands

```bash
# Development
npm run dev              # Start with hot-reload
npm run lint             # Check code style
npm run format           # Format code
npm test                 # Run tests

# Docker
docker-compose up -d     # Start all services
docker-compose down      # Stop all services
docker-compose logs -f   # View logs
docker-compose ps        # Check status

# Production
npm start                # Start production server
```

## Default Admin Credentials

After running seed script:
```
Email: admin@digitalsignature.com
Password: Admin@123456
```

## Important Files

- `.env` - Environment configuration
- `src/server.js` - Entry point
- `src/app.js` - Express app
- `docker/docker-compose.yml` - Docker services

## Next Steps

1. ✅ Infrastructure is ready
2. 📝 Review [ARCHITECTURE.md](./ARCHITECTURE.md) for system design
3. 🔧 Implement business modules (auth, users, documents, etc.)
4. 🧪 Write tests
5. 🚀 Deploy to production

## Troubleshooting

### Port 5000 already in use
```bash
lsof -i :5000
kill -9 <PID>
```

### MongoDB connection failed
```bash
# Check if MongoDB is running
docker ps | grep mongo

# Restart MongoDB
docker-compose restart mongo
```

### Redis connection failed
```bash
# Check if Redis is running
docker ps | grep redis

# Restart Redis
docker-compose restart redis
```

### Docker issues
```bash
# Clean everything and restart
docker-compose down -v
docker-compose up -d --build
```

## Need Help?

- 📚 [Full Documentation](./README.md)
- 🏗️ [Architecture Guide](./ARCHITECTURE.md)
- 💻 [Installation Guide](./INSTALLATION.md)
- 🛠️ [Infrastructure Setup](./INFRASTRUCTURE_SETUP.md)

---

**Ready to build!** The infrastructure is set up and waiting for business logic implementation.
