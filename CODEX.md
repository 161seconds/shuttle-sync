# CODEX.md - ShuttleSync Repository & Agent Instructions

This guide provides technical specifications, codebase indexing, and development rules for OpenAI Codex and AI agent workflows operating within the **ShuttleSync** repository.

---

## 1. Repository Blueprint

```
shuttle-sync/
├── client/                     # Frontend Application (React 18 + Vite)
│   ├── src/
│   │   ├── api/               # API clients (axiosClient.ts, chat.api.ts, socket.ts)
│   │   ├── components/        # Reusable UI components & Layouts
│   │   ├── features/          # Domain-specific modules (admin, booking, owner, onboarding)
│   │   ├── pages/             # Page views (chat, profile, court detail, support)
│   │   ├── store/             # Global Zustand stores (useAppStore, useAlertStore)
│   │   ├── types/             # Frontend-specific TypeScript interfaces
│   │   ├── utils/             # Helpers, formatters, and design theme configs
│   │   ├── App.tsx            # Root component with routing and active view switch
│   │   └── app.css            # Tailwind CSS v4 design tokens and theme variables
│   ├── package.json
│   └── vite.config.ts
├── server/                     # Backend API & WebSocket Server (Node.js + Express)
│   ├── src/
│   │   ├── config/            # Server environment, database, and CORS configurations
│   │   ├── controllers/       # HTTP Request Handlers (auth, booking, payment, tournament)
│   │   ├── middlewares/       # Auth guards, role checks, validation, error handling
│   │   ├── models/            # Mongoose schemas (User, Court, Booking, Tournament, Report)
│   │   ├── routes/            # Express router modules
│   │   ├── services/          # Core business logic & transaction operations
│   │   ├── socket/            # Socket.IO event handlers (court locking, real-time chats)
│   │   ├── tests/             # Automated test suite with Vitest
│   │   ├── utils/             # ApiError, response wrappers, seeders, helpers
│   │   ├── validators/        # Zod request validation schemas
│   │   └── app.ts             # Express application setup
│   └── package.json
└── shared/                     # Shared TypeScript contracts across client & server
    ├── index.ts               # Shared exports
    └── types.ts               # Core domain types & Enums (UserRole, SportType, etc.)
```

---

## 2. Essential Commands

### Build & Run
| Action | Client | Server | Root |
| :--- | :--- | :--- | :--- |
| **Start Dev** | `cd client && npm run dev` | `cd server && npm run dev` | `npm run dev:all` |
| **Production Build** | `cd client && npm run build` | `cd server && npm run build` | `npm run build:all` |
| **Run Tests** | — | `cd server && npm test` | `npm test` |
| **Typecheck** | `cd client && npx tsc --noEmit` | `cd server && npx tsc --noEmit` | — |

---

## 3. Core Architectural Contracts

### Authentication & Authorization
- **Access Tokens**: Short-lived JWTs passed via `Authorization: Bearer <token>`.
- **Refresh Tokens**: Stored securely in database and user cookies, automatically refreshed by `axiosClient.ts` interceptor upon `401 Unauthorized`.
- **Role Verification**: Middleware `authenticate`, `requireAdmin`, `requireCourtOwner`.

### Payment & Webhook Integration (SePay + VietQR)
- **Endpoint**: `POST /api/v1/payment/sepay-webhook`
- **Security Check 1**: HMAC-SHA256 signature verification comparing `x-sepay-signature` against `SEPAY_WEBHOOK_SECRET`.
- **Security Check 2**: API Key verification checking `Authorization: Apikey <token>` against `SEPAY_API_TOKEN`.
- **Reconciliation**: Auto-confirms bookings by parsing booking codes matching `/(GRP|BK)\d+/`.

### Data Consistency & Concurrency Control
- `BookingService.createBooking` executes inside a MongoDB session transaction:
  ```typescript
  const session = await mongoose.startSession();
  session.startTransaction();
  // 1. Check interval intersection for subCourtId & date range
  // 2. Insert booking record
  // 3. Commit transaction
  ```
- **Socket.IO TimeSlot Lock**: Enforces a temporary 5-minute reservation window with automatic server-side cron release.

---

## 4. Coding Conventions

1. **Design System & Theme Tokens**:
   - Apply Tailwind v4 tokens (`bg-background`, `bg-card`, `bg-surface`, `text-foreground`, `text-muted-foreground`, `border-border`).
   - Avoid hardcoded color literals for structural elements (`#000`, `#fff`, `bg-white`, `bg-black`).
2. **Schema-First Validation**:
   - Always define or update Zod schemas in `server/src/validators/index.ts` before creating new API endpoints.
3. **Error Handling**:
   - Throw `ApiError.badRequest()`, `ApiError.unauthorized()`, `ApiError.forbidden()`, or `ApiError.notFound()`.
   - Never leak raw stack traces to the client in production mode.
4. **State Management**:
   - Keep global UI states in Zustand stores (`useAppStore`, `useAlertStore`).
   - Prefer local React component state for form inputs and transient interactions.
