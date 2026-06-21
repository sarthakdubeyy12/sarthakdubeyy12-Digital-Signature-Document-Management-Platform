# Repository Pattern Design - Digital Signature Platform

## 📋 Overview

The Repository Pattern provides an abstraction layer between the business logic (Service Layer) and data access logic (Database Layer). This design ensures:

- **Separation of Concerns**: Business logic doesn't know about database implementation
- **Testability**: Easy to mock repositories for unit testing
- **Maintainability**: Database logic centralized in one place
- **Flexibility**: Easy to swap databases or ORMs

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Controller Layer                         │
│                  (Request/Response Handling)                 │
└────────────────────────┬────────────────────────────────────┘
                         │
┌────────────────────────▼────────────────────────────────────┐
│                      Service Layer                           │
│                   (Business Logic)                           │
└──┬──────────┬──────────┬──────────┬──────────┬──────────────┘
   │          │          │          │          │
   ▼          ▼          ▼          ▼          ▼
┌──────┐  ┌──────┐  ┌──────┐  ┌──────┐  ┌──────┐
│ User │  │ Doc  │  │ Sign │  │Verify│  │Audit │
│ Repo │  │ Repo │  │ Repo │  │ Repo │  │ Repo │
└──┬───┘  └──┬───┘  └──┬───┘  └──┬───┘  └──┬───┘
   │         │         │         │         │
   └─────────┴─────────┴─────────┴─────────┘
                       │
┌──────────────────────▼────────────────────────┐
│            Prisma Client                       │
│         (Database Abstraction)                 │
└──────────────────────┬────────────────────────┘
                       │
┌──────────────────────▼────────────────────────┐
│              MongoDB                           │
└────────────────────────────────────────────────┘
```

---

## 📦 Repository Responsibilities

### Common Responsibilities (All Repositories)

1. **CRUD Operations**: Create, Read, Update, Delete
2. **Query Methods**: Find by various criteria
3. **Pagination**: Support for paginated results
4. **Soft Delete**: Implement soft delete logic
5. **Transaction Support**: Handle atomic operations
6. **Error Handling**: Database-specific error handling

### Repository-Specific Responsibilities

Each repository handles:
- Domain-specific queries
- Business rule validations at data level
- Optimized queries for specific use cases
- Aggregations and complex queries

---

## 🗂️ Repository Structure

### File Organization

```
src/
└── modules/
    ├── auth/
    │   ├── auth.repository.js      ← RefreshToken + PasswordResetToken
    │   └── ...
    ├── users/
    │   ├── user.repository.js      ← User operations
    │   └── ...
    ├── documents/
    │   ├── document.repository.js  ← Document operations
    │   └── ...
    ├── signatures/
    │   ├── signature.repository.js ← Signature operations
    │   └── ...
    ├── verification/
    │   ├── verification.repository.js ← Verification operations
    │   └── ...
    └── audit/
        ├── audit.repository.js     ← AuditLog operations
        └── ...
```

---

## 👤 1. UserRepository

### Responsibilities

- User CRUD operations
- Authentication-related queries
- User search and filtering
- Soft delete management
- Profile management

### Common Methods

```javascript
class UserRepository {
  constructor(prisma) {
    this.prisma = prisma;
  }

  // ============================================
  // CREATE
  // ============================================
  
  async create(data) {
    // Create new user
    // Hash password before storing (done in service layer)
  }

  // ============================================
  // READ
  // ============================================
  
  async findById(userId) {
    // Find user by ID (exclude deleted)
    // Used for: Profile fetching, auth verification
  }

  async findByEmail(email) {
    // Find user by email (for login)
    // Includes soft-deleted check
  }

  async findAll(filters, pagination) {
    // List all users with filters
    // Pagination support
    // Used for: Admin dashboard
  }

  async countActive() {
    // Count active users
    // Used for: Dashboard statistics
  }

  // ============================================
  // UPDATE
  // ============================================
  
