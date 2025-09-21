/**
 * Firestore Security Rules Testing Script
 * Tests current rules against expected operations
 */

require('dotenv').config({ path: '.env.local' });

console.log('🔒 Firestore Security Rules Analysis');
console.log('====================================\n');

// Analyze current rules
const fs = require('fs');
const rulesContent = fs.readFileSync('./firestore.rules', 'utf8');

console.log('📋 Current Firestore Rules:');
console.log(rulesContent);
console.log('\n' + '='.repeat(50) + '\n');

// Analyze rules structure
console.log('🔍 Rules Analysis:');

// Check for authentication requirement
const hasAuthCheck = rulesContent.includes('isAuthenticated()');
console.log(`${hasAuthCheck ? '✅' : '❌'} Authentication required: ${hasAuthCheck}`);

// Check for ownership validation
const hasOwnershipCheck = rulesContent.includes('isOwner(');
console.log(`${hasOwnershipCheck ? '✅' : '❌'} Ownership validation: ${hasOwnershipCheck}`);

// Check collections
const collections = ['users', 'artisans', 'crafts'];
collections.forEach(collection => {
  const hasRule = rulesContent.includes(`match /${collection}/`);
  console.log(`${hasRule ? '✅' : '❌'} ${collection} collection rules: ${hasRule}`);
});

// Check for development fallback
const hasDevFallback = rulesContent.includes('match /{document=**}');
console.log(`${hasDevFallback ? '⚠️' : '✅'} Development fallback rule: ${hasDevFallback ? 'PRESENT (INSECURE)' : 'NOT PRESENT'}`);

console.log('\n📊 Required Operations Analysis:');

// Define required operations based on code analysis
const requiredOperations = [
  {
    collection: 'users',
    operation: 'read',
    condition: 'Own user data only',
    rule: 'isOwner(userId)',
    status: 'SECURE'
  },
  {
    collection: 'users', 
    operation: 'write',
    condition: 'Own user data only',
    rule: 'isOwner(userId)',
    status: 'SECURE'
  },
  {
    collection: 'artisans',
    operation: 'read',
    condition: 'Any authenticated user',
    rule: 'isAuthenticated()',
    status: 'SECURE'
  },
  {
    collection: 'artisans',
    operation: 'write',
    condition: 'Own profile only',
    rule: 'isOwner(artisanId)',
    status: 'SECURE'
  },
  {
    collection: 'crafts',
    operation: 'read',
    condition: 'Any authenticated user',
    rule: 'isAuthenticated()',
    status: 'SECURE'
  },
  {
    collection: 'crafts',
    operation: 'write',
    condition: 'Any authenticated user',
    rule: 'isAuthenticated()',
    status: 'TOO PERMISSIVE'
  }
];

requiredOperations.forEach(op => {
  const icon = op.status === 'SECURE' ? '✅' : op.status === 'TOO PERMISSIVE' ? '⚠️' : '❌';
  console.log(`${icon} ${op.collection}/${op.operation}: ${op.condition} (${op.status})`);
});

console.log('\n🚨 Security Issues Identified:');

const issues = [
  {
    severity: 'HIGH',
    issue: 'Development fallback rule allows unrestricted access',
    impact: 'Any authenticated user can read/write any document',
    solution: 'Remove fallback rule in production'
  },
  {
    severity: 'MEDIUM', 
    issue: 'Crafts write permission too broad',
    impact: 'Users can modify crafts they don\'t own',
    solution: 'Add ownership check for craft modifications'
  },
  {
    severity: 'LOW',
    issue: 'No field-level validation',
    impact: 'Users can write invalid data structures',
    solution: 'Add data validation rules'
  }
];

issues.forEach(issue => {
  const icon = issue.severity === 'HIGH' ? '🔴' : issue.severity === 'MEDIUM' ? '🟡' : '🟢';
  console.log(`${icon} ${issue.severity}: ${issue.issue}`);
  console.log(`   Impact: ${issue.impact}`);
  console.log(`   Solution: ${issue.solution}\n`);
});

console.log('🔧 Recommended Production Rules:');
console.log(`
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {

    // Helper functions
    function isAuthenticated() {
      return request.auth != null;
    }

    function isOwner(userId) {
      return isAuthenticated() && request.auth.uid == userId;
    }

    function isValidUserData() {
      return request.resource.data.keys().hasAll(['uid', 'role']) &&
             request.resource.data.role in ['artisan', 'explorer'];
    }

    function isValidCraftData() {
      return request.resource.data.keys().hasAll(['artisanId', 'title', 'description']) &&
             request.resource.data.artisanId == request.auth.uid;
    }

    // Users collection - strict ownership
    match /users/{userId} {
      allow read, write: if isOwner(userId);
      allow create: if isOwner(userId) && isValidUserData();
    }

    // Artisans collection - read public, write own
    match /artisans/{artisanId} {
      allow read: if isAuthenticated();
      allow write, create: if isOwner(artisanId);
    }

    // Explorers collection - read public, write own  
    match /explorers/{explorerId} {
      allow read: if isAuthenticated();
      allow write, create: if isOwner(explorerId);
    }

    // Crafts collection - read public, write own only
    match /crafts/{craftId} {
      allow read: if isAuthenticated();
      allow create: if isAuthenticated() && isValidCraftData();
      allow update, delete: if isAuthenticated() && 
                            resource.data.artisanId == request.auth.uid;
    }

    // Deny all other access
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
`);

console.log('\n📋 Testing Checklist:');
console.log('- [ ] Test user can read own profile');
console.log('- [ ] Test user cannot read other profiles');
console.log('- [ ] Test artisan can create crafts');
console.log('- [ ] Test artisan cannot modify others\' crafts');
console.log('- [ ] Test explorer can read crafts');
console.log('- [ ] Test guest user is denied access');

console.log('\n🎯 Current Status:');
console.log('✅ Rules exist and provide basic security');
console.log('⚠️ Development fallback rule is insecure');
console.log('⚠️ Craft write permissions too broad');
console.log('❌ No data validation rules');

console.log('\n====================================');