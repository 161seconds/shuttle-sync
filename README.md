# 🏸 ShuttleSync - Real-time Badminton Court Booking System

![Tech Stack](https://img.shields.io/badge/Stack-MERN_|_TypeScript-blue?style=flat-square)
![License](https://img.shields.io/badge/License-MIT-green?style=flat-square)
![Status](https://img.shields.io/badge/Status-In_Development-orange?style=flat-square)

ShuttleSync is a comprehensive online badminton court booking platform built with **Clean Architecture** and a **Monorepo** structure. The system ensures a seamless booking experience featuring real-time state synchronization to prevent double-booking conflicts.

---

## Core Features

- **Authentication & Authorization:** Secure JWT-based Login/Register with distinct roles (`user` and `admin`).
- **Real-time Synchronization:** Powered by Socket.IO. When a user selects or books a time slot, it is instantly disabled for all other users currently viewing the same court.
- **Mock Payment Gateway:** Simulates a checkout flow with QR code generation, transaction confirmation, and automated invoice status updates.
- **Admin Dashboard:** Full CRUD management for courts, real-time booking oversight, and revenue analytics.

---

## Tech Stack

**Frontend (Client):**
- React.js + Vite (TypeScript)
- Tailwind CSS + shadcn/ui (Modern UI components)
- Zustand (Global state management)
- React Query (Data fetching, caching, and synchronization)
- React Hook Form + Zod (Form validation)

**Backend (Server):**
- Node.js + Express (TypeScript)
- MongoDB + Mongoose (Database & Modeling)
- Socket.IO (Event-driven real-time engine)
- JWT & bcryptjs (Security & Encryption)

---

## Project Structure (Monorepo)

The project utilizes a strict monorepo layout, allowing types and interfaces to be seamlessly shared between the client and server:

```text
badminton-management/
├── client/          # React Frontend application
├── server/          # Express Backend API (Clean Architecture)
└── shared/          # Shared TypeScript interfaces and types
```

---

## Getting Started

### 1. Prerequisites
- [Node.js](https://nodejs.org/) (v18 or higher)
- [MongoDB Compass](https://www.mongodb.com/products/compass) (For local database hosting)

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