  async update(userId, data) {
    // Update user profile
    // Exclude password field (separate method)
  }

  async updatePassword(userId, hashedPassword) {
    // Update password only
    // Used for: Password change, password reset
  }

  async updateLastLogin(userId) {
    // Update last login timestamp
    // Used for: Auth flow
  }

  // ============================================
  // DELETE
  // ============================================
  
  async softDelete(userId) {
    // Soft delete user
    // Set deletedAt timestamp
  }

  async restore(userId) {
    // Restore soft-deleted user
    // Clear deletedAt timestamp
  }

  // ============================================
  // SEARCH
  // ============================================
  
  async search(searchTerm, pagination) {
    // Search users by name or email
    // Used for: Admin user management
  }

  // ============================================
  // VALIDATION
  // ============================================
  
  async exists(userId) {
    // Check if user exists
  }

  async emailExists(email) {
    // Check if email already registered
  }
}
```

### Query Patterns

```javascript
// Authentication
findByEmail({ email, deletedAt: null })

// Profile
findById({ id, deletedAt: null })

// Admin list
findAll({ 
  deletedAt: null, 
  role: 'USER' 
}).skip(offset).limit(limit)

// Search
findAll({ 
  $or: [
    { firstName: { $regex: searchTerm } },
    { lastName: { $regex: searchTerm } },
    { email: { $regex: searchTerm } }
  ],
  deletedAt: null
})
```

---

## 📄 2. DocumentRepository

### Responsibilities

- Document CRUD operations
- User's document management
- Status filtering
- Verification code generation
- Pagination support

### Common Methods

```javascript
class DocumentRepository {
  constructor(prisma) {
    this.prisma = prisma;
  }

  // ============================================
  // CREATE
  // ============================================
  
  async create(data) {
    // Create new document
    // Generate unique verification code
  }

  // ============================================
  // READ
  // ============================================
  
  async findById(documentId) {
    // Find document by ID
    // Include user data (select specific fields)
  }

  async findByUser(userId, filters, pagination) {
    // List user's documents
    // Filter by status
    // Sort by date
  }

  async findByVerificationCode(code) {
    // Find document for public verification
    // Include verification data
  }

  async countByUser(userId) {
    // Count user's documents
    // Used for: Dashboard statistics
  }

  async countByStatus(status) {
    // Count documents by status
    // Used for: Admin dashboard
  }

  // ============================================
  // UPDATE
  // ============================================
  
  async update(documentId, data) {
    // Update document metadata
  }

  async updateStatus(documentId, status) {
    // Update document status
    // Used for: Signing workflow
  }

  async markAsSigned(documentId, signedFilePath) {
    // Mark document as signed
    // Set signedAt timestamp
    // Set signedFilePath
  }

  // ============================================
  // DELETE
  // ============================================
  
  async softDelete(documentId) {
    // Soft delete document
  }

  async restore(documentId) {
    // Restore soft-deleted document
  }

  // ============================================
  // SEARCH
  // ============================================
  
  async search(userId, searchTerm, pagination) {
    // Search user's documents by title
  }

  // ============================================
  // AGGREGATION
  // ============================================
  
  async getStatsByUser(userId) {
    // Get document statistics for user
    // Count by status
  }

  async getRecentDocuments(userId, limit = 5) {
    // Get recent documents
    // Used for: Dashboard
  }
}
```

### Query Patterns

```javascript
// User's documents list
findAll({ 
  userId, 
  deletedAt: null 
}).sort({ createdAt: -1 })

// Filter by status
findAll({ 
  userId, 
  status: 'SIGNED', 
  deletedAt: null 
})

// Public verification
findOne({ 
  verificationCode 
})

// Dashboard statistics
aggregate([
  { $match: { userId, deletedAt: null } },
  { $group: { _id: '$status', count: { $sum: 1 } } }
])
```

---

## ✍️ 3. SignatureRepository

### Responsibilities

- Signature CRUD operations
- Reusable signature management
- Applied signature tracking
- User's signature library

### Common Methods

```javascript
class SignatureRepository {
  constructor(prisma) {
    this.prisma = prisma;
  }

