#!/usr/bin/env node

/**
 * Environment Variables Validation Script
 * This script validates that all required environment variables are set
 */

const fs = require('fs');
const path = require('path');

// Required environment variables
const requiredVars = [
  'NEXT_PUBLIC_FIREBASE_API_KEY',
  'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN',
  'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
  'NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET',
  'NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID',
  'NEXT_PUBLIC_FIREBASE_APP_ID',
  'NEXT_PUBLIC_GOOGLE_API_KEY',
];

// Optional environment variables
const optionalVars = [
  'NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID',
  'FIREBASE_PROJECT_ID',
  'FIREBASE_CLIENT_EMAIL',
  'FIREBASE_PRIVATE_KEY',
  'FIREBASE_STORAGE_BUCKET',
  'GOOGLE_CLOUD_PROJECT_ID',
  'GOOGLE_APPLICATION_CREDENTIALS',
  'VERTEX_AI_LOCATION',
];

function validateEnvironment() {
  console.log('🔍 Validating environment variables...\n');
  
  const envPath = path.join(process.cwd(), '.env.local');
  
  if (!fs.existsSync(envPath)) {
    console.error('❌ .env.local file not found!');
    console.log('Please create a .env.local file with your Firebase configuration.');
    process.exit(1);
  }
  
  // Load environment variables
  require('dotenv').config({ path: envPath, override: true });
  
  let hasErrors = false;
  
  // Check required variables
  console.log('📋 Required Variables:');
  requiredVars.forEach(varName => {
    const value = process.env[varName];
    if (!value) {
      console.error(`❌ ${varName}: Missing`);
      hasErrors = true;
    } else {
      console.log(`✅ ${varName}: ${value.substring(0, 20)}...`);
    }
  });
  
  console.log('\n📋 Optional Variables:');
  optionalVars.forEach(varName => {
    const value = process.env[varName];
    if (!value) {
      console.log(`⚠️  ${varName}: Not set (optional)`);
    } else {
      console.log(`✅ ${varName}: ${value.substring(0, 20)}...`);
    }
  });
  
  // Check service account file
  const serviceAccountPath = path.join(process.cwd(), 'service-account.json');
  if (fs.existsSync(serviceAccountPath)) {
    console.log('\n✅ service-account.json: Found');
  } else {
    console.log('\n⚠️  service-account.json: Not found (needed for server-side operations)');
  }
  
  if (hasErrors) {
    console.log('\n❌ Validation failed! Please fix the missing variables.');
    process.exit(1);
  } else {
    console.log('\n✅ All required environment variables are set!');
  }
}

// Run validation
validateEnvironment();
