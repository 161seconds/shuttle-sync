# 🏸 ShuttleSync - Real-time Badminton & Pickleball Court Booking System

![Tech Stack](https://img.shields.io/badge/Stack-MERN_|_TypeScript-blue?style=flat-square)
![License](https://img.shields.io/badge/License-MIT-green?style=flat-square)
![Status](https://img.shields.io/badge/Status-Done-emerald?style=flat-square)

ShuttleSync is a next-generation online court booking and club management platform tailored for both Badminton and Pickleball enthusiasts. Built on top of Clean Architecture principles and a unified Monorepo structure, the system guarantees an elite booking workflow with strict real-time state synchronization to completely eradicate double-booking conflict vulnerabilities.

---

## 🔥 Core Features Completed

- **Flexible Time Picker:** Allows athletes to intuitively drag, expand, or adjust custom reservation durations with 30-minute step granularities rather than getting cornered into static, pre-configured timeslots.
- **Real-time Conflict-Free Engine:** An advanced concurrency filtering engine implemented on both client and server layers using an interval intersection mathematical model ($Start_{1} < End_{2} \land End_{1} > Start_{2}$) to eliminate race conditions.
- **Owner Expense Tracking (New):** Comprehensive financial tracking for court owners to record utility, maintenance, and salary expenses, paired with real-time Net Profit analytics and Pie Chart categorizations.
- **Premium Glassmorphism UI (New):** Features a meticulously crafted dark theme interface using Framer Motion, backdrop blur, custom animated dropdowns, and an optimized 80% scale enterprise viewport.
- **Matchmaking Hub & Dynamic Brackets:** Empowered users to spawn custom open matchmaking matches (Group Play) that dynamically hide or archive when reaching past schedule intervals. Includes fully automated, esports-ready knockout tournament bracket trees.
- **AI Coach Chatbot Integration:** Seamlessly embedded Gemini Flash Latest through an auto-recovery retry mechanism that intercepts transient 503 errors, acting as an elite tactician for BWF rulesets and training advice.
- **Secure Cookie Auth & Persistent Sessions:** Migrated standard volatile storage architectures completely over to HttpOnly cookies, combined with a smooth background re-authentication mechanism that securely rehydrates active user state upon page refreshes without any UI flickers.
- **Owner & Admin Insights Dashboard:** Interactive visualizations integrated via Recharts, mapping out localized metrics including granular financial streams and comprehensive sport-type volumetric split analysis.

---

## 💻 Tech Stack Overview

**Frontend (Client):**
- React.js + Vite (Fully typed with TypeScript for complete structural safety)
- Tailwind CSS (Configured with deep immersive dark-mode sub-themes and global scaling)
- Zustand (Ultralightweight, predictable centralized state store)
- Framer Motion (Fluid, hardware-accelerated motion choreography and esports transitions)
- Lucide React (Consistent, clean vector iconography system)
- Recharts (Rich and interactive data visualization)

**Backend (Server)**
- Node.js + Express (Strict Object-Oriented TypeScript structure relying on Clean Architecture layers)
- MongoDB + Mongoose (Advanced aggregation, spatial indexing, and optimized document schema design)
- Socket.IO (Bidirectional event-driven web-sockets layer managing instant broadcast propagation)
- @google/generative-ai (Rigid, declarative system prompting to enforce dependable structured JSON formatting outputs)

---

## 📂 Project Structure (Monorepo Layout)

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
- Node.js (Runtime environment version v18.0.0 or higher required)
- MongoDB Compass (Local instances or accessible cloud cluster endpoint strings)

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

### 3. Environment Variables (.env)

**Create a `.env` file in the `server/` directory:**
```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/badminton_db
JWT_SECRET=shuttlesync_secret_key_2026
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