  // ============================================
  // CREATE
  // ============================================
  
  async create(data) {
    // Create new signature
    // Can be reusable or applied to document
  }

  async createReusable(userId, data) {
    // Create reusable signature
    // documentId is null
  }

  async applyToDocument(userId, documentId, signatureData, position) {
    // Create applied signature
    // Link to document
  }

  // ============================================
  // READ
  // ============================================
  
  async findById(signatureId) {
    // Find signature by ID
  }

  async findByUser(userId, filters, pagination) {
    // List user's signatures
    // Filter by isReusable
  }

  async findReusableByUser(userId) {
    // Get user's reusable signatures
    // Used for: Signature picker
  }

  async findByDocument(documentId) {
    // Get all signatures applied to document
  }

  async countByUser(userId) {
    // Count user's signatures
  }

  // ============================================
  // UPDATE
  // ============================================
  
  async update(signatureId, data) {
    // Update signature metadata
  }

  // ============================================
  // DELETE
  // ============================================
  
  async softDelete(signatureId) {
    // Soft delete signature
  }

  async restore(signatureId) {
    // Restore soft-deleted signature
  }

  // ============================================
  // VALIDATION
  // ============================================
  
  async canUserAccessSignature(userId, signatureId) {
    // Check if signature belongs to user
  }
}
```

### Query Patterns

```javascript
// Reusable signatures
findAll({ 
  userId, 
  isReusable: true, 
  deletedAt: null 
})

// Document signatures
findAll({ 
  documentId, 
  deletedAt: null 
})

// User's signature library
findAll({ 
  userId, 
  deletedAt: null 
}).sort({ createdAt: -1 })
```

---

## ✅ 4. VerificationRepository

### Responsibilities

- Verification record management
- Public verification lookup
- Verification attempt tracking
- Verification analytics

### Common Methods

```javascript
class VerificationRepository {
  constructor(prisma) {
    this.prisma = prisma;
  }

  // ============================================
  // CREATE
  // ============================================
  
  async create(documentId, verificationCode) {
    // Create verification record
    // One-to-one with document
  }

  // ============================================
  // READ
  // ============================================
  
  async findByCode(verificationCode) {
    // Find by verification code (PUBLIC)
    // Include document data
    // MOST CRITICAL QUERY
  }

  async findByDocument(documentId) {
    // Find verification for document
  }

  // ============================================
  // UPDATE
  // ============================================
  
  async incrementVerificationCount(verificationCode, ipAddress) {
    // Increment verification count
    // Update last verified data
  }

  // ============================================
  // ANALYTICS
  // ============================================
  
  async getVerificationStats(documentId) {
    // Get verification statistics
    // Count, last verified, etc.
  }

  async getMostVerifiedDocuments(limit = 10) {
    // Get most verified documents
    // Used for: Analytics dashboard
  }
}
```

### Query Patterns

```javascript
// Public verification (CRITICAL)
findOne({ verificationCode })

// Update verification
updateOne(
  { verificationCode },
  { 
    $inc: { verifiedCount: 1 },
    $set: { lastVerifiedAt: new Date(), lastVerifiedBy: ipAddress }
  }
)
```

---

## 📊 5. AuditLogRepository

### Responsibilities

- Audit log creation
- Audit trail queries
- User activity tracking
- System-wide audit queries
- Admin audit dashboard

### Common Methods

```javascript
class AuditLogRepository {
  constructor(prisma) {
    this.prisma = prisma;
  }

  // ============================================
  // CREATE
  // ============================================
  
  async create(data) {
    // Create audit log entry
    // Immutable - no updates
  }

  async logUserAction(userId, action, resource, resourceId, metadata) {
    // Log user action
  }

