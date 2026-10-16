# ShuttleSync

ShuttleSync manages court bookings, owner operations, group play, tournaments, chat, reviews, and AI coaching.

## Architecture

- `ShuttleSync.API`: .NET 10 controllers, authentication, SignalR, middleware, maintenance workers.
- `ShuttleSync.Service`: business rules, validation, transactions, integrations.
- `ShuttleSync.Repository`: MongoDB entities and database context.
- `ShuttleSync.Test`: xUnit integration tests.
- `client`: React, TypeScript, Vite, Tailwind CSS.

Dependencies follow API > Service > Repository. REST retains `/api/v1`, existing JSON envelopes, ObjectId strings, lowercase statuses, and cookie authentication. Realtime uses SignalR at `/hubs/realtime`.

## Local development

Requirements: .NET 10 SDK, Node.js 22.13+, MongoDB replica set or Atlas. Transactions require a replica set. Existing MongoDB collections and IDs remain intact; no SQL conversion or destructive reseeding is required.

Copy `.env.example` to `.env` in the repository root. Set `MONGO_URI` to your existing database. Generate two distinct random JWT secrets of at least 32 characters. Existing host environment variables take precedence over `.env`.

Run the API from the repository root:

```bash
dotnet run --project ShuttleSync.API
```

API: `http://localhost:5000/api/v1`. Development Swagger: `http://localhost:5000/swagger`.

Run the frontend separately:

```bash
cd client
npm ci
npm run dev
```

Frontend: `http://localhost:5173`. Set `VITE_API_URL=http://localhost:5000` in `client/.env` when overriding the default. Frontend build values are public; keep provider secrets on the server.

## Configuration

| Variable | Purpose |
| --- | --- |
| `MONGO_URI` | Existing MongoDB database; include `replicaSet=rs0` locally. |
| `PORT` | API port; default `5000`. |
| `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET` | Distinct signing secrets, each at least 32 characters. |
| `CLIENT_URL`, `ALLOWED_ORIGINS` | Exact frontend origins; comma separated. |
| `TRUSTED_PROXIES` | Optional comma separated proxy IPs for forwarded client IP and HTTPS headers. Loopback is trusted by default. |
| `EMAIL_USER`, `EMAIL_PASS` | Gmail SMTP credentials for OTP. |
| `GEMINI_API_KEY` | Server-side AI Coach access. |
| `SEPAY_ACCOUNT_NUMBER` | Receiving account for payment matching. |
| `SEPAY_WEBHOOK_SECRET`, `SEPAY_API_TOKEN` | Webhook authentication; every configured credential must match. |

Use `ASPNETCORE_ENVIRONMENT=Development` locally. Production requires HTTPS, secure cookies, explicit frontend origins, and valid JWT secrets. Missing provider configuration disables the corresponding integration.

Frontend QR settings: `VITE_SEPAY_BANK_ID`, `VITE_SEPAY_BANK_ACC`, `VITE_SEPAY_BANK_HOLDER`. Compose derives the account number from `SEPAY_ACCOUNT_NUMBER`. Expired, cancelled, or underpaid transfers require reconciliation; paid bookings need explicit refund handling.

## Verification

```bash
dotnet build ShuttleSync.sln
cd client
npm run build
npm test
```

Backend tests require `MONGO_TEST_URI` pointing to a disposable replica set. They create and remove their own `shuttle_csharp_test_*` database. Never use production infrastructure.

PowerShell, from the repository root:

```powershell
$env:MONGO_TEST_URI='mongodb://127.0.0.1:27018/?replicaSet=rs0&directConnection=true'
dotnet test ShuttleSync.Test
```

CI builds both applications, starts a test replica set, runs backend and frontend tests, then builds Docker images.

## Docker

Configure root `.env`, then run:

```bash
docker compose up --build
```

Compose starts a single-node replica set, waits for its primary, then starts the .NET API and frontend. Database files persist in `mongodb_data`; MongoDB has no published port. Compose uses `badminton_db`; standalone development defaults to `shuttle_sync`. Set `MONGO_URI` explicitly when connecting to existing data. Back up data before deployment.

Default frontend: `http://localhost`. API: `http://localhost:5000`. Configure `VITE_API_URL` to the API address reachable by the browser; set `ALLOWED_ORIGINS` to the deployed frontend origins. Rebuild the frontend image after changing build variables.
