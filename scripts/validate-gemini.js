#!/usr/bin/env node

/**
 * Gemini API Setup Validation Script
 * 
 * This script validates that Gemini API and Google Cloud services are properly configured
 * for the CraftStory application.
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Validating Gemini API and Google Cloud Setup...\n');

// Check environment variables
const requiredEnvVars = {
  'NEXT_PUBLIC_GOOGLE_API_KEY': process.env.NEXT_PUBLIC_GOOGLE_API_KEY,
  'NEXT_PUBLIC_FIREBASE_PROJECT_ID': process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  'GOOGLE_API_KEY': process.env.GOOGLE_API_KEY,
  'FIREBASE_CLIENT_EMAIL': process.env.FIREBASE_CLIENT_EMAIL,
  'FIREBASE_PRIVATE_KEY': process.env.FIREBASE_PRIVATE_KEY,
  'GOOGLE_APPLICATION_CREDENTIALS': process.env.GOOGLE_APPLICATION_CREDENTIALS,
};

console.log('📋 Environment Variables:');
Object.entries(requiredEnvVars).forEach(([key, value]) => {
  const status = value ? '✅' : '❌';
  const displayValue = key.includes('PRIVATE_KEY') ? (value ? '[SET]' : '[NOT SET]') : (value || '[NOT SET]');
  console.log(`  ${status} ${key}: ${displayValue}`);
});

// Check service account file
const serviceAccountPath = path.join(__dirname, '..', 'service-account.json');
const hasServiceAccount = fs.existsSync(serviceAccountPath);
console.log(`\n📄 Service Account File:`);
console.log(`  ${hasServiceAccount ? '✅' : '❌'} service-account.json: ${hasServiceAccount ? 'EXISTS' : 'NOT FOUND'}`);

if (hasServiceAccount) {
  try {
    const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
    console.log(`  📧 Client Email: ${serviceAccount.client_email}`);
    console.log(`  🆔 Project ID: ${serviceAccount.project_id}`);
    console.log(`  🔑 Private Key: ${serviceAccount.private_key ? '[SET]' : '[NOT SET]'}`);
  } catch (error) {
    console.log(`  ❌ Error reading service account: ${error.message}`);
  }
}

// Check package.json dependencies
const packageJsonPath = path.join(__dirname, '..', 'package.json');
const functionsPackageJsonPath = path.join(__dirname, '..', 'functions', 'package.json');

console.log(`\n📦 Dependencies:`);

if (fs.existsSync(packageJsonPath)) {
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  const deps = packageJson.dependencies || {};
  
  const requiredDeps = [
    '@google/generative-ai',
    '@google-cloud/speech',
    '@google-cloud/text-to-speech'
  ];
  
  requiredDeps.forEach(dep => {
    const status = deps[dep] ? '✅' : '❌';
    console.log(`  ${status} ${dep}: ${deps[dep] || 'NOT INSTALLED'}`);
  });
}

if (fs.existsSync(functionsPackageJsonPath)) {
  const functionsPackageJson = JSON.parse(fs.readFileSync(functionsPackageJsonPath, 'utf8'));
  const functionsDeps = functionsPackageJson.dependencies || {};
  
  console.log(`\n📦 Firebase Functions Dependencies:`);
  const requiredFunctionsDeps = [
    '@google/generative-ai',
    '@google-cloud/speech',
    'firebase-admin',
    'firebase-functions'
  ];
  
  requiredFunctionsDeps.forEach(dep => {
    const status = functionsDeps[dep] ? '✅' : '❌';
    console.log(`  ${status} ${dep}: ${functionsDeps[dep] || 'NOT INSTALLED'}`);
  });
}

// Recommendations
console.log(`\n💡 Recommendations:`);

if (!process.env.NEXT_PUBLIC_GOOGLE_API_KEY) {
  console.log(`  ⚠️  Set NEXT_PUBLIC_GOOGLE_API_KEY in .env.local`);
}

if (!process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID) {
  console.log(`  ⚠️  Set NEXT_PUBLIC_FIREBASE_PROJECT_ID in .env.local`);
}

if (!process.env.FIREBASE_CLIENT_EMAIL || !process.env.FIREBASE_PRIVATE_KEY) {
  console.log(`  ⚠️  Set Firebase service account credentials in .env.local`);
}

if (!hasServiceAccount && !process.env.GOOGLE_APPLICATION_CREDENTIALS) {
  console.log(`  ⚠️  Either place service-account.json in root or set GOOGLE_APPLICATION_CREDENTIALS`);
}

console.log(`\n🧪 Testing APIs:`);
console.log(`  Visit http://localhost:3000/api/gemini/process (POST with action: 'test') to test Gemini`);
console.log(`  Visit http://localhost:3000/voice-test to test all voice components`);

console.log(`\n✨ Setup validation complete!`);