  async logSystemAction(action, resource, metadata) {
    // Log system action (no userId)
  }

  // ============================================
  // READ
  // ============================================
  
  async findByUser(userId, pagination) {
    // Get user's audit trail
    // Sort by date descending
  }

  async findByResource(resource, resourceId, pagination) {
    // Get audit trail for specific resource
    // e.g., All actions on a document
  }

  async findByAction(action, pagination) {
    // Get all instances of specific action
    // e.g., All DOCUMENT_SIGN actions
  }

  async findRecent(limit = 100) {
    // Get recent audit logs
    // Used for: Admin dashboard
  }

  // ============================================
  // SEARCH
  // ============================================
  
  async search(filters, pagination) {
    // Complex audit search
    // Filter by: userId, action, resource, dateRange
  }

  // ============================================
  // ANALYTICS
  // ============================================
  
  async getActionStats(startDate, endDate) {
    // Get action statistics
    // Count by action type
  }

  async getUserActivityStats(userId) {
    // Get user activity statistics
  }
}
```

### Query Patterns

```javascript
// User audit trail
findAll({ userId }).sort({ createdAt: -1 }).limit(50)

// Resource audit
findAll({ 
  resource: 'document', 
  resourceId 
}).sort({ createdAt: -1 })

// Action filter
findAll({ action: 'DOCUMENT_SIGN' }).sort({ createdAt: -1 })

// Date range
findAll({ 
  createdAt: { 
    $gte: startDate, 
    $lte: endDate 
  } 
})
```

---

## 🔑 6. RefreshTokenRepository

### Responsibilities

- Refresh token CRUD
- Token validation
- Token revocation
- Cleanup expired tokens

### Common Methods

```javascript
class RefreshTokenRepository {
  constructor(prisma) {
    this.prisma = prisma;
  }

  // ============================================
  // CREATE
  // ============================================
  
  async create(userId, token, expiresAt) {
    // Create refresh token
  }

  // ============================================
  // READ
  // ============================================
  
  async findByToken(token) {
    // Find token for validation
    // Check if not revoked
  }

  async findByUser(userId) {
    // Get user's active tokens
    // Exclude revoked
  }

  // ============================================
  // UPDATE
  // ============================================
  
  async revoke(token) {
    // Revoke token (soft delete)
    // Set isRevoked = true
  }

  async revokeAllByUser(userId) {
    // Revoke all user's tokens
    // Used for: Logout from all devices
  }

  // ============================================
  // DELETE
  // ============================================
  
  async deleteExpired() {
    // Delete expired tokens
    // TTL cleanup (can be automatic with MongoDB)
  }

  async deleteByUser(userId) {
    // Delete all user's tokens
    // Used for: Account deletion
  }
}
```

### Query Patterns

```javascript
// Token validation
findOne({ 
  token, 
  isRevoked: false,
  expiresAt: { $gt: new Date() }
})

// User's active tokens
findAll({ 
  userId, 
  isRevoked: false,
  expiresAt: { $gt: new Date() }
})

// Cleanup expired
deleteMany({ 
  expiresAt: { $lt: new Date() }
})
```

---

## 🔐 7. PasswordResetTokenRepository

### Responsibilities

- Password reset token CRUD
- Token validation
- One-time use enforcement
- Cleanup expired tokens

### Common Methods

```javascript
class PasswordResetTokenRepository {
  constructor(prisma) {
    this.prisma = prisma;
  }

  // ============================================
  // CREATE
  // ============================================
  
  async create(userId, token, expiresAt) {
    // Create password reset token
  }

  // ============================================
  // READ
  // ============================================
  
  async findByToken(token) {
    // Find token for validation
    // Check if not used and not expired
  }

  async findByUser(userId) {
    // Get user's reset tokens
    // Used for: Security check
  }

  // ============================================
  // UPDATE
  // ============================================
  
  async markAsUsed(token) {
    // Mark token as used
    // Set isUsed = true, usedAt = now
  }

