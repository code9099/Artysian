# 🔍 Frontend-Backend Integration Analysis

## 📊 **API Calls Inventory**

### **Frontend API Calls Found:**

#### 1. **Speech Processing APIs**
- **Endpoint:** `/api/speech/transcribe`
- **Method:** POST
- **Used in:** 
  - `src/lib/speechService.ts`
  - `src/components/ProductVoiceOnboard.tsx`
  - `src/app/voice-test/page.tsx`
- **Payload:** `{ audioData: string, languageCode: string }`
- **Status:** ✅ Backend exists

- **Endpoint:** `/api/speech/tts`
- **Method:** POST
- **Used in:**
  - `src/lib/speechService.ts`
  - `src/components/ProductVoiceOnboard.tsx`
  - `src/app/voice-test/page.tsx`
- **Payload:** `{ text: string, languageCode: string }`
- **Status:** ✅ Backend exists

#### 2. **Gemini AI Processing APIs**
- **Endpoint:** `/api/gemini/process`
- **Method:** POST
- **Used in:**
  - `src/lib/geminiService.ts`
  - `src/components/MultilingualVoiceAssistant.tsx`
  - `src/components/ProductVoiceOnboard.tsx`
  - `src/components/artisan/ProductSummary.tsx`
  - `src/components/artisan/ProductChat.tsx`
  - `src/app/voice-test/page.tsx`
- **Payload:** Various actions (generateQuestions, generateBio, translate, etc.)
- **Status:** ✅ Backend exists

#### 3. **User Authentication APIs**
- **Endpoint:** `/api/auth/user`
- **Methods:** GET, PUT, DELETE
- **Used in:** `src/app/api/auth/user/route.ts`
- **Status:** ✅ Backend exists

#### 4. **Manifest Check**
- **Endpoint:** `/manifest.json`
- **Method:** GET
- **Used in:** `src/lib/setup-validator.ts`
- **Status:** ❓ Need to verify

### **Firebase Functions Endpoints:**

#### 1. **Express App Functions**
- **Base URL:** `/api/*` (Firebase Functions)
- **Endpoints:**
  - `GET /health` - Health check
  - `POST /onboard-voice` - Voice onboarding
  - `POST /generate-craft` - Craft generation
  - `POST /visualize-story` - Story visualization
- **Status:** ❌ **MISMATCH DETECTED**

### **Firestore Operations:**

#### 1. **Collections Used:**
- `users` - User profiles and preferences
- `artisans` - Artisan profiles
- `explorers` - Explorer profiles  
- `crafts` - Craft listings

#### 2. **Operations:**
- **Read:** `getDoc()`, `getDocs()`, `onSnapshot()`
- **Write:** `setDoc()`, `updateDoc()`, `addDoc()`
- **Delete:** `deleteDoc()`

## 🚨 **CRITICAL ISSUES IDENTIFIED:**

### **1. API Endpoint Mismatch**
❌ **Problem:** Frontend calls Next.js API routes (`/api/*`) but Firebase Functions use different endpoints
- **Frontend expects:** `/api/speech/transcribe`, `/api/gemini/process`
- **Firebase Functions provide:** `/onboard-voice`, `/generate-craft`, `/visualize-story`

### **2. Missing Firebase Functions Integration**
❌ **Problem:** Firebase Functions are not being called by frontend
- **Functions exist:** `onboardVoice`, `generateCraft`, `visualizeStory`
- **Frontend doesn't use them:** All calls go to Next.js API routes

### **3. Configuration Issues**
❌ **Problem:** Missing server-side environment variables
- **Missing:** `FIREBASE_PRIVATE_KEY`, `FIREBASE_CLIENT_EMAIL`
- **Impact:** Firebase Admin SDK won't work properly

### **4. CORS Configuration**
⚠️ **Potential Issue:** Firebase Functions have CORS enabled, but Next.js API routes may not handle CORS properly for production

## 🔧 **RECOMMENDED FIXES:**

### **Fix 1: Align API Endpoints**
Either:
- **Option A:** Update frontend to call Firebase Functions directly
- **Option B:** Update Firebase Functions to match Next.js API routes
- **Option C:** Use Next.js API routes as proxy to Firebase Functions

### **Fix 2: Environment Variables**
Add missing variables to `.env.local`:
```bash
FIREBASE_PRIVATE_KEY="..."
FIREBASE_CLIENT_EMAIL="..."
GOOGLE_APPLICATION_CREDENTIALS="./service-account.json"
```

### **Fix 3: Firebase Configuration**
Update `firebase.json` to properly route API calls:
```json
{
  "hosting": {
    "rewrites": [
      {
        "source": "/api/**",
        "function": "api"
      }
    ]
  }
}
```

### **Fix 4: Service Integration**
Decide on architecture:
- **Current:** Next.js API routes + Firebase Functions (duplicated)
- **Recommended:** Next.js API routes only (simpler deployment)

## 📋 **NEXT STEPS:**

1. ✅ **Complete** - Analyze all API calls and endpoints
2. 🔄 **Next** - Validate Firebase configuration
3. 🔄 **Next** - Check Firestore security rules
4. 🔄 **Next** - Test network connectivity
5. 🔄 **Next** - Implement fixes

## 🎯 **Priority Issues:**

1. **HIGH:** Environment variables missing for server-side operations
2. **HIGH:** API endpoint mismatch between frontend and Firebase Functions
3. **MEDIUM:** Firebase configuration validation
4. **LOW:** CORS configuration for production