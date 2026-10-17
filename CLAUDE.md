# CLAUDE.md - ShuttleSync Project Guidelines

This document provides essential commands, architectural patterns, and development guidelines for Claude Code working on **ShuttleSync**.

---

## 1. Quick Reference & Commands

### Monorepo Structure
- `client/`: React 19 frontend with Next.js 16 App Router, Tailwind CSS v4, Framer Motion, and Zustand.
- `ShuttleSync.API`, `ShuttleSync.Service`, `ShuttleSync.Repository`: .NET 10 API > Service > Repository with MongoDB.
- `ShuttleSync.Test`: xUnit integration tests against a test replica set.

### Development Commands
```bash
# Frontend (Client)
cd client
npm run dev          # Start Next.js dev server (default: http://localhost:3000)
npm run build        # Typecheck and build Next.js production output (.next/)
npx tsc --noEmit     # Verify TypeScript types without emitting files

# Backend, from repository root
dotnet run --project ShuttleSync.API
dotnet build ShuttleSync.sln
# Set MONGO_TEST_URI to a disposable replica set first
dotnet test ShuttleSync.Test
```

---

## 2. Architecture & Tech Stack

### Frontend (`/client`)
- **Core**: Next.js 16 App Router, React 19, TypeScript.
- **Styling**: Tailwind CSS v4 (configured in `src/app.css` via `@theme`), Vanilla CSS, Framer Motion.
- **State Management**:
  - `useAppStore` (`src/store/index.ts`): User authentication and sport filter preferences; page routing uses Next.js.
  - `useAlertStore` (`src/stores/useAlertStore.ts`): Custom toast alerts, modal confirmations, and error dialogs.
- **Networking**: Axios client (`src/api/axiosClient.ts`) with automatic JWT refresh interceptor and base URL routing.
- **Realtime**: SignalR at `/hubs/realtime` for court locking, chat, and notifications.

### Backend
- **Core**: .NET 10 ASP.NET Core; thin controllers, DI, feature services.
- **Database**: MongoDB.Driver, typed entities and MongoContext; existing data/IDs retained.
- **Service modules**: `Request.cs`, `Response.cs`, `IService.cs`, `Service.cs`, and `Validator/`. Controllers and feature dependencies inject interfaces; services keep database and business-state checks.
- **Authentication**: JWT cookies and refresh rotation; current Mongo status/role/tokenVersion checks.
- **Testing**: `ShuttleSync.Test` with xUnit; MongoDB replica set required.
- **Payment & Webhooks**:
  - SePay Webhook (`POST /api/v1/payment/sepay-webhook`): Verified via HMAC-SHA256 (`x-sepay-signature` + `SEPAY_WEBHOOK_SECRET`) and API Token (`Authorization: Apikey/Bearer` + `SEPAY_API_TOKEN`).
  - Automated booking payment reconciliation using regex matching `(GRP|BK)\d+`.

---

## 3. Core Business Logic & Rules

### 1. Booking System & Race Condition Prevention
- Bookings are divided into 30-minute or 1-hour slots.
- **Slot Locking**: Temporary 5-minute hold via SignalR events (`slot:select`, `slot:deselect`) to prevent simultaneous selection.
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

- **TypeScript**: Strict typing across all components and services. Keep frontend contracts with their API clients; avoid `any` when local interfaces exist.
- **Error Handling**: Use `ShuttleSync.Service.Exceptions.ApiException` in services; middleware maps errors to HTTP.
- **Responses**: Use `ApiControllerBase.Success` and `SuccessCreated`, preserving the REST envelope.
- **Git Commits**: Follow Conventional Commits (`feat: ...`, `fix: ...`, `refactor: ...`, `test: ...`, `chore: ...`).
