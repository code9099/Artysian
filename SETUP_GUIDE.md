# 🔑 CraftStory Environment Setup Guide

This guide will walk you through setting up all the required credentials and environment variables for CraftStory.

## 📋 **Required Environment Variables**

Create a `.env.local` file in your project root with the following variables:

```env
# ===========================================
# FIREBASE CONFIGURATION (Web App)
# ===========================================
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key_here
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id_here
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id_here
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id_here
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=your_measurement_id_here

# ===========================================
# FIREBASE ADMIN SDK (Server-side)
# ===========================================
FIREBASE_PROJECT_ID=your_project_id_here
FIREBASE_CLIENT_EMAIL=your_service_account_email@your_project_id.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_PRIVATE_KEY_HERE\n-----END PRIVATE KEY-----\n"
FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com

# ===========================================
# GOOGLE CLOUD AI APIs
# ===========================================
NEXT_PUBLIC_GOOGLE_API_KEY=your_gemini_api_key_here
GOOGLE_CLOUD_PROJECT_ID=your_project_id_here
GOOGLE_APPLICATION_CREDENTIALS=./service-account.json
VERTEX_AI_LOCATION=us-central1
```

## 🚀 **Step-by-Step Setup**

### 1. **Firebase Setup**

#### A. Create Firebase Project
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Create a project"
3. Enter project name: `craftstory` (or your preferred name)
4. Enable Google Analytics (optional)
5. Click "Create project"

#### B. Get Firebase Web App Credentials
1. In Firebase Console, go to **Project Settings** (gear icon)
2. Scroll down to **Your apps** section
3. Click **Add app** > **Web** (</> icon)
4. Register app with nickname: `craftstory-web`
5. Copy the config object values to your `.env.local`:

```javascript
// From Firebase Console
const firebaseConfig = {
  apiKey: "AIza...", // → NEXT_PUBLIC_FIREBASE_API_KEY
  authDomain: "craftstory-12345.firebaseapp.com", // → NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
  projectId: "craftstory-12345", // → NEXT_PUBLIC_FIREBASE_PROJECT_ID
  storageBucket: "craftstory-12345.appspot.com", // → NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
  messagingSenderId: "123456789", // → NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
  appId: "1:123456789:web:abcdef", // → NEXT_PUBLIC_FIREBASE_APP_ID
  measurementId: "G-XXXXXXXXXX" // → NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
};
```

#### C. Enable Firebase Services
1. Go to **Authentication** > **Get started** > **Sign-in method**
2. Enable **Email/Password** provider
3. Go to **Firestore Database** > **Create database** > **Start in test mode**
4. Go to **Storage** > **Get started** > **Next** > **Done**

#### D. Get Firebase Admin SDK Credentials
1. Go to **Project Settings** > **Service accounts**
2. Click **Generate new private key**
3. Download the JSON file and rename it to `service-account.json`
4. Place it in your project root directory
5. Extract values from the JSON file:

```json
{
  "type": "service_account",
  "project_id": "craftstory-12345", // → FIREBASE_PROJECT_ID
  "private_key_id": "...",
  "private_key": "-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n", // → FIREBASE_PRIVATE_KEY
  "client_email": "firebase-adminsdk-xxxxx@craftstory-12345.iam.gserviceaccount.com", // → FIREBASE_CLIENT_EMAIL
  "client_id": "...",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
  "client_x509_cert_url": "..."
}
```

### 2. **Google Cloud AI APIs Setup**

#### A. Enable Required APIs
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your Firebase project (same project ID)
3. Go to **APIs & Services** > **Library**
4. Enable these APIs:
   - **Cloud Speech-to-Text API**
   - **Cloud Text-to-Speech API**
   - **Generative AI API** (Gemini)
   - **Vertex AI API**

#### B. Get Gemini API Key
1. Go to [Google AI Studio](https://aistudio.google.com/)
2. Click **Get API key**
3. Create a new API key
4. Copy the key to `NEXT_PUBLIC_GOOGLE_API_KEY`

#### C. Set up Service Account (for Speech-to-Text, TTS, Vertex AI)
1. Go to **IAM & Admin** > **Service Accounts**
2. Click **Create Service Account**
3. Name: `craftstory-ai-service`
4. Description: `Service account for CraftStory AI features`
5. Click **Create and Continue**
6. Add these roles:
   - **Cloud Speech-to-Text API User**
   - **Cloud Text-to-Speech API User**
   - **Vertex AI User**
7. Click **Done**
8. Click on the created service account
9. Go to **Keys** tab > **Add Key** > **Create new key** > **JSON**
10. Download and replace your `service-account.json` file

### 3. **Environment File Setup**

#### A. Create .env.local file
```bash
# In your project root
touch .env.local
```

#### B. Fill in the values
Copy the template from above and replace with your actual values.

#### C. Important Notes
- **Never commit `.env.local` to version control**
- The `service-account.json` file should be in your project root
- Make sure `GOOGLE_APPLICATION_CREDENTIALS=./service-account.json`
- All `NEXT_PUBLIC_*` variables are exposed to the browser
- Other variables are server-side only

### 4. **Test Your Setup**

#### A. Test Firebase Connection
```bash
npm run dev
# Open http://localhost:3000
# Check browser console for Firebase connection errors
```

#### B. Test AI APIs
1. Go to `/artisan/onboard`
2. Try the voice recording feature
3. Check browser console for API errors

#### C. Common Issues
- **Firebase connection failed**: Check your Firebase config values
- **Speech API error**: Verify `GOOGLE_APPLICATION_CREDENTIALS` path
- **Gemini API error**: Check your `NEXT_PUBLIC_GOOGLE_API_KEY`
- **CORS errors**: Make sure your domain is whitelisted in Firebase

## 🔒 **Security Best Practices**

1. **Never expose private keys** in client-side code
2. **Use environment variables** for all sensitive data
3. **Restrict API keys** to specific domains/IPs when possible
4. **Regularly rotate** your API keys
5. **Monitor usage** in Google Cloud Console

## 📞 **Need Help?**

If you encounter issues:

1. **Check the console logs** for specific error messages
2. **Verify all environment variables** are set correctly
3. **Ensure APIs are enabled** in Google Cloud Console
4. **Check service account permissions**
5. **Verify Firebase project settings**

## 🎯 **Quick Start Checklist**

- [ ] Firebase project created
- [ ] Firebase web app registered
- [ ] Firebase services enabled (Auth, Firestore, Storage)
- [ ] Service account JSON downloaded
- [ ] Google Cloud APIs enabled
- [ ] Gemini API key obtained
- [ ] `.env.local` file created with all variables
- [ ] `service-account.json` placed in project root
- [ ] `npm run dev` starts without errors
- [ ] Voice onboarding works in browser

Once all steps are completed, your CraftStory application will be fully functional with real AI integration! 🚀
