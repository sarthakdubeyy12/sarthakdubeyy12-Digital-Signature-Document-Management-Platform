# MongoDB Database Design - Digital Signature Platform

## 📋 Table of Contents
1. [Overview](#overview)
2. [Design Principles](#design-principles)
3. [Collections](#collections)
4. [Relationships](#relationships)
5. [ER Diagram](#er-diagram)
6. [Index Strategy](#index-strategy)
7. [Data Access Patterns](#data-access-patterns)
8. [Soft Delete Strategy](#soft-delete-strategy)

---

## 🎯 Overview

### Database: MongoDB
### ORM: Prisma
### Total Collections: 7

| Collection | Purpose | Relationships |
|------------|---------|---------------|
| User | User accounts and authentication | → Documents, Signatures, RefreshTokens, AuditLogs |
| Document | PDF documents uploaded by users | → User, Signature, Verification |
| Signature | Digital signatures (reusable & applied) | → User, Document |
| Verification | Public verification records | → Document |
| AuditLog | Audit trail of all actions | → User |
| RefreshToken | JWT refresh tokens | → User |
| PasswordResetToken | Password reset tokens | → User |

---

## 🏗️ Design Principles

### 1. **Referencing vs Embedding Decision Matrix**

| Scenario | Strategy | Reason |
|----------|----------|--------|
| User → Documents | **Reference** | One-to-Many, documents can grow unbounded |
| User → Signatures | **Reference** | One-to-Many, independent lifecycle |
| Document → Verification | **Reference** | One-to-One, but verification is optional |
| Document Metadata | **Embed** | Small, fixed-size data that belongs to document |
| Signature Position | **Embed** | Small, fixed-size data that belongs to signature |
| AuditLog Metadata | **Embed** | Flexible data that varies by action type |

### 2. **Optimization for Read-Heavy Operations**

- **Dashboard Queries**: Indexed by userId, status, createdAt
- **Verification Lookup**: Indexed by verificationCode (unique)
- **Auth Operations**: Indexed by email (unique), refreshToken (unique)
- **Audit Trail**: Indexed by userId, action, resource, createdAt

### 3. **Scalability Considerations**

- **Avoid Document Growth**: No unbounded arrays
- **Proper Indexing**: Query patterns analyzed first
- **Soft Deletes**: Maintain data integrity without hard deletes
- **Audit Trail**: Separate collection, not embedded

### 4. **MongoDB Best Practices Applied**

✅ ObjectId for relationships  
✅ No deeply nested documents (max 2 levels)  
✅ Indexes on foreign keys  
✅ Compound indexes for common queries  
✅ TTL indexes for token expiration  

---

## 📦 Collections

### 1. **User Collection**

```javascript
{
  _id: ObjectId,
  email: String (unique, indexed),
  password: String (hashed with bcrypt),
  firstName: String,
  lastName: String,
  role: Enum('USER', 'ADMIN'),
  isEmailVerified: Boolean,
  isActive: Boolean,
  profilePicture: String (URL, nullable),
  createdAt: DateTime,
  updatedAt: DateTime,
  deletedAt: DateTime (nullable, soft delete)
}
```

**Relationships:**
- One-to-Many: → Documents
- One-to-Many: → Signatures
- One-to-Many: → RefreshTokens
- One-to-Many: → AuditLogs
- One-to-Many: → PasswordResetTokens

**Indexes:**
- `email` (unique)
- `role`
- `isActive`
- `deletedAt`
- `createdAt`

**Design Decisions:**
- ✅ **Reference** for all relationships (avoid unbounded arrays)
- ✅ Password hashed before storage (application layer)
- ✅ Email verification flag for future email verification flow
- ✅ Soft delete support with deletedAt
- ✅ Role-based access control (USER, ADMIN)

---

### 2. **Document Collection**

```javascript
{
  _id: ObjectId,
  userId: ObjectId (ref: User, indexed),
  title: String,
  originalName: String,
  fileName: String (unique storage identifier),
  filePath: String,
  fileSize: Number (bytes),
  mimeType: String,
  status: Enum('UPLOADED', 'SIGNING', 'SIGNED', 'FAILED'),
  verificationCode: String (unique, indexed),
  signedFilePath: String (nullable),
  signedAt: DateTime (nullable),
  metadata: {
    pageCount: Number,
    width: Number,
    height: Number
  },
  createdAt: DateTime,
  updatedAt: DateTime,
  deletedAt: DateTime (nullable)
}
```

**Relationships:**
- Many-to-One: User ← Document
- One-to-Many: Document → Signatures
- One-to-One: Document → Verification (optional)

**Indexes:**
- `userId` (for user's document list)
- `verificationCode` (unique, for public verification)
- `status` (for filtering by status)
- `createdAt` (for sorting)
- Compound: `(userId, status, createdAt)` (dashboard queries)
- `deletedAt`

**Design Decisions:**
- ✅ **Embedded metadata**: Small, fixed-size, belongs to document
- ✅ **Reference to User**: Documents can grow unbounded per user
- ✅ Unique verification code for public lookup
- ✅ Status tracking for workflow management
- ✅ Separate signed file path (original preserved)

---

### 3. **Signature Collection**

```javascript
{
  _id: ObjectId,
  userId: ObjectId (ref: User, indexed),
  documentId: ObjectId (ref: Document, indexed, nullable),
  name: String,
  signatureData: String (base64 image or path),
  isReusable: Boolean,
  position: {
    page: Number,
    x: Number,
    y: Number,
    width: Number,
    height: Number
  },
  appliedAt: DateTime (nullable),
  createdAt: DateTime,
  updatedAt: DateTime,
  deletedAt: DateTime (nullable)
}
```

**Relationships:**
- Many-to-One: User ← Signature
- Many-to-One: Document ← Signature (optional)

**Indexes:**
- `userId` (for user's signatures)
- `documentId` (for document's signatures)
- `isReusable` (for filtering reusable signatures)
- `createdAt`
- Compound: `(userId, isReusable)`
- `deletedAt`

**Design Decisions:**
- ✅ **Embedded position**: Small, fixed-size data
- ✅ **Reference to User and Document**: Independent lifecycle
- ✅ Support for reusable signatures (documentId null)
- ✅ Support for applied signatures (documentId set)
- ✅ Flexible signatureData (can be base64 or file path)

---

### 4. **Verification Collection**

```javascript
{
  _id: ObjectId,
  documentId: ObjectId (ref: Document, unique, indexed),
  verificationCode: String (unique, indexed),
  verifiedCount: Number (default: 0),
  lastVerifiedAt: DateTime (nullable),
  lastVerifiedBy: String (IP address, nullable),
  metadata: {
    userAgent: String,
    ipAddress: String
  },
  createdAt: DateTime,
  updatedAt: DateTime
}
```

**Relationships:**
- One-to-One: Document ← Verification

**Indexes:**
- `documentId` (unique)
- `verificationCode` (unique, for public lookup)
- `createdAt`

**Design Decisions:**
- ✅ **One-to-One** with Document (each document has one verification record)
- ✅ Tracks verification attempts
- ✅ **Embedded metadata**: Flexible data per verification
- ✅ Public lookup optimized with unique index on verificationCode
- ✅ No soft delete (verification records are permanent)

---

### 5. **AuditLog Collection**

```javascript
{
  _id: ObjectId,
  userId: ObjectId (ref: User, indexed, nullable),
  action: String (indexed),
  resource: String (indexed),
  resourceId: ObjectId (nullable),
  metadata: Object (flexible JSON),
  ipAddress: String,
  userAgent: String,
  success: Boolean,
  errorMessage: String (nullable),
  createdAt: DateTime
}
```

**Relationships:**
- Many-to-One: User ← AuditLog (optional, some actions are anonymous)

**Indexes:**
- `userId` (for user's audit trail)
- `action` (for filtering by action type)
- `resource` (for filtering by resource)
- `createdAt` (for time-based queries)
- Compound: `(userId, action, createdAt)`
- Compound: `(resource, resourceId, createdAt)`

**Design Decisions:**
- ✅ **Embedded metadata**: Flexible data that varies by action
- ✅ **Reference to User**: Audit logs grow unbounded
- ✅ Support for anonymous actions (userId nullable)
- ✅ Track both success and failure
- ✅ No soft delete (audit logs are permanent)
- ✅ No updatedAt (audit logs are immutable)

---

### 6. **RefreshToken Collection**

```javascript
{
  _id: ObjectId,
  userId: ObjectId (ref: User, indexed),
  token: String (unique, indexed),
  expiresAt: DateTime (TTL indexed),
  isRevoked: Boolean,
  createdAt: DateTime
}
```

**Relationships:**
- Many-to-One: User ← RefreshToken

**Indexes:**
- `userId` (for user's tokens)
- `token` (unique, for lookup)
- `expiresAt` (TTL index - auto delete expired tokens)
- Compound: `(userId, isRevoked)`

**Design Decisions:**
- ✅ **Reference to User**: Tokens are independent
- ✅ TTL index for automatic cleanup
- ✅ Revocation support without deletion
- ✅ No soft delete (hard delete after expiration)
- ✅ No updatedAt (tokens are immutable)

---

### 7. **PasswordResetToken Collection**

```javascript
{
  _id: ObjectId,
  userId: ObjectId (ref: User, indexed),
  token: String (unique, indexed),
  expiresAt: DateTime (TTL indexed),
  isUsed: Boolean,
  usedAt: DateTime (nullable),
  createdAt: DateTime
}
```

**Relationships:**
- Many-to-One: User ← PasswordResetToken

**Indexes:**
- `userId` (for user's reset tokens)
- `token` (unique, for lookup)
- `expiresAt` (TTL index)
- Compound: `(userId, isUsed)`

**Design Decisions:**
- ✅ **Reference to User**: Tokens are independent
- ✅ TTL index for automatic cleanup
- ✅ One-time use tracking
- ✅ No soft delete (hard delete after expiration)
- ✅ No updatedAt (tokens are immutable)

---

## 🔗 Relationships

### Relationship Matrix

| From | To | Type | Strategy | Reason |
|------|----|----|----------|--------|
| User | Document | 1:N | Reference | Documents grow unbounded |
| User | Signature | 1:N | Reference | Signatures grow unbounded |
| User | RefreshToken | 1:N | Reference | Tokens grow unbounded |
| User | PasswordResetToken | 1:N | Reference | Tokens grow unbounded |
| User | AuditLog | 1:N | Reference | Logs grow unbounded |
| Document | Signature | 1:N | Reference | Multiple signatures per document |
| Document | Verification | 1:1 | Reference | Optional, independent lifecycle |
| Document | User | N:1 | Reference | Owner relationship |
| Signature | User | N:1 | Reference | Creator relationship |
| Signature | Document | N:1 | Reference (optional) | Applied signature relationship |

### Why References Over Embedding?

**Decision Criteria:**
1. **Unbounded Growth**: If child documents can grow infinitely → Reference
2. **Independent Lifecycle**: If child has its own CRUD operations → Reference
3. **Query Patterns**: If frequently queried separately → Reference
4. **Document Size**: If could exceed 16MB limit → Reference

**Examples:**
- ✅ User has many Documents → **Reference** (can have 1000s of documents)
- ✅ Document has metadata → **Embed** (fixed size, always loaded together)
- ✅ Signature has position → **Embed** (small, always loaded together)

---

## 📊 ER Diagram (MongoDB Style)

```
┌─────────────────────────────────────────────────────────────┐
│                          USER                                │
│  _id: ObjectId (PK)                                         │
│  email: String (unique)                                      │
│  password: String (hashed)                                   │
│  firstName: String                                           │
│  lastName: String                                            │
│  role: Enum                                                  │
│  isEmailVerified: Boolean                                    │
│  isActive: Boolean                                           │
│  profilePicture: String?                                     │
│  createdAt, updatedAt, deletedAt?                           │
└────────────┬──────────────┬───────────────┬────────────────┘
             │              │               │
             │ 1:N          │ 1:N           │ 1:N
             ▼              ▼               ▼
┌────────────────────┐  ┌──────────────┐  ┌─────────────────┐
│     DOCUMENT       │  │  SIGNATURE   │  │  REFRESH TOKEN  │
│  _id: ObjectId(PK) │  │ _id: OID(PK) │  │  _id: OID (PK)  │
│  userId: OID (FK)  │  │ userId: OID  │  │  userId: OID(FK)│
│  title: String     │  │ documentId?  │  │  token: String  │
│  fileName: String  │  │ name: String │  │  expiresAt: Date│
│  filePath: String  │  │ signatureData│  │  isRevoked: Bool│
│  status: Enum      │  │ isReusable   │  │  createdAt      │
│  verificationCode  │  │ position: {} │  └─────────────────┘
│  signedAt?         │  │ appliedAt?   │
│  metadata: {}      │  │ createdAt    │
│  createdAt, ...    │  └──────────────┘
└────────┬───────────┘
         │ 1:1
         ▼
┌────────────────────────┐
│    VERIFICATION        │
│  _id: ObjectId (PK)    │
│  documentId: OID (FK)  │
│  verificationCode: Str │
│  verifiedCount: Number │
│  lastVerifiedAt: Date? │
│  lastVerifiedBy: Str?  │
│  metadata: {}          │
│  createdAt, updatedAt  │
└────────────────────────┘

         User 1:N
         │
         ▼
┌──────────────────────────┐
│      AUDIT LOG           │
│  _id: ObjectId (PK)      │
│  userId: OID (FK)?       │
│  action: String          │
│  resource: String        │
│  resourceId: OID?        │
│  metadata: {}            │
│  ipAddress: String       │
│  userAgent: String       │
│  success: Boolean        │
│  errorMessage: String?   │
│  createdAt               │
└──────────────────────────┘

         User 1:N
         │
         ▼
┌─────────────────────────────┐
│  PASSWORD RESET TOKEN       │
│  _id: ObjectId (PK)         │
│  userId: OID (FK)           │
│  token: String (unique)     │
│  expiresAt: DateTime        │
│  isUsed: Boolean            │
│  usedAt: DateTime?          │
│  createdAt                  │
└─────────────────────────────┘
```

---

## 📇 Index Strategy

### User Collection Indexes

```javascript
// Unique index on email for authentication
{ email: 1 } UNIQUE

// Filter by role (admin dashboard)
{ role: 1 }

// Filter active users
{ isActive: 1 }

// Soft delete support
{ deletedAt: 1 }

// Sort by creation date
{ createdAt: -1 }
```

### Document Collection Indexes

```javascript
// User's documents list
{ userId: 1, createdAt: -1 }

// Unique verification code for public lookup
{ verificationCode: 1 } UNIQUE

// Filter by status
{ status: 1 }

// Dashboard query optimization
{ userId: 1, status: 1, createdAt: -1 } COMPOUND

// Soft delete support
{ deletedAt: 1 }
```

### Signature Collection Indexes

```javascript
// User's signatures
{ userId: 1, createdAt: -1 }

// Document's signatures
{ documentId: 1 }

// Filter reusable signatures
{ userId: 1, isReusable: 1 } COMPOUND

// Soft delete support
{ deletedAt: 1 }
```

### Verification Collection Indexes

```javascript
// One verification per document
{ documentId: 1 } UNIQUE

// Public verification lookup (most important!)
{ verificationCode: 1 } UNIQUE

// Sort by creation
{ createdAt: -1 }
```

### AuditLog Collection Indexes

```javascript
// User's audit trail
{ userId: 1, createdAt: -1 }

// Filter by action type
{ action: 1 }

// Filter by resource type
{ resource: 1 }

// Complex audit queries
{ userId: 1, action: 1, createdAt: -1 } COMPOUND

// Resource audit trail
{ resource: 1, resourceId: 1, createdAt: -1 } COMPOUND
```

### RefreshToken Collection Indexes

```javascript
// Token lookup for authentication
{ token: 1 } UNIQUE

// User's tokens
{ userId: 1, isRevoked: 1 } COMPOUND

// TTL index for automatic cleanup
{ expiresAt: 1 } TTL
```

### PasswordResetToken Collection Indexes

```javascript
// Token lookup
{ token: 1 } UNIQUE

// User's reset tokens
{ userId: 1, isUsed: 1 } COMPOUND

// TTL index for automatic cleanup
{ expiresAt: 1 } TTL
```

---

## 🔍 Data Access Patterns

### 1. **Authentication Flow**

```javascript
// Login: Find user by email
db.users.findOne({ email, deletedAt: null })
// Index used: { email: 1 }

// Refresh token validation
db.refreshTokens.findOne({ token, isRevoked: false })
// Index used: { token: 1 }

// Create refresh token
db.refreshTokens.insertOne({ userId, token, expiresAt })
```

### 2. **Document Upload Flow**

```javascript
// Create document
db.documents.insertOne({ userId, title, fileName, ... })

// List user's documents (dashboard)
db.documents.find({ 
  userId, 
  deletedAt: null 
}).sort({ createdAt: -1 }).limit(20)
// Index used: { userId: 1, createdAt: -1 }

// Filter by status
db.documents.find({ 
  userId, 
  status: 'SIGNED', 
  deletedAt: null 
}).sort({ createdAt: -1 })
// Index used: { userId: 1, status: 1, createdAt: -1 }
```

### 3. **Signature Flow**

```javascript
// Get user's reusable signatures
db.signatures.find({ 
  userId, 
  isReusable: true, 
  deletedAt: null 
})
// Index used: { userId: 1, isReusable: 1 }

// Apply signature to document
db.signatures.insertOne({ 
  userId, 
  documentId, 
  position, 
  appliedAt: new Date() 
})

// Update document status
db.documents.updateOne({ _id: documentId }, { 
  status: 'SIGNED', 
  signedAt: new Date() 
})
```

### 4. **Public Verification Flow**

```javascript
// Verify document (PUBLIC - most critical query!)
db.verifications.findOne({ verificationCode })
// Index used: { verificationCode: 1 } UNIQUE

// Increment verification count
db.verifications.updateOne(
  { verificationCode },
  { 
    $inc: { verifiedCount: 1 },
    $set: { lastVerifiedAt: new Date(), lastVerifiedBy: ipAddress }
  }
)
```

### 5. **Audit Trail Queries**

```javascript
// User's audit log
db.auditLogs.find({ userId }).sort({ createdAt: -1 }).limit(50)
// Index used: { userId: 1, createdAt: -1 }

// Document audit trail
db.auditLogs.find({ 
  resource: 'document', 
  resourceId: documentId 
}).sort({ createdAt: -1 })
// Index used: { resource: 1, resourceId: 1, createdAt: -1 }

// System-wide action audit
db.auditLogs.find({ action: 'DOCUMENT_SIGN' }).sort({ createdAt: -1 })
// Index used: { action: 1 }
```

### 6. **Admin Dashboard Queries**

```javascript
// Total users count
db.users.countDocuments({ deletedAt: null })

// Total documents by status
db.documents.aggregate([
  { $match: { deletedAt: null } },
  { $group: { _id: '$status', count: { $sum: 1 } } }
])

// Recent activity
db.auditLogs.find().sort({ createdAt: -1 }).limit(100)
// Index used: { createdAt: -1 }

// Active users (with documents)
db.documents.aggregate([
  { $match: { deletedAt: null } },
  { $group: { _id: '$userId', docCount: { $sum: 1 } } },
  { $sort: { docCount: -1 } }
])
```

---

## 🗑️ Soft Delete Strategy

### Implementation

**Collections with Soft Delete:**
- User
- Document
- Signature

**Collections without Soft Delete:**
- Verification (permanent records)
- AuditLog (permanent audit trail)
- RefreshToken (TTL auto-delete)
- PasswordResetToken (TTL auto-delete)

### Global Filtering Approach

```javascript
// All queries must include deletedAt filter
const query = { 
  userId: req.user.id,
  deletedAt: null  // ← Always include
};
```

### Repository Pattern Example

```javascript
class DocumentRepository {
  async findByUser(userId) {
    return await Document.find({ 
      userId, 
      deletedAt: null  // Global filter
    });
  }
  
  async softDelete(documentId) {
    return await Document.updateOne(
      { _id: documentId },
      { deletedAt: new Date() }
    );
  }
  
  async hardDelete(documentId) {
    // Only for admin operations
    return await Document.deleteOne({ _id: documentId });
  }
  
  async restore(documentId) {
    return await Document.updateOne(
      { _id: documentId },
      { deletedAt: null }
    );
  }
}
```

### Benefits

✅ **Data Recovery**: Can restore accidentally deleted records  
✅ **Audit Compliance**: Maintains complete history  
✅ **Referential Integrity**: Related records remain intact  
✅ **Legal Requirements**: Meets data retention policies  

---

## 📈 Scalability Considerations

### 1. **Pagination Strategy**

```javascript
// Cursor-based pagination (recommended)
const documents = await Document.find({
  userId,
  _id: { $gt: lastDocumentId },
  deletedAt: null
})
.sort({ _id: 1 })
.limit(20);

// Offset-based pagination (simpler, less efficient at scale)
const documents = await Document.find({ userId, deletedAt: null })
  .skip(page * limit)
  .limit(limit)
  .sort({ createdAt: -1 });
```

### 2. **Caching Strategy**

```javascript
// Redis cache for frequently accessed data
- User profile: TTL 15 minutes
- Document list: TTL 5 minutes (invalidate on create/update/delete)
- Verification lookup: TTL 1 hour (rarely changes)
- Dashboard stats: TTL 1 hour
```

### 3. **Sharding Preparation**

**Shard Key Candidates:**
- Users: `{ email: "hashed" }`
- Documents: `{ userId: "hashed" }` or `{ _id: "hashed" }`
- AuditLogs: `{ createdAt: 1 }` (time-based)

### 4. **Archive Strategy**

```javascript
// Archive old audit logs (> 1 year)
// Move to separate collection: auditLogs_archive
db.auditLogs.aggregate([
  { $match: { createdAt: { $lt: oneYearAgo } } },
  { $out: "auditLogs_archive" }
]);

db.auditLogs.deleteMany({ createdAt: { $lt: oneYearAgo } });
```

---

## ✅ Design Validation

### Query Performance Checklist

- [x] All frequent queries have indexes
- [x] Compound indexes for common filter combinations
- [x] Unique indexes for business constraints
- [x] TTL indexes for automatic cleanup
- [x] Soft delete fields indexed
- [x] Foreign key fields indexed

### Scalability Checklist

- [x] No unbounded arrays
- [x] Document size < 16MB limit
- [x] Proper referencing strategy
- [x] Pagination support
- [x] Caching strategy defined
- [x] Archive strategy for old data

### Security Checklist

- [x] Passwords hashed (bcrypt)
- [x] Sensitive fields not logged
- [x] Audit trail for all actions
- [x] Token expiration (TTL)
- [x] Soft delete for data recovery

---

**Database Design Version**: 1.0.0  
**Last Updated**: 2026-06-21  
**Status**: ✅ Production-Ready
