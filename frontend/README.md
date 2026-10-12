# RouteWise Frontend

React 18 + TypeScript + Vite + Tailwind CSS + React Router + TanStack Query + Axios + Leaflet/React-Leaflet + Recharts + STOMP/SockJS.

## Prerequisites

- Node.js 20+

## Configuration

Copy `.env.example` to `.env` if you need to point the dev-server proxy at a non-default backend URL (`VITE_API_PROXY_TARGET`, default `http://localhost:8080`).

## Run

```bash
cd frontend
npm install
npm run dev
```

Opens at `http://localhost:5173`. API calls to `/api/**` and the `/ws` WebSocket endpoint are proxied to the backend (see `vite.config.ts`).

## Build

```bash
npm run build   # type-checks with tsc -b, then builds to dist/
npm run preview # serve the production build locally
```

## Test

```bash
npm run test
```
Runs the Vitest suite (`src/test/`) — component rendering (`StatusBadge`) and routing/auth-guard behavior (`ProtectedRoute`).

## Project layout

```
src/
├── components/   Shared UI: StatusBadge, LoadingState/EmptyState/ErrorState, ProtectedRoute, EmergencyMap
├── context/      AuthContext (JWT session state)
├── hooks/        useEmergencySocket (STOMP live tracking)
├── layouts/      DashboardLayout (role-aware sidebar)
├── pages/        auth/, citizen/, driver/, hospital/, admin/, plus LandingPage, ProfilePage
├── services/     Axios-based API clients, one file per backend resource
├── types/        Shared TypeScript interfaces mirroring backend DTOs
└── styles/       Tailwind entrypoint + design tokens
```

## Design system

Navy/white professional palette with restrained status-priority accents (see `tailwind.config.js`: `navy-*`, `status-{low,medium,high,critical}`). Display type is Fraunces (serif), body/UI type is Inter, data/IDs (vehicle numbers, request numbers) use IBM Plex Mono for an operations-center feel.
