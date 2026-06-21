const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...\n');

  // ============================================
  // 1. Create Admin User
  // ============================================
  console.log('Creating admin user...');
  const adminPassword = await bcrypt.hash('Admin@123456', 10);
  
  const admin = await prisma.user.upsert({
    where: { email: 'admin@digitalsignature.com' },
    update: {},
    create: {
      email: 'admin@digitalsignature.com',
      password: adminPassword,
      firstName: 'System',
      lastName: 'Administrator',
      role: 'ADMIN',
      isEmailVerified: true,
      isActive: true,
    },
  });

  console.log('✅ Admin user created');
  console.log('   Email:', admin.email);
  console.log('   Password: Admin@123456');
  console.log('   Role:', admin.role);
  console.log('');

  // ============================================
  // 2. Create Test Users
  // ============================================
  console.log('Creating test users...');
  const testPassword = await bcrypt.hash('Test@123456', 10);
  
  const testUser1 = await prisma.user.upsert({
    where: { email: 'john.doe@example.com' },
    update: {},
    create: {
      email: 'john.doe@example.com',
      password: testPassword,
      firstName: 'John',
      lastName: 'Doe',
      role: 'USER',
      isEmailVerified: true,
      isActive: true,
    },
  });

  const testUser2 = await prisma.user.upsert({
    where: { email: 'jane.smith@example.com' },
    update: {},
    create: {
      email: 'jane.smith@example.com',
      password: testPassword,
      firstName: 'Jane',
      lastName: 'Smith',
      role: 'USER',
      isEmailVerified: true,
      isActive: true,
    },
  });

  console.log('✅ Test users created');
  console.log('   User 1:', testUser1.email);
  console.log('   User 2:', testUser2.email);
  console.log('   Password (both): Test@123456');
  console.log('');

  // ============================================
  // 3. Create Sample Documents (Optional)
  // ============================================
  console.log('Creating sample documents...');
  
  const document1 = await prisma.document.create({
    data: {
      userId: testUser1.id,
      title: 'Sample Contract Agreement',
      originalName: 'contract.pdf',
      fileName: 'sample-contract-001.pdf',
      filePath: '/storage/documents/original/sample-contract-001.pdf',
      fileSize: 245000,
      mimeType: 'application/pdf',
      status: 'UPLOADED',
      verificationCode: generateVerificationCode(),
      metadata: {
        pageCount: 5,
        width: 595.0,
        height: 842.0,
      },
    },
  });

  const document2 = await prisma.document.create({
    data: {
      userId: testUser1.id,
      title: 'NDA Document',
      originalName: 'nda.pdf',
      fileName: 'sample-nda-001.pdf',
      filePath: '/storage/documents/original/sample-nda-001.pdf',
      fileSize: 180000,
      mimeType: 'application/pdf',
      status: 'SIGNED',
      verificationCode: generateVerificationCode(),
      signedFilePath: '/storage/documents/signed/sample-nda-001.pdf',
      signedAt: new Date(),
      metadata: {
        pageCount: 3,
        width: 595.0,
        height: 842.0,
      },
    },
  });

  console.log('✅ Sample documents created');
  console.log('   Document 1:', document1.title, '(UPLOADED)');
  console.log('   Document 2:', document2.title, '(SIGNED)');
  console.log('');

  // ============================================
  // 4. Create Verification Records
  // ============================================
  console.log('Creating verification records...');
  
  await prisma.verification.create({
    data: {
      documentId: document1.id,
      verificationCode: document1.verificationCode,
      verifiedCount: 0,
    },
  });

  await prisma.verification.create({
    data: {
      documentId: document2.id,
      verificationCode: document2.verificationCode,
      verifiedCount: 3,
      lastVerifiedAt: new Date(),
      lastVerifiedBy: '192.168.1.1',
      metadata: {
        userAgent: 'Mozilla/5.0',
        ipAddress: '192.168.1.1',
      },
    },
  });

  console.log('✅ Verification records created');
  console.log('');

  // ============================================
  // 5. Create Sample Audit Logs
  // ============================================
  console.log('Creating audit logs...');
  
  await prisma.auditLog.createMany({
    data: [
      {
        userId: admin.id,
        action: 'USER_LOGIN',
        resource: 'USER',
        resourceId: admin.id,
        ipAddress: '127.0.0.1',
        userAgent: 'Mozilla/5.0',
        success: true,
      },
      {
        userId: testUser1.id,
        action: 'DOCUMENT_UPLOAD',
        resource: 'DOCUMENT',
        resourceId: document1.id,
        metadata: { fileName: document1.originalName },
        ipAddress: '192.168.1.100',
        userAgent: 'Mozilla/5.0',
        success: true,
      },
      {
        userId: testUser1.id,
        action: 'DOCUMENT_SIGN',
        resource: 'DOCUMENT',
        resourceId: document2.id,
        metadata: { fileName: document2.originalName },
        ipAddress: '192.168.1.100',
        userAgent: 'Mozilla/5.0',
        success: true,
      },
    ],
  });

  console.log('✅ Audit logs created');
  console.log('');

  // ============================================
  // Summary
  // ============================================
  console.log('════════════════════════════════════════');
  console.log('🎉 Seeding completed successfully!');
  console.log('════════════════════════════════════════');
  console.log('');
  console.log('📊 Summary:');
  console.log('   - 3 users created (1 admin, 2 regular)');
  console.log('   - 2 sample documents created');
  console.log('   - 2 verification records created');
  console.log('   - 3 audit log entries created');
  console.log('');
  console.log('🔐 Login Credentials:');
  console.log('   Admin:');
  console.log('     Email: admin@digitalsignature.com');
  console.log('     Password: Admin@123456');
  console.log('');
  console.log('   Test Users:');
  console.log('     Email: john.doe@example.com');
  console.log('     Email: jane.smith@example.com');
  console.log('     Password (both): Test@123456');
  console.log('');
  console.log('🌐 Next Steps:');
  console.log('   1. Start the server: npm run dev');
  console.log('   2. Test login with provided credentials');
  console.log('   3. Open Prisma Studio: npx prisma studio');
  console.log('');
}

// Helper function to generate verification code
function generateVerificationCode() {
  return `VER-${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
}

main()
  .catch((e) => {
    console.error('');
    console.error('❌ Seeding failed:');
    console.error(e);
    console.error('');
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
