# 🔑 Environment Variables Quick Reference

## 📋 **Required Variables**

| Variable | Source | Description |
|----------|--------|-------------|
| `NEXT_PUBLIC_FIREBASE_API_KEY` | Firebase Console > Project Settings | Web app API key |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | Firebase Console > Project Settings | Auth domain |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | Firebase Console > Project Settings | Project identifier |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | Firebase Console > Project Settings | Storage bucket |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | Firebase Console > Project Settings | Messaging sender ID |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | Firebase Console > Project Settings | App identifier |
| `NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID` | Firebase Console > Project Settings | Analytics ID |
| `FIREBASE_PROJECT_ID` | Same as above | Server-side project ID |
| `FIREBASE_CLIENT_EMAIL` | Service Account JSON | Service account email |
| `FIREBASE_PRIVATE_KEY` | Service Account JSON | Private key with \n |
| `FIREBASE_STORAGE_BUCKET` | Same as above | Storage bucket |
| `NEXT_PUBLIC_GOOGLE_API_KEY` | Google AI Studio | Gemini API key |
| `GOOGLE_CLOUD_PROJECT_ID` | Same as Firebase | Project ID |
| `GOOGLE_APPLICATION_CREDENTIALS` | File path | Path to service-account.json |
| `VERTEX_AI_LOCATION` | Google Cloud | Region (us-central1) |

## 🚀 **Quick Setup Commands**

```bash
# 1. Run the interactive setup
npm run setup

# 2. Place service account file
# Download from Firebase Console > Service Accounts
# Rename to service-account.json
# Place in project root

# 3. Start development server
npm run dev
```

## 🔍 **Where to Get Credentials**

### Firebase Web App Config
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Project Settings (gear icon) > General
4. Scroll to "Your apps" > Web app config

### Firebase Service Account
1. Firebase Console > Project Settings > Service Accounts
2. "Generate new private key"
3. Download JSON file
4. Rename to `service-account.json`

### Gemini API Key
1. Go to [Google AI Studio](https://aistudio.google.com/)
2. Click "Get API key"
3. Create new key
4. Copy to `NEXT_PUBLIC_GOOGLE_API_KEY`

### Google Cloud APIs
1. [Google Cloud Console](https://console.cloud.google.com/)
2. Select your Firebase project
3. APIs & Services > Library
4. Enable: Speech-to-Text, Text-to-Speech, Generative AI, Vertex AI

## ⚠️ **Important Notes**

- **Never commit** `.env.local` or `service-account.json` to git
- **All `NEXT_PUBLIC_*`** variables are exposed to the browser
- **Private key** must include `\n` for newlines
- **Service account JSON** must be in project root
- **APIs must be enabled** in Google Cloud Console

## 🧪 **Test Your Setup**

```bash
# Check if environment variables are loaded
npm run dev

# Open browser console and check for:
# ✅ Firebase connection successful
# ✅ No API key errors
# ✅ Voice recording works at /artisan/onboard
```

## 🆘 **Common Issues**

| Error | Solution |
|-------|----------|
| `Firebase connection failed` | Check Firebase config values |
| `Speech API error` | Verify `GOOGLE_APPLICATION_CREDENTIALS` path |
| `Gemini API error` | Check `NEXT_PUBLIC_GOOGLE_API_KEY` |
| `CORS errors` | Whitelist domain in Firebase |
| `Private key invalid` | Ensure `\n` characters in key |

## 📞 **Need Help?**

1. Check browser console for specific errors
2. Verify all environment variables are set
3. Ensure APIs are enabled in Google Cloud
4. Check service account permissions
5. See `SETUP_GUIDE.md` for detailed instructions
