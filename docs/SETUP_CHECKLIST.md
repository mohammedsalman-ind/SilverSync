# 📋 SilverSync - Complete Beginner Setup Checklist

This document is your step-by-step, zero-confusion guide to setting up every service, account, and environment variable needed for **SilverSync**.
Everything listed here uses **100% FREE tiers** with **NO credit card or paid billing required**.

---

## 📑 Quick Navigation & Term Dictionary

| Term | What it means in simple words |
| :--- | :--- |
| **Spark Plan** | Firebase's completely free tier that requires zero credit card or billing account. |
| **Web App Config** | Public configuration keys that allow your React frontend to connect to Firebase Auth. |
| **Service Account** | A secure JSON key file that gives your Node.js backend admin rights to verify logins and read/write Firestore. |
| **API Key** | A secret password-like code that authorizes your backend to call external services (e.g., Gemini or Brevo). |
| **Brevo** | A free transactional email service giving 300 free emails/day via HTTPS without blocking port 587. |
| **Cron Pinger** | A free external scheduler (like cron-job.org) that pings your backend every 5 minutes to run reminder jobs and keep free servers awake. |
| **Firebase Emulator** | A local simulator running on your computer so you can develop and test without touching the live internet or cloud data. |

---

## 1. 🧰 Local Machine Prerequisites

Make sure the following tools are installed on your computer:

- [ ] **Node.js 20+ & npm**:
  - Check version in terminal: `node -v` (should be v20.x or v22.x/v24.x) and `npm -v` (v10+ or v11+).
- [ ] **Git**:
  - Check version in terminal: `git --version`.
- [ ] **Firebase CLI (Global)**:
  - Run in terminal: `npm install -g firebase-tools`
  - Check version: `firebase --version`
  - Login to your Google account: `firebase login`
- [ ] **Java JRE (Optional, for local Firebase Emulators)**:
  - If you want to run `npm run dev:emulators`, verify Java: `java -version`. (If not installed, you can connect directly to your free Firebase cloud project).

---

## 2. 🔥 Firebase Project Setup (100% Free Spark Plan)

Follow these steps to create your Firebase database, auth, and hosting:

