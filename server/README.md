# Digital Signature & Document Management Platform - Backend

Production-grade backend API for digital signature and document management system built with Node.js, Express, MongoDB, and Redis.

## 📋 Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Configuration](#configuration)
- [Running the Application](#running-the-application)
- [Docker Setup](#docker-setup)
- [Project Structure](#project-structure)
- [API Documentation](#api-documentation)
- [Testing](#testing)
- [Deployment](#deployment)

## ✨ Features

- 🔐 JWT-based authentication with refresh tokens
- 📄 PDF document upload and management
- ✍️ Electronic signature application
- 🔍 Public document verification
- 📊 Comprehensive audit logging
- 👮 Role-based access control (RBAC)
- 🚀 Production-ready architecture
- 🐳 Docker containerization
- 📝 Winston logging
- ⚡ Redis caching
- 🛡️ Security best practices (Helmet, CORS, Rate Limiting)

## 🛠️ Tech Stack

### Core
- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Language**: JavaScript (ES6+)
- **Database**: MongoDB
- **Cache**: Redis

### Libraries
- **Authentication**: jsonwebtoken, bcryptjs
- **Validation**: Joi, express-validator
- **File Processing**: multer, pdf-lib
- **Email**: nodemailer
- **Logging**: winston, morgan
- **Security**: helmet, cors, express-rate-limit, express-mongo-sanitize

## 📦 Prerequisites

- Node.js >= 18.0.0
- npm >= 9.0.0
- MongoDB >= 6.0
- Redis >= 7.0
- Docker & Docker Compose (optional)

## 🚀 Installation

### 1. Clone the repository

```bash
git clone <repository-url>
cd server
```

### 2. Install dependencies

```bash
npm install
```

### 3. Set up environment variables

```bash
cp .env.example .env
```

Edit `.env` file with your configuration:

```env
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://localhost:27017/digital-signature-platform
REDIS_HOST=localhost
REDIS_PORT=6379
JWT_SECRET=your-secret-key
JWT_REFRESH_SECRET=your-refresh-secret-key
```

### 4. Create required directories

```bash
mkdir -p storage/documents/original storage/documents/signed storage/signatures storage/temp
mkdir -p logs/error logs/combined logs/audit
```

## ⚙️ Configuration

All configuration is managed through environment variables. See `.env.example` for all available options.

### Key Configuration Areas:

- **Application**: Port, environment, API version
- **Database**: MongoDB connection URI
- **Redis**: Cache configuration
- **JWT**: Token secrets and expiry
- **File Upload**: Size limits, allowed types
- **Email**: SMTP configuration
- **Security**: Rate limiting, CORS

## 🏃 Running the Application

### Development Mode

```bash
npm run dev
```

The server will start on `http://localhost:5001` with hot-reloading enabled.

### Production Mode

```bash
npm start
```

### Available Scripts

```bash
npm run dev          # Start development server with nodemon
npm start            # Start production server
npm run lint         # Run ESLint
npm run lint:fix     # Fix ESLint errors
npm run format       # Format code with Prettier
npm test             # Run tests
npm run seed         # Seed database with initial data
```

## 🐳 Docker Setup

### Using Docker Compose (Recommended)

```bash
# Build and start all services
cd docker
docker-compose up -d

# View logs
docker-compose logs -f

# Stop all services
docker-compose down

# Stop and remove volumes
docker-compose down -v
```

Services included:
- **API**: Node.js application (port 5000)
- **MongoDB**: Database (port 27017)
- **Redis**: Cache (port 6379)
- **Nginx**: Reverse proxy (port 80)

### Manual Docker Build

```bash
# Build image
docker build -t digital-signature-api -f docker/Dockerfile .

# Run container
docker run -p 5000:5000 --env-file .env digital-signature-api
```

## 📁 Project Structure

```
server/
├── src/
│   ├── config/              # Configuration files
│   ├── middleware/          # Express middleware
│   ├── modules/             # Feature modules
│   │   ├── auth/           # Authentication
│   │   ├── users/          # User management
│   │   ├── documents/      # Document handling
│   │   ├── signatures/     # Signature management
│   │   ├── verification/   # Document verification
│   │   ├── audit/          # Audit logging
│   │   └── admin/          # Admin dashboard
│   ├── shared/             # Shared utilities
│   │   ├── constants/      # Constants
│   │   ├── errors/         # Custom errors
│   │   ├── utils/          # Utility functions
│   │   └── types/          # Type definitions
│   ├── services/           # Infrastructure services
│   │   ├── cache/          # Redis cache
│   │   ├── email/          # Email service
│   │   ├── logger/         # Winston logger
│   │   ├── pdf/            # PDF processing
│   │   └── storage/        # File storage
│   ├── database/           # Database layer
│   ├── routes/             # Route aggregation
│   ├── app.js              # Express setup
│   └── server.js           # Entry point
├── storage/                # File storage
├── logs/                   # Application logs
├── tests/                  # Test files
├── docker/                 # Docker files
└── scripts/                # Utility scripts
```

## 📚 API Documentation

### Base URL

```
http://localhost:5001/api/v1
```

### Endpoints

#### Health Check
- `GET /health` - Server health status

#### Authentication
- `POST /auth/register` - Register new user
- `POST /auth/login` - Login user
- `POST /auth/refresh` - Refresh access token
- `POST /auth/logout` - Logout user
- `POST /auth/forgot-password` - Request password reset
- `POST /auth/reset-password` - Reset password

#### Users
- `GET /users/me` - Get current user
- `PUT /users/me` - Update profile
- `PUT /users/password` - Change password
- `DELETE /users/me` - Delete account

#### Documents
- `POST /documents` - Upload document
- `GET /documents` - List documents
- `GET /documents/:id` - Get document
- `DELETE /documents/:id` - Delete document
- `GET /documents/:id/download` - Download document

#### Signatures
- `POST /signatures` - Create signature
- `GET /signatures` - List signatures
- `POST /signatures/apply` - Apply signature to document

#### Verification (Public)
- `GET /verification/:code` - Verify document

#### Admin
- `GET /admin/dashboard` - Dashboard stats
- `GET /admin/users` - List all users
- `GET /admin/documents` - List all documents

## 🧪 Testing

```bash
# Run all tests
npm test

# Run unit tests
npm run test:unit

# Run integration tests
npm run test:integration

# Watch mode
npm run test:watch
```

## 🚢 Deployment

### Environment Variables

Ensure all production environment variables are set:

```bash
NODE_ENV=production
JWT_SECRET=<strong-secret>
JWT_REFRESH_SECRET=<strong-secret>
MONGODB_URI=<production-mongodb-uri>
SMTP_USER=<email>
SMTP_PASSWORD=<password>
```

### Using Docker Compose

```bash
docker-compose -f docker/docker-compose.yml up -d
```

### Using PM2

```bash
npm install -g pm2
pm2 start src/server.js --name digital-signature-api
pm2 save
pm2 startup
```

## 🔒 Security

- All passwords hashed with bcrypt
- JWT token-based authentication
- Rate limiting on all endpoints
- Helmet.js for security headers
- CORS protection
- Input sanitization
- File upload validation
- Environment-based secrets

## 📝 Logging

Logs are stored in the `logs/` directory:

- `error/` - Error logs
- `combined/` - All logs
- `audit/` - Audit trail logs

## 🤝 Contributing

1. Follow the existing code style
2. Run linter before committing: `npm run lint:fix`
3. Format code: `npm run format`
4. Write tests for new features
5. Update documentation

## 📄 License

MIT

## 👥 Authors

Digital Platform Team

---

**Version**: 1.0.0  
**Last Updated**: 2026-06-21
