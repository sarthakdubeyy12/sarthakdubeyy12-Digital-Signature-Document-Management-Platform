# 🚀 Production Deployment Guide

Complete guide for deploying the Digital Signature & Document Management Platform to production.

---

## 📋 Table of Contents

1. [Prerequisites](#prerequisites)
2. [Pre-Deployment Checklist](#pre-deployment-checklist)
3. [Environment Setup](#environment-setup)
4. [SSL/TLS Configuration](#ssltls-configuration)
5. [Deployment Steps](#deployment-steps)
6. [Post-Deployment Verification](#post-deployment-verification)
7. [Monitoring & Maintenance](#monitoring--maintenance)
8. [Backup Strategy](#backup-strategy)
9. [Troubleshooting](#troubleshooting)
10. [Rollback Procedure](#rollback-procedure)

---

## 🎯 Prerequisites

### Server Requirements
- **OS**: Ubuntu 20.04+ / CentOS 8+ / Amazon Linux 2
- **RAM**: Minimum 2GB, Recommended 4GB+
- **CPU**: 2+ cores
- **Storage**: Minimum 20GB (more depending on document volume)
- **Network**: Static IP address or domain name

### Software Requirements
- Docker 20.10+
- Docker Compose 2.0+
- OpenSSL (for generating secrets)
- Domain name (for SSL)

### Access Requirements
- SSH access to production server
- Domain DNS control (for SSL)
- SMTP credentials (for email)
- MongoDB connection (if using external)

---

## ✅ Pre-Deployment Checklist

### Security
- [ ] Generate strong JWT secrets (64+ characters)
- [ ] Generate strong database passwords
- [ ] Configure Redis password
- [ ] Set strong admin password
- [ ] Review and update CORS origins
- [ ] Configure rate limiting values
- [ ] Review security headers

### Infrastructure
- [ ] Server provisioned and accessible via SSH
- [ ] Domain name configured and pointing to server
- [ ] Firewall rules configured (ports 80, 443, 22)
- [ ] Docker and Docker Compose installed
- [ ] SSL certificates obtained (Let's Encrypt recommended)

### Services
- [ ] SMTP credentials obtained and tested
- [ ] Email sending domain verified (SPF, DKIM, DMARC)
- [ ] Storage strategy decided (local vs S3)
- [ ] Backup strategy planned

### Configuration
- [ ] `.env.production` file prepared with actual values
- [ ] Nginx configuration reviewed
- [ ] Docker Compose production file reviewed
- [ ] MongoDB replica set initialization script ready

---

## 🔧 Environment Setup

### 1. Generate Strong Secrets

Generate JWT secrets:
```bash
# JWT Access Token Secret
openssl rand -base64 64

# JWT Refresh Token Secret
openssl rand -base64 64
```

Generate database passwords:
```bash
# MongoDB root password
openssl rand -base64 32

# Redis password
openssl rand -base64 32
```

### 2. Configure Environment Variables

Copy and edit the production environment file:
```bash
cp .env.production .env
nano .env
```

**Critical values to update:**
```env
# JWT Secrets (use values from step 1)
JWT_SECRET=<64-char-random-string>
JWT_REFRESH_SECRET=<different-64-char-random-string>

# Database
MONGO_ROOT_PASSWORD=<strong-password>
DATABASE_URL="mongodb://admin:<strong-password>@mongo:27017/digital-signature-platform?authSource=admin&replicaSet=rs0"

# Redis
REDIS_PASSWORD=<strong-password>

# Email
SMTP_USER=<your-email>
SMTP_PASSWORD=<your-app-password>
EMAIL_FROM=noreply@yourdomain.com

# Domain
FRONTEND_URL=https://yourdomain.com
CORS_ORIGIN=https://yourdomain.com

# Admin
ADMIN_EMAIL=admin@yourdomain.com
ADMIN_PASSWORD=<strong-password>
```

### 3. Server Preparation

SSH into your server:
```bash
ssh user@your-server-ip
```

Update system:
```bash
sudo apt update && sudo apt upgrade -y
```

Install Docker:
```bash
# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Add user to docker group
sudo usermod -aG docker $USER

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
```

Configure firewall:
```bash
# Allow SSH, HTTP, HTTPS
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

---

## 🔒 SSL/TLS Configuration

### Option 1: Let's Encrypt (Recommended - Free)

Install Certbot:
```bash
sudo apt install certbot
```

Obtain SSL certificate:
```bash
# Stop any service using port 80
sudo certbot certonly --standalone -d yourdomain.com -d www.yourdomain.com
```

Copy certificates to project:
```bash
# Create SSL directory
mkdir -p docker/nginx/ssl

# Copy certificates
sudo cp /etc/letsencrypt/live/yourdomain.com/fullchain.pem docker/nginx/ssl/
sudo cp /etc/letsencrypt/live/yourdomain.com/privkey.pem docker/nginx/ssl/
sudo chown -R $USER:$USER docker/nginx/ssl
```

### Option 2: Self-Signed Certificate (Development Only)

```bash
mkdir -p docker/nginx/ssl
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout docker/nginx/ssl/privkey.pem \
  -out docker/nginx/ssl/fullchain.pem \
  -subj "/C=US/ST=State/L=City/O=Organization/CN=yourdomain.com"
```

### Enable HTTPS in Nginx

Edit `docker/nginx/nginx.prod.conf` and uncomment the HTTPS server block:

```nginx
# Uncomment lines 72-132 in nginx.prod.conf
# Update server_name with your domain
server_name yourdomain.com www.yourdomain.com;
```

Also uncomment the HTTP to HTTPS redirect on line 63:
```nginx
return 301 https://$host$request_uri;
```

### Auto-Renewal Setup (Let's Encrypt)

```bash
# Test renewal
sudo certbot renew --dry-run

# Setup auto-renewal (runs twice daily)
sudo systemctl enable certbot.timer
sudo systemctl start certbot.timer
```

---

## 🚀 Deployment Steps

### 1. Clone Repository

```bash
cd /opt
sudo mkdir -p digital-signature-platform
sudo chown $USER:$USER digital-signature-platform
cd digital-signature-platform
git clone <your-repo-url> .
```

### 2. Configure Environment

```bash
cd server
cp .env.production .env
nano .env  # Update all values
```

### 3. Initialize MongoDB Replica Set

Start only MongoDB first:
```bash
docker-compose -f docker/docker-compose.prod.yml up -d mongo
```

Wait 10 seconds, then initialize replica set:
```bash
docker exec -it digital-signature-mongo-prod mongosh --eval "rs.initiate({_id: 'rs0', members: [{_id: 0, host: 'mongo:27017'}]})"
```

Verify replica set:
```bash
docker exec -it digital-signature-mongo-prod mongosh --eval "rs.status()"
```

### 4. Start All Services

```bash
docker-compose -f docker/docker-compose.prod.yml up -d --build
```

### 5. Check Service Status

```bash
docker-compose -f docker/docker-compose.prod.yml ps
docker-compose -f docker/docker-compose.prod.yml logs -f
```

### 6. Create Admin User

```bash
docker exec -it digital-signature-api-prod npm run seed
```

Or manually:
```bash
docker exec -it digital-signature-api-prod node scripts/create-admin.js
```

---

## ✅ Post-Deployment Verification

### 1. Health Check

```bash
# HTTP
curl http://your-server-ip/health

# HTTPS (if configured)
curl https://yourdomain.com/health
```

Expected response:
```json
{
  "status": "healthy",
  "timestamp": "2026-06-23T...",
  "uptime": 123.45,
  "services": {
    "database": "connected",
    "redis": "connected"
  }
}
```

### 2. Test API Endpoints

Register a user:
```bash
curl -X POST https://yourdomain.com/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test@123456",
    "firstName": "Test",
    "lastName": "User"
  }'
```

Login:
```bash
curl -X POST https://yourdomain.com/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test@123456"
  }'
```

### 3. Check Logs

```bash
# Application logs
docker-compose -f docker/docker-compose.prod.yml logs api

# Nginx logs
docker-compose -f docker/docker-compose.prod.yml logs nginx

# MongoDB logs
docker-compose -f docker/docker-compose.prod.yml logs mongo
```

### 4. Verify Storage

```bash
# Check storage directory
docker exec -it digital-signature-api-prod ls -la storage/

# Check logs directory
docker exec -it digital-signature-api-prod ls -la logs/
```

---

## 📊 Monitoring & Maintenance

### Container Monitoring

```bash
# Check resource usage
docker stats

# Check disk usage
docker system df

# Check container health
docker ps --format "table {{.Names}}\t{{.Status}}"
```

### Log Rotation

Logs are automatically rotated by Winston. Configure retention in `.env`:
```env
LOG_MAX_SIZE=20m
LOG_MAX_FILES=14d
```

### Database Backup

Manual backup:
```bash
# Backup MongoDB
docker exec digital-signature-mongo-prod mongodump \
  --out=/data/backup/$(date +%Y%m%d_%H%M%S) \
  --authenticationDatabase admin \
  -u admin \
  -p <password>

# Copy backup to host
docker cp digital-signature-mongo-prod:/data/backup ./backups/
```

Automated backup script:
```bash
#!/bin/bash
# backup.sh
BACKUP_DIR="/opt/backups/mongodb"
DATE=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR

docker exec digital-signature-mongo-prod mongodump \
  --out=/data/backup/$DATE \
  --authenticationDatabase admin \
  -u admin \
  -p $MONGO_ROOT_PASSWORD

docker cp digital-signature-mongo-prod:/data/backup/$DATE $BACKUP_DIR/

# Keep only last 7 days
find $BACKUP_DIR -type d -mtime +7 -exec rm -rf {} \;
```

Setup cron job:
```bash
crontab -e
# Add: 0 2 * * * /opt/digital-signature-platform/backup.sh
```

### System Monitoring

Setup process monitoring with systemd:

Create `/etc/systemd/system/digital-signature.service`:
```ini
[Unit]
Description=Digital Signature Platform
Requires=docker.service
After=docker.service

[Service]
Type=oneshot
RemainAfterExit=yes
WorkingDirectory=/opt/digital-signature-platform/server
ExecStart=/usr/local/bin/docker-compose -f docker/docker-compose.prod.yml up -d
ExecStop=/usr/local/bin/docker-compose -f docker/docker-compose.prod.yml down
User=youruser

[Install]
WantedBy=multi-user.target
```

Enable service:
```bash
sudo systemctl enable digital-signature.service
sudo systemctl start digital-signature.service
```

---

## 💾 Backup Strategy

### What to Backup

1. **MongoDB Database**: All application data
2. **Storage Directory**: Uploaded documents and signatures
3. **Environment Files**: `.env` and configuration
4. **SSL Certificates**: If using Let's Encrypt

### Backup Schedule

- **Daily**: MongoDB database
- **Weekly**: Full system backup (database + storage)
- **Monthly**: Archived backups (compress and move to cold storage)

### Restore Procedure

Restore MongoDB:
```bash
docker exec -i digital-signature-mongo-prod mongorestore \
  --authenticationDatabase admin \
  -u admin \
  -p <password> \
  /data/backup/20260623_120000
```

Restore storage:
```bash
docker cp ./backups/storage/ digital-signature-api-prod:/app/storage/
```

---

## 🔧 Troubleshooting

### Issue: Containers Won't Start

```bash
# Check logs
docker-compose -f docker/docker-compose.prod.yml logs

# Check disk space
df -h

# Check Docker daemon
sudo systemctl status docker
```

### Issue: Database Connection Failed

```bash
# Check MongoDB status
docker exec -it digital-signature-mongo-prod mongosh --eval "rs.status()"

# Reinitialize replica set if needed
docker exec -it digital-signature-mongo-prod mongosh --eval "rs.initiate({_id: 'rs0', members: [{_id: 0, host: 'mongo:27017'}]})"
```

### Issue: High Memory Usage

```bash
# Restart services
docker-compose -f docker/docker-compose.prod.yml restart

# Check for memory leaks in logs
docker-compose -f docker/docker-compose.prod.yml logs api | grep -i memory
```

### Issue: SSL Certificate Errors

```bash
# Check certificate validity
openssl x509 -in docker/nginx/ssl/fullchain.pem -text -noout

# Renew Let's Encrypt certificate
sudo certbot renew

# Restart nginx
docker-compose -f docker/docker-compose.prod.yml restart nginx
```

---

## 🔄 Rollback Procedure

### Quick Rollback

```bash
# Stop current deployment
docker-compose -f docker/docker-compose.prod.yml down

# Restore previous version
git checkout <previous-commit>

# Rebuild and start
docker-compose -f docker/docker-compose.prod.yml up -d --build
```

### Full Rollback with Data Restore

```bash
# Stop services
docker-compose -f docker/docker-compose.prod.yml down

# Restore database backup
docker exec -i digital-signature-mongo-prod mongorestore /data/backup/<backup-date>

# Restore code
git checkout <previous-commit>

# Start services
docker-compose -f docker/docker-compose.prod.yml up -d --build
```

---

## 🎯 Performance Optimization

### Database Indexing

Ensure indexes are created:
```bash
docker exec -it digital-signature-mongo-prod mongosh digital-signature-platform --eval "db.Document.getIndexes()"
```

### Redis Memory

Monitor Redis memory usage:
```bash
docker exec -it digital-signature-redis-prod redis-cli INFO memory
```

### Nginx Caching

Enable caching for static assets in nginx config.

---

## 📞 Support & Maintenance

### Regular Maintenance Tasks

**Daily**:
- Check application logs for errors
- Monitor disk usage
- Verify backup completion

**Weekly**:
- Review security logs
- Update Docker images (if needed)
- Check SSL certificate expiry

**Monthly**:
- Review and rotate access credentials
- Audit user permissions
- Archive old logs and backups

---

## 🎉 Production Checklist Summary

- [ ] Environment variables configured
- [ ] SSL certificates installed
- [ ] MongoDB replica set initialized
- [ ] All services started and healthy
- [ ] Admin user created
- [ ] API endpoints tested
- [ ] Backup strategy implemented
- [ ] Monitoring setup completed
- [ ] Firewall configured
- [ ] DNS configured correctly
- [ ] Email sending tested
- [ ] Rate limiting verified
- [ ] Logs rotation configured
- [ ] Documentation updated

---

**Status**: Ready for Production ✅  
**Last Updated**: June 23, 2026  
**Version**: 1.0.0
