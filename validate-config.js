/**
 * Firebase Configuration Validation Script
 * Tests Firebase connection and configuration
 */

require('dotenv').config({ path: '.env.local' });

console.log('🔍 Firebase Configuration Validation');
console.log('=====================================\n');

// Check environment variables
const requiredVars = {
  'NEXT_PUBLIC_FIREBASE_API_KEY': process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN': process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  'NEXT_PUBLIC_FIREBASE_PROJECT_ID': process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  'NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET': process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  'NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID': process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  'NEXT_PUBLIC_FIREBASE_APP_ID': process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  'NEXT_PUBLIC_GOOGLE_API_KEY': process.env.NEXT_PUBLIC_GOOGLE_API_KEY,
};

const serverVars = {
  'FIREBASE_PROJECT_ID': process.env.FIREBASE_PROJECT_ID,
  'FIREBASE_CLIENT_EMAIL': process.env.FIREBASE_CLIENT_EMAIL,
  'FIREBASE_PRIVATE_KEY': process.env.FIREBASE_PRIVATE_KEY,
  'GOOGLE_CLOUD_PROJECT_ID': process.env.GOOGLE_CLOUD_PROJECT_ID,
};

console.log('📋 Client-side Environment Variables:');
let clientValid = true;
for (const [key, value] of Object.entries(requiredVars)) {
  const status = value ? '✅' : '❌';
  const displayValue = value ? (key.includes('KEY') ? `${value.substring(0, 10)}...` : value) : 'MISSING';
  console.log(`${status} ${key}: ${displayValue}`);
  if (!value) clientValid = false;
}

console.log('\n📋 Server-side Environment Variables:');
let serverValid = true;
for (const [key, value] of Object.entries(serverVars)) {
  const status = value ? '✅' : '❌';
  let displayValue = 'MISSING';
  if (value) {
    if (key.includes('KEY')) {
      displayValue = value.includes('PLACEHOLDER') ? '⚠️ PLACEHOLDER' : `${value.substring(0, 20)}...`;
    } else {
      displayValue = value;
    }
  }
  console.log(`${status} ${key}: ${displayValue}`);
  if (!value) serverValid = false;
}

console.log('\n🔧 Configuration Status:');
console.log(`✅ Client-side config: ${clientValid ? 'VALID' : 'INVALID'}`);
console.log(`⚠️ Server-side config: ${serverValid ? 'VALID' : 'NEEDS REAL VALUES'}`);

// Test Firebase initialization
console.log('\n🔥 Testing Firebase Initialization...');
try {
  // Test client-side Firebase
  const { initializeApp } = require('firebase/app');
  
  const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  };

  const app = initializeApp(firebaseConfig);
  console.log('✅ Firebase client initialization: SUCCESS');
  
} catch (error) {
  console.log('❌ Firebase client initialization: FAILED');
  console.log(`   Error: ${error.message}`);
}

// Check project ID consistency
console.log('\n🔍 Project ID Consistency Check:');
const clientProjectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
const serverProjectId = process.env.FIREBASE_PROJECT_ID;
const cloudProjectId = process.env.GOOGLE_CLOUD_PROJECT_ID;

console.log(`Client Project ID: ${clientProjectId}`);
console.log(`Server Project ID: ${serverProjectId}`);
console.log(`Cloud Project ID: ${cloudProjectId}`);

const projectIdsMatch = clientProjectId === serverProjectId && serverProjectId === cloudProjectId;
console.log(`${projectIdsMatch ? '✅' : '❌'} Project IDs match: ${projectIdsMatch}`);

console.log('\n📊 Summary:');
if (clientValid && projectIdsMatch) {
  console.log('✅ Configuration is ready for development');
  console.log('⚠️ Server-side features need real Firebase Admin credentials');
} else {
  console.log('❌ Configuration has issues that need to be fixed');
}

console.log('\n🚀 Next Steps:');
console.log('1. Get Firebase Admin SDK private key from Firebase Console');
console.log('2. Download service-account.json file');
console.log('3. Update FIREBASE_PRIVATE_KEY and FIREBASE_CLIENT_EMAIL');
console.log('4. Test server-side Firebase Admin functionality');

console.log('\n=====================================');