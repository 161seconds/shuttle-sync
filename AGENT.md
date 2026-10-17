# ShuttleSync - AI Agent Guidelines (AGENT.md)

This document provides context, rules, and architectural guidelines for AI agents working on the **ShuttleSync** project. Always refer to this document to understand the codebase structure and development conventions.

## 1. Project Overview
**ShuttleSync** is a platform for booking and managing badminton (and potentially other sports like pickleball) courts. It features user facing apps for booking, AI coaching, Group Play (Matchmaking), and social engagement, as well as an admin dashboard for court owners to manage revenues, expenses, and operations.

## 2. Tech Stack
- **Frontend**: Next.js 16 (React), TypeScript, Tailwind CSS v4, Framer Motion (Animations), Recharts (Charts), Lucide React (Icons), Zustand (State Management). Global 80% scale applied via HTML font-size for an enterprise viewport.
- **Backend**: .NET 10, ASP.NET Core, MongoDB.Driver, JWT cookies, SignalR.
- **Monorepo Structure**:
  - `/client`: Frontend codebase.
  - `/ShuttleSync.API`, `/ShuttleSync.Service`, `/ShuttleSync.Repository`: Active C# backend.
  - `/ShuttleSync.Test`: xUnit backend integration tests.

## 3. Frontend Architecture (`/client`)
- `src/app/`: Next.js routes and layouts; `src/views/`: reusable page components (e.g., `ProfilePage`, `AiCoach`, `RulesPage`).
- `src/features/`: Feature-specific logic and complex components (e.g., `admin/AdminDashboard.tsx`, `booking/BookingSheet.tsx`).
- `src/components/`: Reusable UI components (e.g., `Sidebar`, `BottomNav`, `theme-provider`).
- `src/api/`: Axios configurations and API wrapper functions.
- `src/store/` & `src/stores/`: Zustand global state managers (`useAppStore`, `useAlertStore`).
- `src/app.css`: The central CSS file using **Tailwind v4** syntax. It defines `@theme` variables (`--color-background`, `--color-foreground`, `--color-card`, etc.) and handles Light/Dark mode via the `.dark` class toggle.

## 4. Backend Architecture
- `ShuttleSync.API`: Thin controllers, authentication, SignalR `/hubs/realtime`, middleware, DI.
- `ShuttleSync.Service`: Business logic and validation in feature modules; services inject MongoContext directly.
- `ShuttleSync.Repository`: MongoDB entities and collection mappings; preserve existing ObjectId IDs and collections.
- Dependencies: API > Service > Repository. Keep `/api/v1` contracts and camelCase JSON.
- Run: `dotnet run --project ShuttleSync.API`. Build: `dotnet build ShuttleSync.sln`.
- Tests: set `MONGO_TEST_URI` to a test replica set, then `dotnet test ShuttleSync.Test`.

## 5. UI/UX Rules & Styling Guidelines (CRITICAL)
1. **Never use hardcoded black/white colors**: 
   - DO NOT use `bg-white`, `bg-black`, `text-black`, `text-white`, or explicit hex codes like `bg-[#000]` for general layout backgrounds and text unless absolutely necessary (e.g., text on a solid dark button).
   - **ALWAYS use theme tokens**: `bg-background`, `bg-card`, `bg-surface`, `text-foreground`, `text-muted-foreground`, `border-border`.
2. **Gradients and Glassmorphism**:
   - The UI uses rich, dynamic gradients to look premium. 
   - When designing gradients, ensure they are visible in BOTH Light and Dark themes. Do not use white gradients in Light mode that blend into the white background.
   - Use opacity and backdrop-blur for glassmorphism effects (e.g., `bg-background/80 backdrop-blur-xl`).
3. **Typography**:
   - Use bold and high-contrast typography. 
   - Highlight key values with primary colors (e.g., `text-emerald-400`, `text-emerald-500`).
4. **Responsive Design**:
   - Desktop uses a left `Sidebar`. Mobile uses a `BottomNav`.
   - Ensure mobile safe areas are respected. The `<html>` and `<body>` tags have `min-height: 100vh` and global background colors applied to prevent black artifacts on mobile browsers (Safari/PWA).

## 6. Feature-Specific Rules
- **Booking System**: 
  - Time slots are divided into 30-minute blocks. 
  - Users select combinations of blocks (e.g., 2 blocks = 1 hour).
  - Time selection UI should favor modern approaches like a rolling "wheel" picker rather than dense grids.
- **AI Coach**: 
  - Uses simulated typing effects (`streamText`). 
  - Do not hardcode dark gradients in the chat input area; use `from-background` to respect Light/Dark mode.

## 7. Development Workflow
- When fixing UI bugs involving colors, always check `app.css` and the Light/Dark mode behavior first.
- Keep components small and extracted if they become too complex.
- When creating new features, follow the existing folder structure (`/features` for domain logic, `/pages` for routes).
- Use `lucide-react` for any new icons.
