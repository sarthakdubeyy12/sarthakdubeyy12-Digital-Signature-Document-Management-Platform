const { MongoClient } = require('mongodb');
const bcrypt = require('bcryptjs');

async function createAdmin() {
  const client = new MongoClient('mongodb://127.0.0.1:27017/?directConnection=true');
  
  try {
    await client.connect();
    console.log('Connected to MongoDB');
    
    const db = client.db('digital-signature-platform');
    const users = db.collection('users');
    
    // Check if admin exists
    const existingAdmin = await users.findOne({ email: 'admin@digitalsignature.com' });
    
    if (existingAdmin) {
      console.log('✅ Admin user already exists');
      console.log('   Email:', existingAdmin.email);
      console.log('   Role:', existingAdmin.role);
      return;
    }
    
    // Create admin user
    const adminPassword = await bcrypt.hash('Admin@123456', 10);
    
    const result = await users.insertOne({
      email: 'admin@digitalsignature.com',
      password: adminPassword,
      firstName: 'System',
      lastName: 'Administrator',
      role: 'ADMIN',
      isEmailVerified: true,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    });
    
    console.log('✅ Admin user created successfully');
    console.log('   ID:', result.insertedId);
    console.log('   Email: admin@digitalsignature.com');
    console.log('   Password: Admin@123456');
    console.log('   Role: ADMIN');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await client.close();
  }
}

createAdmin();
