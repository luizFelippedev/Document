#!/usr/bin/env node

/**
 * Script to set up project directories and initial configuration
 */

const fs = require('fs');
const path = require('path');

// Create required directories
const dirs = [
  'uploads',
  'uploads/projects',
  'uploads/certificates',
  'uploads/certificates/images',
  'uploads/certificates/files',
  'uploads/users',
  'logs',
  'src/templates/emails',
  'dist'
];

console.log('Creating required directories...');

dirs.forEach(dir => {
  const fullPath = path.join(process.cwd(), dir);
  if (!fs.existsSync(fullPath)) {
    fs.mkdirSync(fullPath, { recursive: true });
    console.log(`✓ Created ${dir}`);
  } else {
    console.log(`✓ ${dir} already exists`);
  }
});

// Check if .env file exists
const envPath = path.join(process.cwd(), '.env');
if (!fs.existsSync(envPath)) {
  console.log('\n⚠️  No .env file found. Please copy .env.example to .env and update the values.');
} else {
  console.log('\n✓ .env file exists');
}

console.log('\nSetup completed successfully!');
console.log('\nNext steps:');
console.log('1. Make sure MongoDB and Redis are running');
console.log('2. Run npm run seed to populate the database with sample data');
console.log('3. Run npm run dev to start the development server');