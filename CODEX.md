# CODEX.md - ShuttleSync Repository & Agent Instructions

This guide provides technical specifications, codebase indexing, and development rules for OpenAI Codex and AI agent workflows operating within the **ShuttleSync** repository.

---

## 1. Repository Blueprint

```
shuttle-sync/
  client/                 React, Vite, Tailwind, frontend API clients
  shared/                 Frontend TypeScript contracts
  ShuttleSync.API/         Controllers, auth, SignalR, middleware, DI
  ShuttleSync.Service/     Feature business logic and validation
  ShuttleSync.Repository/  MongoDB entities and MongoContext
  ShuttleSync.Test/        xUnit integration tests
```


---

## 2. Essential Commands

### Build & Run

- API: `dotnet run --project ShuttleSync.API`.
- Backend build: `dotnet build ShuttleSync.sln`.
- Backend tests: set `MONGO_TEST_URI` to a disposable replica set; run `dotnet test ShuttleSync.Test`.
- Frontend: run `npm run dev`, `npm run build`, or `npm test` in `client/`.

---

## 3. Core Architectural Contracts

### Authentication & Authorization
- **Access Tokens**: Short-lived JWTs passed via `Authorization: Bearer <token>`.
- **Refresh Tokens**: Stored securely in database and user cookies, automatically refreshed by `axiosClient.ts` interceptor upon `401 Unauthorized`.
- **Role Verification**: ASP.NET Core authorization plus current MongoDB status/role/tokenVersion validation.

### Payment & Webhook Integration (SePay + VietQR)
- **Endpoint**: `POST /api/v1/payment/sepay-webhook`
- **Security Check 1**: HMAC-SHA256 signature verification comparing `x-sepay-signature` against `SEPAY_WEBHOOK_SECRET`.
- **Security Check 2**: API Key verification checking `Authorization: Apikey <token>` against `SEPAY_API_TOKEN`.
- **Reconciliation**: Auto-confirms bookings by parsing booking codes matching `/(GRP|BK)\d+/`.

### Data Consistency & Concurrency Control
- Booking writes execute in MongoDB transactions with shared court schedule serialization and overlap validation.
- SignalR slot selection uses temporary five-minute locks; maintenance releases expired locks.

---

## 4. Coding Conventions

1. **Design System & Theme Tokens**:
   - Apply Tailwind v4 tokens (`bg-background`, `bg-card`, `bg-surface`, `text-foreground`, `text-muted-foreground`, `border-border`).
   - Avoid hardcoded color literals for structural elements (`#000`, `#fff`, `bg-white`, `bg-black`).
2. **Schema-First Validation**:
   - Define typed C# requests and validate trust-boundary fields in the corresponding Service module.
3. **Error Handling**:
   - Throw `ApiException.BadRequest`, `Unauthorized`, `Forbidden`, or `NotFound`; keep controllers thin.
   - Never leak raw stack traces to the client in production mode.
4. **State Management**:
   - Keep global UI states in Zustand stores (`useAppStore`, `useAlertStore`).
   - Prefer local React component state for form inputs and transient interactions.