### Step 2.1: Create Project
- [ ] Go to the [Firebase Console](https://console.firebase.google.com/).
- [ ] Click **"Add project"** (or **"Create a project"**).
- [ ] Enter a project name (e.g. `silversync-app`).
- [ ] Disable Google Analytics (optional, saves setup time) and click **Create Project**.
- [ ] Ensure your project is on the **Spark plan** (default free tier, no credit card).

### Step 2.2: Enable Authentication Providers
- [ ] In the left sidebar, click **Build** -> **Authentication**, then click **Get Started**.
- [ ] Under the **Sign-in method** tab:
  - [ ] Click **Email/Password** -> toggle **Enable** (leave Email link disabled) -> click **Save**.
  - [ ] Click **Add new provider** -> select **Google** -> toggle **Enable** -> choose your support email -> click **Save**.

### Step 2.3: Create Cloud Firestore Database
- [ ] In the left sidebar, click **Build** -> **Firestore Database** -> click **Create database**.
- [ ] Choose a database location closest to your users (e.g. `asia-south1` for Mumbai/India or `us-central1`).
- [ ] Select **Start in production mode** (or test mode; we will deploy secure `firestore.rules` in Phase 1).
- [ ] Click **Create**.

### Step 2.4: Register Web App (For Frontend Config)
- [ ] In Firebase Console, click the **Gear icon (⚙️)** next to "Project Overview" -> **Project settings**.
- [ ] In the **General** tab, scroll down to **"Your apps"** and click the **Web icon (`</>`)**.
- [ ] App nickname: `silversync-web`.
- [ ] Check the box: **"Also set up Firebase Hosting for this app"**.
- [ ] Click **Register app**, then click **Next** through the setup steps.
- [ ] Copy the configuration values into your `client/.env` file:

| Firebase Console Value | Client `.env` Variable |
| :--- | :--- |
| `apiKey` | `VITE_FIREBASE_API_KEY` |
| `authDomain` | `VITE_FIREBASE_AUTH_DOMAIN` |
| `projectId` | `VITE_FIREBASE_PROJECT_ID` |
| `storageBucket` | `VITE_FIREBASE_STORAGE_BUCKET` |
| `messagingSenderId` | `VITE_FIREBASE_MESSAGING_SENDER_ID` |
| `appId` | `VITE_FIREBASE_APP_ID` |

### Step 2.5: Generate Admin Service Account Key (For Backend)
- [ ] In **Project settings**, click the **Service accounts** tab.
- [ ] Select **Node.js** and click **Generate new private key**.
- [ ] Confirm by clicking **Generate key**. A `.json` file will download to your computer.
- [ ] Rename this file to `serviceAccountKey.json` and move it into the `server/` folder:
  - Path: `server/serviceAccountKey.json`
  - *(Note: `.gitignore` already protects this file so it will NEVER be pushed to Git).*
- [ ] Alternatively, for cloud hosting, you can set `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, and `FIREBASE_PRIVATE_KEY` directly in `server/.env`.

---

## 3. 🤖 Google Gemini API Key (Google AI Studio - 100% Free)

- [ ] Go to [Google AI Studio](https://aistudio.google.com/app/apikey).
- [ ] Sign in with your Google account.
- [ ] Click **"Create API key"** -> select your Google Cloud / Firebase project or create a key in a new project.
- [ ] Copy your API key (starts with `AIzaSy...`).
- [ ] Paste into `server/.env`:
  ```env
  GEMINI_API_KEY=AIzaSyYourGeneratedGeminiKeyHere
  GEMINI_MODEL=gemini-2.5-flash
  ```

---

## 4. 📧 Email Service Setup (Brevo HTTPS API - 100% Free)

Brevo provides **300 free emails per day** via HTTPS API. This is crucial because free backend hosting providers (like Render or Railway) block outgoing SMTP port 587.

### Option A: Brevo (Recommended)
- [ ] Sign up for a free account at [Brevo (formerly Sendinblue)](https://app.brevo.com/).
- [ ] Confirm your email address.
- [ ] In Brevo Dashboard, click your profile menu (top right) -> **Senders, Domains & Dedicated IPs**.
- [ ] Click **Senders** -> click **Add a sender** -> enter your sender name (e.g., `SilverSync Care`) and your email address. Verify the email via the code sent to your inbox.
- [ ] Click your profile menu (top right) -> **SMTP & API** -> **API Keys** tab.
- [ ] Click **Generate a new API key**, name it `silversync-dev`, and copy the key (starts with `xkeysib-...`).
- [ ] Paste into `server/.env`:
  ```env
  EMAIL_PROVIDER=brevo
  BREVO_API_KEY=xkeysib-your-key-here
  BREVO_SENDER_EMAIL=your-verified-sender@email.com
  BREVO_SENDER_NAME="SilverSync Care"
  ```

### Option B: Gmail App Password (SMTP Fallback)
If you prefer using your personal Gmail:
- [ ] Go to your [Google Account Security](https://myaccount.google.com/security).
- [ ] Enable **2-Step Verification**.
- [ ] Search for **App passwords** in the top search bar.
- [ ] Name the app `SilverSync`, click **Create**, and copy the 16-character password (e.g. `abcd efgh ijkl mnop`).
- [ ] In `server/.env`, set:
  ```env
  EMAIL_PROVIDER=smtp
  SMTP_HOST=smtp.gmail.com
  SMTP_PORT=587
  SMTP_USER=your-email@gmail.com
  SMTP_PASS=abcdefghijklmnop
  SMTP_FROM_EMAIL=your-email@gmail.com
  ```

---

## 5. 📅 Google Calendar OAuth (Required for Phase 6)

*Note: You do NOT need this for Phases 0 to 5. We will prompt you right before Phase 6 starts.*

- [ ] Go to the [Google Cloud Console](https://console.cloud.google.com/).
- [ ] Select your Firebase project.
- [ ] Go to **APIs & Services** -> **Library** -> search for **Google Calendar API** -> click **Enable**.
- [ ] Go to **APIs & Services** -> **OAuth consent screen** -> set User Type to **External** -> fill app name & email -> Save.
- [ ] Go to **APIs & Services** -> **Credentials** -> click **Create Credentials** -> **OAuth Client ID**.
- [ ] Application type: **Web application**.
- [ ] Authorized redirect URIs: `http://localhost:5000/api/v1/auth/google/callback` (and your production backend URL once deployed).
- [ ] Copy **Client ID** and **Client Secret** into `server/.env`:
  ```env
  GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
  GOOGLE_CLIENT_SECRET=your-client-secret
  GOOGLE_REDIRECT_URI=http://localhost:5000/api/v1/auth/google/callback
  ```

---

## 6. 🌐 Backend Hosting & External Cron Pinger (Required for Phase 7)

*Note: You do NOT need this until Phase 7. We will guide you step by step.*

- [ ] **GitHub Repository**:
  - Create a private or public repository on GitHub (e.g. `github.com/your-username/silversync`).
  - Push the code: `git remote add origin ...` and `git push -u origin main`.
- [ ] **Free Backend Hosting Account** (Choose one during Phase 7):
  - **Render**: Free Web Service running Dockerfile (https://render.com).
  - **Railway**: $5 trial / Hobby plan (https://railway.app).
  - **Utho Cloud Linux VM**: Using your developer free credits.
- [ ] **Free External Cron Pinger (cron-job.org)**:
  - Sign up free at [cron-job.org](https://cron-job.org/).
  - Free 1-minute to 5-minute pings that trigger `/internal/cron/*` endpoints with your `CRON_SECRET` header, preventing sleeping free servers from going cold.

---

## 7. 🧪 Verification Checklist (How to know you're ready)

Before starting development:
- [ ] `client/.env` created from `client/.env.example` with Firebase keys filled.
- [ ] `server/.env` created from `server/.env.example` with Gemini and Brevo keys filled.
- [ ] `server/serviceAccountKey.json` placed in `server/` (or Firebase credentials in `server/.env`).
- [ ] Run `npm run setup` from repository root.
- [ ] Verify both client and server start with `npm run dev`.

---
*Ready to proceed? Once you have reviewed this checklist or created your `.env` files, simply reply with **"continue"** to start Phase 1!*
