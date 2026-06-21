# Prisma Setup & Migration Strategy

## 📋 Overview

This guide covers the complete setup and usage of Prisma with MongoDB for the Digital Signature Platform.

---

## 🚀 Quick Start

```bash
# 1. Install Prisma
npm install prisma @prisma/client

# 2. Initialize Prisma (already done)
# prisma init

# 3. Set DATABASE_URL in .env
DATABASE_URL="mongodb://admin:admin123@localhost:27017/digital-signature-platform?authSource=admin"

# 4. Generate Prisma Client
npx prisma generate

# 5. Push schema to MongoDB
npx prisma db push

# 6. Open Prisma Studio (optional)
npx prisma studio
```

---

## 📦 Installation

### 1. Install Dependencies

```bash
# Prisma CLI (dev dependency)
npm install -D prisma

# Prisma Client (production dependency)
npm install @prisma/client
```

### 2. Update package.json

Add these scripts:

```json
{
  "scripts": {
    "prisma:generate": "prisma generate",
    "prisma:push": "prisma db push",
    "prisma:studio": "prisma studio",
    "prisma:seed": "node prisma/seed.js",
    "postinstall": "prisma generate"
  }
}
```

---

## ⚙️ Configuration

### 1. Environment Variables

Create `.env` file:

```env
# MongoDB Connection String
DATABASE_URL="mongodb://admin:admin123@localhost:27017/digital-signature-platform?authSource=admin"

# For Docker
DATABASE_URL="mongodb://admin:admin123@mongo:27017/digital-signature-platform?authSource=admin"
```

### 2. Prisma Schema

Located at `prisma/schema.prisma` (already created).

Key configurations:
- **Provider**: `mongodb`
- **Generator**: `prisma-client-js`
- **Collections**: 7 models
- **Indexes**: Optimized for query patterns

---

## 🔄 MongoDB with Prisma

### Key Differences from SQL Databases

| Feature | SQL (PostgreSQL/MySQL) | MongoDB with Prisma |
|---------|----------------------|---------------------|
| Migrations | `prisma migrate dev` | Not supported |
| Schema Sync | `prisma migrate` | `prisma db push` |
| Foreign Keys | Native support | References only |
| Transactions | Full ACID | Limited support |
| Auto-increment | Yes | No (use ObjectId) |

### MongoDB Limitations

❌ No migration files  
❌ No migration history  
❌ No rollback support  
❌ Limited transaction support  

✅ Flexible schema  
✅ Fast development  
✅ Easy schema changes  
✅ No migration conflicts  

---

## 📝 Schema Management

### Development Workflow

```bash
# 1. Edit schema.prisma
vim prisma/schema.prisma

# 2. Generate Prisma Client
npx prisma generate

# 3. Push schema to MongoDB
npx prisma db push

# 4. Test changes
npm run dev
```

### Production Deployment

```bash
# 1. Ensure schema is tested
npm run test

# 2. Generate Prisma Client
npx prisma generate

# 3. Push to production database
NODE_ENV=production npx prisma db push

# 4. Verify indexes
# Check MongoDB indexes match schema
```

---

## 🗄️ Database Push Strategy

### `npx prisma db push`

**What it does:**
1. Reads `schema.prisma`
2. Compares with MongoDB schema
3. Applies changes directly
4. Creates/updates indexes
5. No migration files created

**When to use:**
- ✅ Development
- ✅ Prototyping
- ✅ Quick schema changes
- ✅ MongoDB projects

**When NOT to use:**
- ❌ If you need migration history
- ❌ If you need rollback support
- ❌ If multiple developers need sync

### Best Practices

```bash
# Always generate client after schema changes
npx prisma generate

# Always push to database
npx prisma db push

# Verify in Prisma Studio
npx prisma studio

# Test the changes
npm run dev
```

---

## 🌱 Database Seeding

### Create Seed File

Create `prisma/seed.js`:

