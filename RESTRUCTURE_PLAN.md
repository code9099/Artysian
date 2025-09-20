# CraftStory App Restructure Plan

## Problem Statement

AI-Powered Marketplace Assistant for Local Artisans - Create an AI‑driven platform that helps local artisans market their craft, tell their stories, and expand their reach to new digital audiences.

## Core User Flow

### Page 1: Authentication & Language Selection

- Google Sign-In / Guest mode
- Select from 22 Indian languages
- One-time setup

### Page 2: Role Selection (One-time only)

- "I am an Artisan"
- "Explore Art"
- Never shows again after selection

### Artisan Workflow:

1. **Tutorial** (skippable with swipe up)
   - Voice assistance enabled (Kittu-style)
   - Guides how to use the app
2. **Photo Upload**
   - Voice command "swipe up" opens camera
   - Camera + Gallery option
   - Upload product photos
3. **Voice Assistant Product Info Collection**
   - Call-style voice interaction
   - Collects all product information via voice
4. **Product Summary**
   - Pin template style
   - Fully editable
   - Geolocation for shipping/billing
   - Product gets listed on platform
5. **Close Voice Assistant**
   - Return to product list
6. **Product List Page**
   - Pin-style layout
   - Manage all products

## Key Features to Remove:

- Complex onboarding flows
- Multiple voice assistant types
- Unnecessary navigation
- Role selection on every visit
- Complex authentication flows

## Key Features to Keep/Add:

- Simple 2-page flow
- Voice assistant (Kittu-style)
- Pin template design
- Real Gemini AI integration
- Camera/gallery upload
- Geolocation
- Product marketplace

## Technical Stack:

- Next.js 14 with App Router
- Firebase (Auth, Firestore, Storage)
- Google Cloud AI (Speech, TTS, Gemini)
- Tailwind CSS
- Real-time voice processing
