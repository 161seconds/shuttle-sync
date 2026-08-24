# CLAUDE.md - ShuttleSync Project Guidelines

This document provides essential commands, architectural patterns, and development guidelines for Claude Code working on **ShuttleSync**.

---

## 1. Quick Reference & Commands

### Monorepo Structure
- `client/`: React 18 frontend with Vite, Tailwind CSS v4, Framer Motion, and Zustand.
- `server/`: Express.js backend with TypeScript, Mongoose (MongoDB), Socket.IO, and Zod.
- `shared/`: Shared TypeScript types, enums, and constants used across client and server.

### Development Commands
```bash
# Frontend (Client)
cd client
npm run dev          # Start Vite dev server (default: http://localhost:5173)
npm run build        # Typecheck and build production bundle (dist/)
npm run lint         # Run ESLint checks
npx tsc --noEmit     # Verify TypeScript types without emitting files

# Backend (Server)
cd server
npm run dev          # Start Express dev server with ts-node-dev (default: http://localhost:5000)
npm run build        # Compile TypeScript to JavaScript (dist/)
npm test             # Run automated unit & integration test suite (Vitest)
npm run test:watch   # Run Vitest in watch mode

# Root Workspace
npm run dev:all      # Start both client and server concurrently
npm test             # Run backend test suite from root
```

---

## 2. Architecture & Tech Stack

### Frontend (`/client`)
- **Core**: React 18, TypeScript, Vite.
- **Styling**: Tailwind CSS v4 (configured in `src/app.css` via `@theme`), Vanilla CSS, Framer Motion.
- **State Management**:
  - `useAppStore` (`src/store/index.ts`): User authentication, active tab/page routing, sport filter preferences.
  - `useAlertStore` (`src/stores/useAlertStore.ts`): Custom toast alerts, modal confirmations, and error dialogs.
- **Networking**: Axios client (`src/api/axiosClient.ts`) with automatic JWT refresh interceptor and base URL routing.
- **Realtime**: Socket.IO client (`src/api/socket.ts` / `useSocket.ts`) for real-time court locking, chat, and notifications.

### Backend (`/server`)
- **Core**: Node.js, Express, TypeScript.
- **Database**: MongoDB with Mongoose ODM (`src/models/`).
- **Validation**: Zod schema validation middleware (`src/validators/index.ts`).
- **Authentication**: JWT access token + refresh token mechanism.
- **Testing**: Vitest (`src/tests/`).
- **Payment & Webhooks**:
  - SePay Webhook (`POST /api/v1/payment/sepay-webhook`): Verified via HMAC-SHA256 (`x-sepay-signature` + `SEPAY_WEBHOOK_SECRET`) and API Token (`Authorization: Apikey/Bearer` + `SEPAY_API_TOKEN`).
  - Automated booking payment reconciliation using regex matching `(GRP|BK)\d+`.

---

## 3. Core Business Logic & Rules

### 1. Booking System & Race Condition Prevention
- Bookings are divided into 30-minute or 1-hour slots.
- **Slot Locking**: Temporary 5-minute hold via Socket.IO events (`slot:lock`, `slot:unlock`) to prevent simultaneous selection.
- **Database Transactions**: `bookingService.createBooking` uses `mongoose.startSession()` and `session.startTransaction()` to check for time-overlap conflicts before committing.

### 2. Tournament Bracket Generation
- Supports Single-Elimination (Knockout) formats.
- Uses nearest power of 2 (`getNextPowerOf2`) to calculate slots and automatically allocate Byes.
- Interactive drag-and-drop match score recording with instant advancement of winning teams.

### 3. Realtime Chat & Social Hub
- Room-based chat channels for Group Play (`group_${groupId}`).
- Messages support text, emojis, file/attachment previews, and image Data URLs.
- Automated cleanup cron job (`src/cron.ts`) archives/purges old chats after 14 days.

---

## 4. UI/UX & Styling Guidelines

1. **Theme Tokens (Dark/Light Mode)**:
   - **NEVER hardcode raw colors** like `bg-white`, `bg-black`, `text-[#000]` for layout elements.
   - **ALWAYS use semantic tokens**:
     - `bg-background`: Main screen background.
     - `bg-card` / `bg-surface`: Card containers and popups.
     - `text-foreground`: Primary high-contrast text.
     - `text-muted-foreground`: Secondary/subtle text.
     - `border-border`: Standard border stroke.
2. **Viewport Scaling**:
   - The root document applies global viewport scaling for high-density enterprise display.
3. **Micro-animations**:
   - Utilize `framer-motion` for transitions (`AnimatePresence`, spring-damping modals, hover scaling).

---

## 5. Coding Standards & Conventions

- **TypeScript**: Strict typing across all components and services. Avoid using `any` when explicit types exist in `shared/` or local interfaces.
- **Error Handling**: Use the centralized `ApiError` class on the server (`throw ApiError.badRequest('...')`, `throw ApiError.notFound('...')`).
- **Responses**: Use unified helpers `sendSuccess(res, data)`, `sendCreated(res, data)`, `sendPaginated(res, data)`.
- **Git Commits**: Follow Conventional Commits (`feat: ...`, `fix: ...`, `refactor: ...`, `test: ...`, `chore: ...`).