```javascript
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create admin user
  const hashedPassword = await bcrypt.hash('Admin@123456', 10);
  
  const admin = await prisma.user.upsert({
    where: { email: 'admin@digitalsignature.com' },
    update: {},
    create: {
      email: 'admin@digitalsignature.com',
      password: hashedPassword,
      firstName: 'System',
      lastName: 'Administrator',
      role: 'ADMIN',
      isEmailVerified: true,
      isActive: true,
    },
  });

  console.log('✅ Admin user created:', admin.email);

  // Create test user
  const testUserPassword = await bcrypt.hash('Test@123456', 10);
  
  const testUser = await prisma.user.upsert({
    where: { email: 'test@example.com' },
    update: {},
    create: {
      email: 'test@example.com',
      password: testUserPassword,
      firstName: 'Test',
      lastName: 'User',
      role: 'USER',
      isEmailVerified: true,
      isActive: true,
    },
  });

  console.log('✅ Test user created:', testUser.email);

  console.log('🎉 Seeding completed!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
```

### Run Seed

```bash
# Add to package.json
{
  "prisma": {
    "seed": "node prisma/seed.js"
  }
}

# Run seed
npx prisma db seed

# Or manually
node prisma/seed.js
```

---

## 🔍 Prisma Studio

### Launch Studio

```bash
npx prisma studio
```

Opens at `http://localhost:5555`

**Features:**
- Visual database browser
- Edit data directly
- Filter and search
- Relationship navigation
- Query builder

**Use cases:**
- Development debugging
- Quick data inspection
- Manual data fixes
- Testing relationships

---

## 📊 Prisma Client Usage

### Initialize Client

```javascript
// src/database/prisma.client.js
const { PrismaClient } = require('@prisma/client');
const logger = require('../services/logger/logger.service');

const prisma = new PrismaClient({
  log: [
    { level: 'query', emit: 'event' },
    { level: 'error', emit: 'stdout' },
    { level: 'warn', emit: 'stdout' },
  ],
});

// Log all queries in development
if (process.env.NODE_ENV === 'development') {
  prisma.$on('query', (e) => {
    logger.debug('Prisma Query', {
      query: e.query,
      params: e.params,
      duration: `${e.duration}ms`,
    });
  });
}

module.exports = prisma;
```

### Basic CRUD Operations

```javascript
// CREATE
const user = await prisma.user.create({
  data: {
    email: 'user@example.com',
    password: hashedPassword,
    firstName: 'John',
    lastName: 'Doe',
  },
});

// READ
const user = await prisma.user.findUnique({
  where: { id: userId },
});

const users = await prisma.user.findMany({
  where: { role: 'USER', deletedAt: null },
  orderBy: { createdAt: 'desc' },
  take: 20,
});

// UPDATE
const updated = await prisma.user.update({
  where: { id: userId },
  data: { firstName: 'Jane' },
});

// DELETE (soft)
const deleted = await prisma.user.update({
  where: { id: userId },
  data: { deletedAt: new Date() },
});

// DELETE (hard)
const deleted = await prisma.user.delete({
  where: { id: userId },
});
```

### Advanced Queries

```javascript
// Include relationships
const document = await prisma.document.findUnique({
  where: { id: documentId },
  include: {
    user: {
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
      },
    },
    signatures: true,
    verification: true,
  },
});

// Filter with AND/OR
const documents = await prisma.document.findMany({
  where: {
    AND: [
      { userId: userId },
      { status: 'SIGNED' },
      { deletedAt: null },
    ],
  },
});

// Pagination
const documents = await prisma.document.findMany({
  where: { userId, deletedAt: null },
  skip: (page - 1) * limit,
  take: limit,
  orderBy: { createdAt: 'desc' },
});

// Count
const count = await prisma.document.count({
  where: { userId, deletedAt: null },
});

// Aggregation
const stats = await prisma.document.groupBy({
  by: ['status'],
  where: { userId, deletedAt: null },
  _count: true,
});
```

### Transactions

```javascript
// Simple transaction
const result = await prisma.$transaction(async (tx) => {
  const document = await tx.document.create({
    data: documentData,
  });

  const verification = await tx.verification.create({
    data: {
      documentId: document.id,
      verificationCode: generateCode(),
    },
  });

  return { document, verification };
});

// Multiple operations
await prisma.$transaction([
  prisma.user.update({ where: { id: 1 }, data: { isActive: false } }),
  prisma.refreshToken.deleteMany({ where: { userId: 1 } }),
  prisma.auditLog.create({ data: { action: 'USER_DEACTIVATE', userId: 1 } }),
]);
```

