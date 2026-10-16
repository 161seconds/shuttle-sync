# 🏸 ShuttleSync - Badminton & Pickleball Court Booking System

![Tech Stack](https://img.shields.io/badge/Stack-MERN_|_TypeScript-blue?style=flat-square)
![License](https://img.shields.io/badge/License-MIT-green?style=flat-square)
![Status](https://img.shields.io/badge/Status-Done-emerald?style=flat-square)

ShuttleSync is a next-generation, premium court booking and club management platform tailored for Badminton and Pickleball enthusiasts, as well as court owners. Engineered with Clean Architecture principles and a unified Monorepo structure, ShuttleSync guarantees an elite booking workflow with strict real-time state synchronization, completely eradicating double-booking conflicts.

Designed with a state-of-the-art glassmorphism aesthetic and purposeful motion, ShuttleSync delivers a "wow" experience without sacrificing usability or performance.

---

## ✨ Key Features

### For Athletes & Players
- **Flexible Time Picker:** Intuitively drag, expand, or adjust custom reservation durations with 30-minute granularities. No more rigid, pre-configured timeslots.
- **Matchmaking Hub & Dynamic Brackets:** Spawn custom open matchmaking matches (Group Play) that dynamically archive when past schedule. Includes fully automated, esports-ready knockout tournament bracket trees.
- **AI Coach Chatbot:** Seamlessly embedded Gemini Flash AI acts as an elite tactician for BWF rulesets and training advice. Features auto-recovery retry mechanisms for transient errors.
- **Premium User Experience:** Meticulously crafted dark theme interface using Framer Motion, backdrop blur, custom animated dropdowns, and an optimized 80% scale enterprise viewport for maximum spaciousness.

### For Court Owners & Admins
- **Real-time Conflict-Free Engine:** Advanced concurrency filtering on both client and server layers using an interval intersection mathematical model ($Start_{1} < End_{2} \land End_{1} > Start_{2}$) to eliminate race conditions.
- **Owner Expense & Profit Tracking:** Comprehensive financial tracking to record utility, maintenance, and salary expenses, paired with real-time Net Profit analytics and categorizations.
- **Interactive Insights Dashboard:** Rich data visualizations via Recharts, mapping out localized metrics including granular financial streams and comprehensive sport-type volumetric split analysis.
- **Secure Architecture:** Built on secure HttpOnly cookies with smooth background re-authentication mechanisms to securely rehydrate active user state without UI flickers.

---

## 💻 Tech Stack

### Frontend (Client)
- **Framework:** React.js + Vite (Strictly typed with TypeScript)
- **Styling:** Tailwind CSS (Deep immersive dark-mode, glassmorphism, global scaling)
- **State Management:** Zustand (Ultralightweight, predictable centralized store)
- **Animation:** Framer Motion (Fluid, hardware-accelerated motion choreography)
- **Icons & Charts:** Lucide React, Recharts

### Backend (Server)
- **Runtime & Framework:** Node.js + Express (Strict Object-Oriented TypeScript, Clean Architecture layers)
- **Database:** MongoDB + Mongoose (Advanced aggregation, spatial indexing)
- **Real-time Engine:** Socket.IO (Bidirectional event-driven web-sockets for instant broadcast propagation)
- **AI Integration:** `@google/generative-ai` (Rigid, declarative system prompting)

---

## 📂 Project Structure (Monorepo)

The repository leverages an end-to-end type-safe Monorepo layout, isolating presentation structures and orchestration nodes while sharing foundational interfaces:

```text
shuttle-sync/
├── client/          # Vite + React Frontend Application (UI Layer)
├── server/          # Node.js + Express RESTful & WebSocket Backend (Clean Architecture)
└── shared/          # Centralized Shared Repository hosting data types, validation schemas & enums
```

---

## 🚀 Getting Started

### 1. Prerequisites
- **Node.js**: v22.13.0 or higher
- **MongoDB**: Replica set (including a single-node replica set) or MongoDB Atlas. Standalone MongoDB cannot run booking transactions.

### 2. Installation

Clone the repository and install dependencies for both server and client:

```bash
# Install Server dependencies
cd server
npm install

# Install Client dependencies
cd ../client
npm install
```

### 3. Environment Variables

**Create a `.env` file in the `server/` directory:**
```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/badminton_db?replicaSet=rs0
JWT_ACCESS_SECRET=replace_with_a_random_secret_at_least_32_characters
JWT_REFRESH_SECRET=replace_with_a_different_random_secret_at_least_32_characters
CLIENT_URL=http://localhost:5173
ALLOWED_ORIGINS=http://localhost:5173
GEMINI_API_KEY=your_secured_gemini_api_key_here
```

**Create a `.env` file in the `client/` directory:**
```env
VITE_API_URL=http://localhost:5000
```

### 4. Running the Application

You will need to run the client and server concurrently in two separate terminal instances.

**Terminal 1 (Backend):**
```bash
cd server
npm run dev
```

**Terminal 2 (Frontend):**
```bash
cd client
npm run dev
```

### Deployment and payment configuration

Copy the root `.env.example` to `.env` for Docker Compose, or `server/.env.example` to `server/.env` for a local API. Generate each JWT secret separately with `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`.

`docker compose up --build` starts a single-node MongoDB replica set, waits for its primary, then starts the API. Production requires distinct JWT secrets of at least 32 characters, HTTPS, and exact frontend origins in `ALLOWED_ORIGINS`. Set `VITE_API_URL` to the API URL reachable by the browser. The database has no published port.

Automatic payments require `SEPAY_ACCOUNT_NUMBER` and at least one of `SEPAY_WEBHOOK_SECRET` or `SEPAY_API_TOKEN`. Every configured credential is required on each webhook. Match `VITE_SEPAY_BANK_ACC` to that account for local frontend builds; Compose derives it from `SEPAY_ACCOUNT_NUMBER`. Configure `VITE_SEPAY_BANK_ID` and `VITE_SEPAY_BANK_HOLDER` in the frontend environment. Missing webhook configuration disables automatic confirmation. Expired, cancelled, or underpaid orders require reconciliation; paid orders cannot be cancelled without refund handling.

OTP email requires `EMAIL_USER` and `EMAIL_PASS`. No email or payment provider credentials are bundled.

Run `npm test` separately in `server/` and `client/`. Server integration tests run when `MONGO_TEST_URI` points to a test replica set; they create and remove a separate `shuttle_test_*` database. CI runs these tests automatically.
