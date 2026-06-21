# Installation Guide

Complete step-by-step installation guide for the Digital Signature Platform backend.

## Quick Start

```bash
# 1. Navigate to server directory
cd server

# 2. Install dependencies
npm install

# 3. Copy environment variables
cp .env.example .env

# 4. Create required directories
npm run setup

# 5. Start development server
npm run dev
```

## Detailed Installation Steps

### Step 1: Prerequisites

Ensure you have the following installed:

```bash
# Check Node.js version (should be >= 18)
node --version

# Check npm version (should be >= 9)
npm --version

# Check MongoDB (if running locally)
mongod --version

# Check Redis (if running locally)
redis-server --version
```

### Step 2: Install Dependencies

```bash
# Install all dependencies
npm install

# Or use clean install
npm ci
```

This will install:
- Production dependencies (~30 packages)
- Development dependencies (~15 packages)

### Step 3: Environment Configuration

```bash
# Copy example environment file
cp .env.example .env

# Edit the file with your settings
nano .env  # or use your preferred editor
```

#### Required Environment Variables

Update these in `.env`:

```env
# CRITICAL - Change these!
JWT_SECRET=your-unique-secret-key-here
JWT_REFRESH_SECRET=your-unique-refresh-secret-here

# Database (if not using Docker)
MONGODB_URI=mongodb://localhost:27017/digital-signature-platform

# Redis (if not using Docker)
REDIS_HOST=localhost
REDIS_PORT=6379

# Email (for production)
SMTP_USER=your-email@example.com
SMTP_PASSWORD=your-app-password
```

### Step 4: Database Setup

#### Option A: Using Docker (Recommended)

```bash
# Start MongoDB and Redis
cd docker
docker-compose up -d mongo redis

# Verify services are running
docker-compose ps
```

#### Option B: Local Installation

**MongoDB:**
```bash
# macOS
brew install mongodb-community

# Start MongoDB
brew services start mongodb-community
```

**Redis:**
```bash
# macOS
brew install redis

# Start Redis
brew services start redis
```

### Step 5: Create Directories

```bash
# Create storage directories
mkdir -p storage/documents/original
mkdir -p storage/documents/signed
mkdir -p storage/signatures
mkdir -p storage/temp

# Create log directories
mkdir -p logs/error
mkdir -p logs/combined
mkdir -p logs/audit
```

### Step 6: Seed Database (Optional)

```bash
# Create admin user and test data
npm run seed
```

This creates:
- Admin user (admin@digitalsignature.com / Admin@123456)
- Sample data for testing

### Step 7: Start the Server

#### Development Mode

```bash
npm run dev
```

Server will start on `http://localhost:5001` with hot-reload.

#### Production Mode

```bash
npm start
```

### Step 8: Verify Installation

```bash
# Check health endpoint
curl http://localhost:5001/health

# Expected response:
# {"success":true,"message":"Server is healthy"}
```

## Docker Installation

### Complete Stack with Docker Compose

```bash
# Navigate to docker directory
cd docker

# Build and start all services
docker-compose up -d

# View logs
docker-compose logs -f api

# Check status
docker-compose ps
```

This starts:
- **MongoDB** on port 27017
- **Redis** on port 6379
- **API** on port 5000
- **Nginx** on port 80

### Verify Docker Installation

```bash
# Check API health
curl http://localhost:5001/health

# Or through Nginx
curl http://localhost/health

# Check MongoDB
docker exec -it digital-signature-mongo mongosh

# Check Redis
docker exec -it digital-signature-redis redis-cli ping
```

## Troubleshooting

### Port Already in Use

```bash
# Find process using port 5000
lsof -i :5000

# Kill the process
kill -9 <PID>
```

### MongoDB Connection Error

```bash
# Check if MongoDB is running
docker ps | grep mongo

# Or for local installation
brew services list | grep mongodb

# Restart MongoDB
docker-compose restart mongo
# Or
brew services restart mongodb-community
```

### Redis Connection Error

```bash
# Check if Redis is running
docker ps | grep redis

# Or for local installation
brew services list | grep redis

# Restart Redis
docker-compose restart redis
# Or
brew services restart redis
```

### Permission Errors

```bash
# Fix storage permissions
chmod -R 755 storage
chmod -R 755 logs

# Fix ownership (if needed)
chown -R $USER:$USER storage logs
```

### Dependency Installation Errors

```bash
# Clear npm cache
npm cache clean --force

# Remove node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

## Post-Installation

### 1. Configure Email Service

For password reset and notifications:

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
```

### 2. Configure File Storage

Choose between local or S3 storage:

```env
# Local storage (default)
STORAGE_TYPE=local
STORAGE_LOCAL_PATH=./storage

# AWS S3 storage
STORAGE_TYPE=s3
AWS_ACCESS_KEY_ID=your-key
AWS_SECRET_ACCESS_KEY=your-secret
AWS_S3_BUCKET=your-bucket
```

### 3. Set Up SSL (Production)

For production, use HTTPS:

```bash
# Using Let's Encrypt with Certbot
certbot --nginx -d yourdomain.com
```

### 4. Configure Monitoring

Set up logging and monitoring:

```env
LOG_LEVEL=info  # Use 'debug' for development
```

## Testing Installation

### Run Tests

```bash
# Run all tests
npm test

# Run specific test suites
npm run test:unit
npm run test:integration
```

### Test API Endpoints

```bash
# Health check
curl http://localhost:5001/health

# API welcome
curl http://localhost:5001/api/v1

# Register user (should work)
curl -X POST http://localhost:5001/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test@123456",
    "firstName": "Test",
    "lastName": "User"
  }'
```

## Next Steps

1. **Frontend Integration**: Connect Next.js frontend
2. **API Testing**: Use Postman or similar tool
3. **Documentation**: Review API documentation
4. **Security**: Change default secrets
5. **Deployment**: Follow deployment guide

## Getting Help

If you encounter issues:

1. Check logs in `logs/` directory
2. Review error messages in console
3. Verify all environment variables are set
4. Ensure all services (MongoDB, Redis) are running
5. Check Docker container logs: `docker-compose logs`

## Additional Resources

- [Architecture Documentation](./ARCHITECTURE.md)
- [API Documentation](./README.md#api-documentation)
- [Docker Documentation](https://docs.docker.com/)
- [MongoDB Documentation](https://docs.mongodb.com/)
- [Redis Documentation](https://redis.io/documentation)

---

**Installation Guide Version**: 1.0.0  
**Last Updated**: 2026-06-21
