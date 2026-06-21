# 📊 Database Quick Reference Card

## 🚀 Setup Commands (Run Once)

```bash
# 1. Install Prisma
npm install prisma @prisma/client

# 2. Set DATABASE_URL in .env
echo 'DATABASE_URL="mongodb://admin:admin123@mongo:27017/digital-signature-platform?authSource=admin"' >> .env

# 3. Generate Prisma Client
npx prisma generate

# 4. Push schema to MongoDB
npx prisma db push

# 5. Seed database with test data
npm run prisma:seed

# 6. Open Prisma Studio (optional)
npx prisma studio
```

---

## 🗄️ Collections Overview

| Collection | Purpose | Key Fields |
|------------|---------|------------|
| **users** | User accounts | email, password, role |
| **documents** | PDF documents | title, fileName, status, verificationCode |
| **signatures** | Digital signatures | userId, documentId, signatureData, isReusable |
| **verifications** | Verification records | documentId, verificationCode, verifiedCount |
| **auditLogs** | Audit trail | userId, action, resource, metadata |
| **refreshTokens** | JWT refresh tokens | userId, token, expiresAt |
| **passwordResetTokens** | Reset tokens | userId, token, expiresAt, isUsed |

---

## 🔐 Default Login Credentials

```
Admin:
  Email: admin@digitalsignature.com
  Password: Admin@123456

Test Users:
  Email: john.doe@example.com
  Password: Test@123456

  Email: jane.smith@example.com
  Password: Test@123456
```

---

## 📝 Common Prisma Queries

### User Queries
```javascript
const prisma = require('./src/database/prisma.client');

// Find user by email
const user = await prisma.user.findUnique({
  where: { email: 'user@example.com', deletedAt: null }
});

// List all users
const users = await prisma.user.findMany({
  where: { deletedAt: null },
  orderBy: { createdAt: 'desc' }
});

// Update user
await prisma.user.update({
  where: { id: userId },
  data: { firstName: 'John' }
});

// Soft delete user
await prisma.user.update({
  where: { id: userId },
  data: { deletedAt: new Date() }
});
```

### Document Queries
```javascript
// Create document
const document = await prisma.document.create({
  data: {
    userId,
    title: 'My Document',
    fileName: 'doc123.pdf',
    filePath: '/storage/documents/original/doc123.pdf',
    fileSize: 100000,
    mimeType: 'application/pdf',
    verificationCode: 'VER-ABC123',
    status: 'UPLOADED',
  }
});

// List user's documents
const documents = await prisma.document.findMany({
  where: { userId, deletedAt: null },
  include: { user: true, signatures: true },
  orderBy: { createdAt: 'desc' }
});

// Find by verification code
const document = await prisma.document.findUnique({
  where: { verificationCode: 'VER-ABC123' }
});

// Update document status
await prisma.document.update({
  where: { id: documentId },
  data: { 
    status: 'SIGNED',
    signedAt: new Date(),
    signedFilePath: '/storage/documents/signed/doc123.pdf'
  }
});
```

### Signature Queries
```javascript
// Create reusable signature
const signature = await prisma.signature.create({
  data: {
    userId,
    name: 'My Signature',
    signatureData: 'base64imagedata...',
    isReusable: true,
    position: {
      page: 1,
      x: 100,
      y: 200,
      width: 150,
      height: 50
    }
  }
});

// Get user's reusable signatures
const signatures = await prisma.signature.findMany({
  where: { userId, isReusable: true, deletedAt: null }
});

// Apply signature to document
await prisma.signature.create({
  data: {
    userId,
    documentId,
    signatureData: 'base64imagedata...',
    isReusable: false,
    appliedAt: new Date(),
    position: { page: 1, x: 100, y: 200, width: 150, height: 50 }
  }
});
```

### Verification Queries
```javascript
// Create verification record
await prisma.verification.create({
  data: {
    documentId,
    verificationCode: 'VER-ABC123',
    verifiedCount: 0
  }
});

// Public verification (MOST IMPORTANT)
const verification = await prisma.verification.findUnique({
  where: { verificationCode: 'VER-ABC123' },
  include: {
    document: {
      include: {
        user: {
          select: { firstName: true, lastName: true }
        }
      }
    }
  }
});

// Increment verification count
await prisma.verification.update({
  where: { verificationCode: 'VER-ABC123' },
  data: {
    verifiedCount: { increment: 1 },
    lastVerifiedAt: new Date(),
    lastVerifiedBy: '192.168.1.1'
  }
});
```

