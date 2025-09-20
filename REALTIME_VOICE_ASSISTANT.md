# Real-Time Voice Assistant for CraftStory

## Overview

CraftStory now features a **Real-Time Voice Assistant** that behaves like a live phone call. The microphone stays on continuously, and the AI assistant responds in real-time using your Gemini API keys, creating a natural conversational experience.

## ✅ Key Features

### 🎤 **Continuous Microphone**
- **Always Listening**: Microphone stays active during the call
- **Automatic Speech Detection**: Detects when user starts/stops speaking
- **Silence Detection**: Automatically processes speech after 3 seconds of silence
- **Real-Time Processing**: Immediate response to user input

### 🤖 **Real-Time AI Responses**
- **Gemini Integration**: Uses your actual API keys for intelligent responses
- **Conversational Flow**: Natural back-and-forth like a phone call
- **Context Awareness**: Remembers conversation history
- **Multi-language Support**: Works in Hindi, Tamil, Bengali, English, etc.

### 📞 **Call-Like Interface**
- **Call Status**: Visual indicators for listening, processing, speaking
- **Phone UI**: Green call button, red end call button
- **Live Status**: Shows when assistant is speaking vs listening
- **Progress Tracking**: Collects profile information automatically

## 🏗️ **How It Works**

### 1. **Call Initiation**
```typescript
// User clicks "Start Voice Call"
await startCall();
// - Requests microphone permission
// - Starts continuous audio stream
// - Plays greeting message
// - Begins listening loop
```

### 2. **Continuous Listening Loop**
```typescript
// Automatic cycle:
1. Start listening (microphone on)
2. Detect speech activity
3. Auto-stop after 3 seconds silence
4. Process audio → text
5. Generate AI response
6. Speak response
7. Resume listening
```

### 3. **Real-Time AI Processing**
```typescript
// For each user input:
const response = await geminiWrapper.generateConversationalResponse(
  userInput,           // What user just said
  'artisan_onboarding', // Context
  conversationHistory,  // Full conversation
  language             // Selected language
);
```

### 4. **Profile Information Extraction**
```typescript
// Automatically extracts:
- Name (when mentioned)
- Craft type (pottery, weaving, carving, etc.)
- Experience years (when mentioned)
- Location (when mentioned)
- Cultural background (when discussed)
```

## 🎯 **Usage Scenarios**

### **Artisan Onboarding**
```
Assistant: "Hello! I'm your AI assistant. Could you tell me your name and what type of craft you practice?"

User: "Hi, I'm Priya and I make blue pottery"