#!/usr/bin/env node

const fs = require('fs').promises;
const path = require('path');

const directories = [
  'storage/documents/original',
  'storage/documents/signed',
  'storage/signatures',
  'storage/temp',
  'logs/error',
  'logs/combined',
  'logs/audit',
];

async function createDirectories() {
  console.log('🚀 Setting up Digital Signature Platform...\n');

  for (const dir of directories) {
    const dirPath = path.join(process.cwd(), dir);
    try {
      await fs.mkdir(dirPath, { recursive: true });
      console.log(`✅ Created directory: ${dir}`);
    } catch (error) {
      console.error(`❌ Failed to create directory ${dir}:`, error.message);
    }
  }

  console.log('\n✨ Setup completed successfully!');
  console.log('\nNext steps:');
  console.log('1. Copy .env.example to .env: cp .env.example .env');
  console.log('2. Update environment variables in .env');
  console.log('3. Start development server: npm run dev');
}

createDirectories().catch((error) => {
  console.error('Setup failed:', error);
  process.exit(1);
});