### Audit Log Queries
```javascript
// Create audit log
await prisma.auditLog.create({
  data: {
    userId,
    action: 'DOCUMENT_UPLOAD',
    resource: 'DOCUMENT',
    resourceId: documentId,
    metadata: { fileName: 'doc.pdf' },
    ipAddress: '192.168.1.1',
    userAgent: 'Mozilla/5.0',
    success: true
  }
});

// Get user's audit trail
const logs = await prisma.auditLog.findMany({
  where: { userId },
  orderBy: { createdAt: 'desc' },
  take: 50
});

// Get document audit trail
const logs = await prisma.auditLog.findMany({
  where: { resource: 'DOCUMENT', resourceId: documentId },
  orderBy: { createdAt: 'desc' }
});
```

### Token Queries
```javascript
// Create refresh token
await prisma.refreshToken.create({
  data: {
    userId,
    token: 'abc123...',
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
  }
});

// Validate refresh token
const token = await prisma.refreshToken.findUnique({
  where: { token: 'abc123...', isRevoked: false }
});

// Revoke token
await prisma.refreshToken.update({
  where: { token: 'abc123...' },
  data: { isRevoked: true }
});

// Create password reset token
await prisma.passwordResetToken.create({
  data: {
    userId,
    token: 'reset-abc123...',
    expiresAt: new Date(Date.now() + 60 * 60 * 1000) // 1 hour
  }
});

// Mark reset token as used
await prisma.passwordResetToken.update({
  where: { token: 'reset-abc123...' },
  data: { isUsed: true, usedAt: new Date() }
});
```

---

## 🔍 Advanced Queries

### Pagination
```javascript
const page = 1;
const limit = 20;

const [documents, total] = await Promise.all([
  prisma.document.findMany({
    where: { userId, deletedAt: null },
    skip: (page - 1) * limit,
    take: limit,
    orderBy: { createdAt: 'desc' }
  }),
  prisma.document.count({
    where: { userId, deletedAt: null }
  })
]);

return {
  data: documents,
  pagination: {
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit)
  }
};
```

### Transactions
```javascript
// Create document with verification
const result = await prisma.$transaction(async (tx) => {
  const document = await tx.document.create({
    data: documentData
  });

  const verification = await tx.verification.create({
    data: {
      documentId: document.id,
      verificationCode: generateCode()
    }
  });

  return { document, verification };
});
```

### Aggregations
```javascript
// Count documents by status
const stats = await prisma.document.groupBy({
  by: ['status'],
  where: { userId, deletedAt: null },
  _count: true
});

// Result: [{ status: 'UPLOADED', _count: 5 }, { status: 'SIGNED', _count: 3 }]
```

---

## 🛠️ Useful Commands

```bash
# Generate Prisma Client
npx prisma generate

# Push schema to MongoDB
npx prisma db push

# Open Prisma Studio
npx prisma studio

# Seed database
npm run prisma:seed

# Format schema file
npx prisma format

# Validate schema
npx prisma validate
```

---

## 📚 File Locations

```
server/
├── prisma/
│   ├── schema.prisma          ← Prisma schema definition
│   └── seed.js                ← Database seeding script
├── src/
│   └── database/
│       └── prisma.client.js   ← Prisma client singleton
├── DATABASE_DESIGN.md         ← Complete design documentation
├── REPOSITORY_PATTERN.md      ← Repository pattern guide
├── PRISMA_SETUP.md            ← Setup and usage guide
└── DATABASE_SETUP_COMPLETE.md ← Setup summary
```

---

## ⚡ Performance Tips

1. **Always use indexes** - All frequent queries should have indexes
2. **Use select** - Only fetch fields you need
3. **Paginate results** - Never fetch all records at once
4. **Cache frequently accessed data** - Use Redis for hot data
5. **Use transactions** - For operations that must be atomic

---

## 🐛 Troubleshooting

### Prisma Client Not Found
```bash
npx prisma generate
```

### Schema Out of Sync
```bash
npx prisma db push
```

### Connection Failed
```bash
# Check MongoDB is running
docker ps | grep mongo

# Test connection
mongosh "mongodb://admin:admin123@localhost:27017/digital-signature-platform?authSource=admin"
```

### Indexes Missing
```bash
# Re-push schema
npx prisma db push --force-reset
```

---

## 📖 Documentation Links

- [Prisma MongoDB Docs](https://www.prisma.io/docs/concepts/database-connectors/mongodb)
- [Prisma Client API](https://www.prisma.io/docs/reference/api-reference/prisma-client-reference)
- [MongoDB Docs](https://docs.mongodb.com/)

---

**Quick Reference Version**: 1.0.0  
**Last Updated**: 2026-06-21