---

## 🔐 Index Management

### View Indexes

```javascript
// MongoDB shell
use digital-signature-platform
db.users.getIndexes()
db.documents.getIndexes()
```

### Prisma Index Syntax

```prisma
model User {
  id    String @id @default(auto()) @map("_id") @db.ObjectId
  email String @unique

  @@index([email])
  @@index([role])
  @@index([isActive])
  @@map("users")
}
```

### Create Index Manually

```javascript
// If Prisma doesn't create correctly
db.documents.createIndex(
  { userId: 1, status: 1, createdAt: -1 },
  { name: 'idx_user_status_date' }
);
```

---

## 🚨 Common Issues & Solutions

### Issue 1: ObjectId vs String

**Problem**: Prisma uses String for MongoDB ObjectId

**Solution**: Always use `@db.ObjectId` attribute

```prisma
model Document {
  id     String @id @default(auto()) @map("_id") @db.ObjectId
  userId String @db.ObjectId  // ← Important!
}
```

### Issue 2: Missing Indexes

**Problem**: Indexes not created after push

**Solution**: Drop collection and re-push

```bash
# MongoDB shell
db.users.drop()

# Re-push
npx prisma db push
```

### Issue 3: Connection Issues

**Problem**: Can't connect to MongoDB

**Solution**: Check connection string

```env
# Local
DATABASE_URL="mongodb://localhost:27017/database"

# Docker
DATABASE_URL="mongodb://mongo:27017/database"

# With auth
DATABASE_URL="mongodb://user:pass@host:27017/database?authSource=admin"
```

### Issue 4: Schema Out of Sync

**Problem**: Schema changes not reflected

**Solution**: Regenerate client

```bash
npx prisma generate
npx prisma db push
```

---

## 📋 Development Checklist

### Initial Setup
- [ ] Install Prisma dependencies
- [ ] Configure DATABASE_URL
- [ ] Run `prisma generate`
- [ ] Run `prisma db push`
- [ ] Verify indexes in MongoDB
- [ ] Test connection with Prisma Studio

### Before Each Schema Change
- [ ] Backup production database
- [ ] Test changes locally
- [ ] Update schema.prisma
- [ ] Run `prisma generate`
- [ ] Run `prisma db push`
- [ ] Verify indexes
- [ ] Test affected queries

### Production Deployment
- [ ] Test schema changes in staging
- [ ] Backup production database
- [ ] Run `prisma generate` in CI/CD
- [ ] Run `prisma db push` in production
- [ ] Verify indexes created
- [ ] Monitor application logs
- [ ] Run smoke tests

---

## 🔄 Migration Alternative

Since MongoDB with Prisma doesn't support migrations, here's an alternative approach:

### Version-Controlled Schema Changes

```javascript
// scripts/schema-versions/v1.0.0.js
module.exports = {
  version: '1.0.0',
  description: 'Initial schema',
  up: async (prisma) => {
    // Create indexes manually if needed
    await prisma.$runCommandRaw({
      createIndexes: 'users',
      indexes: [
        { key: { email: 1 }, name: 'email_unique', unique: true },
      ],
    });
  },
  down: async (prisma) => {
    // Rollback if needed
  },
};

// scripts/run-schema-version.js
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const version = require('./schema-versions/v1.0.0');

async function run() {
  await version.up(prisma);
  console.log(`✅ Applied schema version ${version.version}`);
}

run();
```

---

## 📚 Additional Resources

- [Prisma MongoDB Docs](https://www.prisma.io/docs/concepts/database-connectors/mongodb)
- [Prisma Client API](https://www.prisma.io/docs/reference/api-reference/prisma-client-reference)
- [MongoDB Indexes](https://docs.mongodb.com/manual/indexes/)
- [Prisma Best Practices](https://www.prisma.io/docs/guides/performance-and-optimization)

---

**Prisma Setup Version**: 1.0.0  
**Last Updated**: 2026-06-21  
**Status**: ✅ Ready for Use
