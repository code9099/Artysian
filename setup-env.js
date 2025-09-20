#!/usr/bin/env node

/**
 * CraftStory Environment Setup Script
 * This script helps you create the .env.local file with proper formatting
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const envTemplate = `# ===========================================
# CRAFTSTORY ENVIRONMENT VARIABLES
# ===========================================
# Generated on ${new Date().toISOString()}

# ===========================================
# FIREBASE CONFIGURATION (Web App)
# ===========================================
NEXT_PUBLIC_FIREBASE_API_KEY={{FIREBASE_API_KEY}}
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN={{FIREBASE_AUTH_DOMAIN}}
NEXT_PUBLIC_FIREBASE_PROJECT_ID={{FIREBASE_PROJECT_ID}}
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET={{FIREBASE_STORAGE_BUCKET}}
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID={{FIREBASE_MESSAGING_SENDER_ID}}
NEXT_PUBLIC_FIREBASE_APP_ID={{FIREBASE_APP_ID}}
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID={{FIREBASE_MEASUREMENT_ID}}

# ===========================================
# FIREBASE ADMIN SDK (Server-side)
# ===========================================
FIREBASE_PROJECT_ID={{FIREBASE_PROJECT_ID}}
FIREBASE_CLIENT_EMAIL={{FIREBASE_CLIENT_EMAIL}}
FIREBASE_PRIVATE_KEY="{{FIREBASE_PRIVATE_KEY}}"
FIREBASE_STORAGE_BUCKET={{FIREBASE_STORAGE_BUCKET}}

# ===========================================
# GOOGLE CLOUD AI APIs
# ===========================================
NEXT_PUBLIC_GOOGLE_API_KEY={{GEMINI_API_KEY}}
GOOGLE_CLOUD_PROJECT_ID={{FIREBASE_PROJECT_ID}}
GOOGLE_APPLICATION_CREDENTIALS=./service-account.json
VERTEX_AI_LOCATION=us-central1

# ===========================================
# OPTIONAL: ANALYTICS & MONITORING
# ===========================================
# NEXT_PUBLIC_GA_ID=your_google_analytics_id_here
# NEXT_PUBLIC_SENTRY_DSN=your_sentry_dsn_here
`;

console.log('🚀 CraftStory Environment Setup\n');
console.log('This script will help you create your .env.local file.\n');
console.log('📋 You will need:');
console.log('  1. Firebase project credentials');
console.log('  2. Google Cloud service account JSON');
console.log('  3. Gemini API key');
console.log('\n📖 For detailed instructions, see SETUP_GUIDE.md\n');

const questions = [
  {
    key: 'FIREBASE_API_KEY',
    prompt: 'Firebase API Key (from Firebase Console > Project Settings): ',
    required: true
  },
  {
    key: 'FIREBASE_AUTH_DOMAIN',
    prompt: 'Firebase Auth Domain (project-id.firebaseapp.com): ',
    required: true
  },
  {
    key: 'FIREBASE_PROJECT_ID',
    prompt: 'Firebase Project ID: ',
    required: true
  },
  {
    key: 'FIREBASE_STORAGE_BUCKET',
    prompt: 'Firebase Storage Bucket (project-id.appspot.com): ',
    required: true
  },
  {
    key: 'FIREBASE_MESSAGING_SENDER_ID',
    prompt: 'Firebase Messaging Sender ID: ',
    required: true
  },
  {
    key: 'FIREBASE_APP_ID',
    prompt: 'Firebase App ID: ',
    required: true
  },
  {
    key: 'FIREBASE_MEASUREMENT_ID',
    prompt: 'Firebase Measurement ID (optional): ',
    required: false
  },
  {
    key: 'FIREBASE_CLIENT_EMAIL',
    prompt: 'Firebase Service Account Email: ',
    required: true
  },
  {
    key: 'FIREBASE_PRIVATE_KEY',
    prompt: 'Firebase Private Key (with \\n for newlines): ',
    required: true
  },
  {
    key: 'GEMINI_API_KEY',
    prompt: 'Gemini API Key (from Google AI Studio): ',
    required: true
  }
];

const answers = {};

function askQuestion(index) {
  if (index >= questions.length) {
    generateEnvFile();
    return;
  }

  const question = questions[index];
  const prompt = question.required 
    ? `${question.prompt}` 
    : `${question.prompt}(press Enter to skip) `;

  rl.question(prompt, (answer) => {
    if (answer.trim() || !question.required) {
      answers[question.key] = answer.trim();
    }
    askQuestion(index + 1);
  });
}

function generateEnvFile() {
  console.log('\n📝 Generating .env.local file...\n');

  let envContent = envTemplate;
  
  // Replace placeholders with actual values
  Object.keys(answers).forEach(key => {
    const value = answers[key];
    if (value) {
      envContent = envContent.replace(new RegExp(`{{${key}}}`, 'g'), value);
    }
  });

  // Write to .env.local
  const envPath = path.join(process.cwd(), '.env.local');
  fs.writeFileSync(envPath, envContent);

  console.log('✅ .env.local file created successfully!');
  console.log(`📁 Location: ${envPath}`);
  console.log('\n🔧 Next steps:');
  console.log('  1. Place your service-account.json file in the project root');
  console.log('  2. Run: npm run dev');
  console.log('  3. Test the voice onboarding at /artisan/onboard');
  console.log('\n📖 For detailed setup instructions, see SETUP_GUIDE.md');
  
  rl.close();
}

// Start the questionnaire
askQuestion(0);