  // ============================================
  // DELETE
  // ============================================
  
  async deleteExpired() {
    // Delete expired tokens
  }

  async deleteByUser(userId) {
    // Delete all user's reset tokens
  }

  // ============================================
  // VALIDATION
  // ============================================
  
  async isValid(token) {
    // Check if token is valid
    // Not used, not expired
  }
}
```

### Query Patterns

```javascript
// Token validation
findOne({ 
  token, 
  isUsed: false,
  expiresAt: { $gt: new Date() }
})

// Mark as used
updateOne(
  { token },
  { isUsed: true, usedAt: new Date() }
)

// Cleanup expired
deleteMany({ 
  expiresAt: { $lt: new Date() }
})
```

---

## 🎯 Repository Best Practices

### 1. **Consistent Error Handling**

```javascript
async findById(id) {
  try {
    const result = await this.prisma.user.findUnique({
      where: { id, deletedAt: null }
    });
    
    if (!result) {
      throw new NotFoundError('User not found');
    }
    
    return result;
  } catch (error) {
    if (error instanceof NotFoundError) throw error;
    throw new DatabaseError('Failed to fetch user', error);
  }
}
```

### 2. **Soft Delete Global Filter**

```javascript
// Always include deletedAt filter
async findAll(filters) {
  return await this.prisma.user.findMany({
    where: {
      ...filters,
      deletedAt: null // Always include
    }
  });
}
```

### 3. **Pagination Support**

```javascript
async findAll(filters, { page = 1, limit = 20 } = {}) {
  const skip = (page - 1) * limit;
  
  const [data, total] = await Promise.all([
    this.prisma.user.findMany({
      where: { ...filters, deletedAt: null },
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' }
    }),
    this.prisma.user.count({
      where: { ...filters, deletedAt: null }
    })
  ]);
  
  return {
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      hasMore: page < Math.ceil(total / limit)
    }
  };
}
```

### 4. **Transaction Support**

```javascript
async createDocumentWithVerification(documentData, verificationData) {
  return await this.prisma.$transaction(async (tx) => {
    const document = await tx.document.create({
      data: documentData
    });
    
    const verification = await tx.verification.create({
      data: {
        ...verificationData,
        documentId: document.id
      }
    });
    
    return { document, verification };
  });
}
```

### 5. **Selective Field Loading**

```javascript
async findById(id) {
  return await this.prisma.user.findUnique({
    where: { id, deletedAt: null },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      role: true,
      // Exclude password
      createdAt: true
    }
  });
}
```

---

## 📋 Repository Method Naming Conventions

| Pattern | Example | Purpose |
|---------|---------|---------|
| `create()` | `create(data)` | Create new record |
| `findById()` | `findById(id)` | Find by primary key |
| `findBy*()` | `findByEmail(email)` | Find by specific field |
| `findAll()` | `findAll(filters)` | List with filters |
| `update()` | `update(id, data)` | Update record |
| `delete()` | `delete(id)` | Hard delete |
| `softDelete()` | `softDelete(id)` | Soft delete |
| `restore()` | `restore(id)` | Restore deleted |
| `count()` | `count(filters)` | Count records |
| `exists()` | `exists(id)` | Check existence |
| `search()` | `search(term)` | Text search |

---

## ✅ Repository Checklist

- [ ] Consistent constructor with Prisma client
- [ ] All CRUD operations implemented
- [ ] Soft delete support where applicable
- [ ] Pagination support for list methods
- [ ] Error handling with custom errors
- [ ] Query optimization with proper indexes
- [ ] Transaction support for complex operations
- [ ] Validation methods (exists, isValid, etc.)
- [ ] Search functionality where needed
- [ ] Analytics/aggregation methods
- [ ] Proper JSDoc documentation

---

**Repository Pattern Version**: 1.0.0  
**Last Updated**: 2026-06-21  
**Status**: ✅ Ready for Implementation
