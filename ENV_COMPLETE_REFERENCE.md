# 🔧 Complete Environment Variables Reference

## 📋 **Required Environment Variables for CraftStory**

Based on analysis of all code files, here's what you need in your `.env.local` file:

### **✅ Currently Working (Keep These):**
```bash
# Firebase Web App Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyDhwuiwLZv5GPK6veyzqVnKwHYmInOwhtw
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=artisan-story.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=artisan-story
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=artisan-story.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=634332993324
NEXT_PUBLIC_FIREBASE_APP_ID=1:634332993324:web:e34be62723301bc5853e89
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=G-V2KJCP1X5C

# Google AI APIs
NEXT_PUBLIC_GOOGLE_API_KEY=AIzaSyAhnRuXakoMjamSOttHeBuk0mRDxwslh0g
```

### **❌ Missing (Add These for Full Functionality):**

```bash
# ===========================================
# FIREBASE ADMIN SDK (Server-side)
# ===========================================
FIREBASE_PROJECT_ID=artisan-story
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-fbsvc@artisan-story.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQCvbdBELli1UO8t\nNUDSOhEOMmrHmZkpiUPPpR/nOEtfcTfmPRmHs055lXJ8kBuYqFm6POAB+n95Vf/q\n0f12Pd3MDXjlwHvB7+bLHDWPpC6coXkbEstFGqvyJ9F9rT08SoPqhONohNQFVukb\ny2k43GmL39fubtvTHA9UEzW6AiMMPVdAPq3Lg3K7kbiWwM233K2kXbTiaZx1Ygf3\nHFCnF9KJZJGPB9+V/1Uuz6expSud3UI6aTZSWrExbKLagqeRJKQdf4KNqZLEPd3c\nFG+UYnO90d4TJqoSRCSYpBDjYSPGbhULVYGxOCOhhrv24AhCwmUeSRabdeLVecUV\nkl6g8GU9AgMBAAECggEAGAZevZuoR+qV2tfecPwFTm+uqne5X1QeXo9TY2/U+LTx\nbh1jg+9VObbzFyaINPunUCdamULEVuplcjQAdYNK/xFAQ5y9BiYT8jCCkFGwlYBS\nrNfB0UyyDCeSW9cQGhPtZX5+A1gfjjylD4qntiMPbFnDQXLatZpz6fR4iOkWgiwh\nPnTTiYpEncy0128Tuum/b3BBLbZmd5fcB+P7T+yTQNU53pwpoH0gIcM5eo7qXToX\nyXbT6ko5/+PcM4yoe8QMIxBsI48HVcVHuiMcl0lDFIjXnAabLPnipadQPUwus+12\nKgno0ex6OjAuXSwsvnE1PRUG44xXHewUil+y/F8XYQKBgQDiES9jSjxI/pE9JpeV\naYneDQp39YfzzkSExhgLmHaRRNwT5sFf3TpCuWVBYhaS+E1YREXXBaG4h4a6+i65\ni8j+H8eOz1aBe/3dYCBmiGG1sCbAho5qlTDNK83aCzWECxYU146IWwDgp2yURYd8\nbAKRx/gjx6W86Vc1inoXiQaCIQKBgQDGqC/xWniU48Ms46U2HCcBC2LvvktS5iCV\nD6FajxfRy7fMIrV9K/lCJvBi2feiTgbTTjh/NND6tse4BHho211DQYXcMsdUbkoD\nc/M3Rzwfq+/doET0l58ZoRPa8MYL/L312TNi55wiuFEWsK5+xaTjPM8mHAFNeBHc\nk+xHLU23nQKBgGIMIglmQQ9HmaZz/nqG84yjC09L5lMPuxf68qLU1VfcDbdz9Zqm\nUIZv8kKRUEkd+C24LrI7dxCZdw3RREKlJd9R2TNPKa2vIUPKVUMjE33BkI0fztTb\nL/dMcFOJWQST6lfPxbnN/mtxMd586W5FSjgACtc51+A/M9u824cpnvEBAoGBAJAx\nKcNkqJthipw9jABvhLwUWLatiBze3o1zb+m8bUyhMoJgOx1k2qJygw8tKLpNKlUb\ntJRYcMtZ+jMOQ5vQhaw4lgHTda1J9Dz3X3XjJnfSo+NY3lQu7ZN7wF6tXwL6a6NU\nCSFj/YeSA4GVssJfkSRDUhRWRXfGjChv0hODxaJdAoGAQVeRk4VDV/rIGlcamcjq\nyIRP+t63X4yG3ZBi8g3nV2dkzaZAXW3bscodDaCdpICl9dl8+mOuFxgT1YHfHQa/\n7LwK8Dxq0gEQJllbVnlnjV8+2xn26/3mOn3/XdLQw14kXFrfse6hnsfOyRDeVMqk\nhJL2gY4uq6NqGtfTC2ygt4A=\n-----END PRIVATE KEY-----\n"
FIREBASE_STORAGE_BUCKET=artisan-story.firebasestorage.app

# ===========================================
# GOOGLE CLOUD AI SERVICES
# ===========================================
GOOGLE_CLOUD_PROJECT_ID=artisan-story
GOOGLE_APPLICATION_CREDENTIALS=./service-account.json
VERTEX_AI_LOCATION=us-central1

# ===========================================
# FIREBASE FUNCTIONS (Optional - for deployment)
# ===========================================
GOOGLE_API_KEY=AIzaSyAhnRuXakoMjamSOttHeBuk0mRDxwslh0g
```

## 📁 **Files That Use These Variables:**

### **Client-Side (NEXT_PUBLIC_*):**
- `src/lib/firebaseClient.ts` - Firebase web app initialization
- `src/contexts/AuthContext.tsx` - Google Sign-In authentication
- `src/ai/flows/generateArtisanBio.ts` - Gemini API calls

### **Server-Side (No NEXT_PUBLIC_ prefix):**
- `src/lib/firebaseAdmin.ts` - Firebase Admin SDK
- `functions/src/onboardVoice.ts` - Voice processing
- `functions/src/generateCraft.ts` - Craft generation
- `functions/src/visualizeStory.ts` - Story visualization

## 🔧 **Setup Instructions:**

1. **Copy the missing variables** to your `.env.local` file
2. **Download service account JSON** from Firebase Console
3. **Place it as `service-account.json`** in project root
4. **Restart your development server**

## ⚠️ **Important Notes:**

- **NEXT_PUBLIC_*** variables are exposed to the browser
- **Non-NEXT_PUBLIC_*** variables are server-side only
- **FIREBASE_PRIVATE_KEY** must be properly formatted with `\n` for newlines
- **GOOGLE_APPLICATION_CREDENTIALS** points to your service account JSON file

## 🚀 **Current Status:**

✅ **Working:** Basic Firebase auth, Google Sign-In, app runs without errors
❌ **Missing:** Server-side Firebase Admin, Google Cloud AI services, Firebase Functions

Your app will work with the current variables, but you'll need the additional ones for full AI functionality and server-side operations.
