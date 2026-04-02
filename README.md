# SIM Management Frontend

React + Vite frontend for the SIM Management System. This app handles authentication, role-based dashboards, SIM inventory, MSISDN inventory, customers, plans, transactions, users, and settings.

## Tech stack

- React 19 + React Router
- Vite 7
- Tailwind CSS (shadcn/ui + Radix UI)
- React Hook Form + Zod
- Recharts

## Getting started

From the frontend folder:

```bash
npm install
npm run dev
```

The app runs on `http://localhost:5173` by default. API calls use a `/api` base path and are proxied to `http://localhost:3000` via Vite. Configure these with `.env` if needed.

## Scripts

- `npm run dev` - Start Vite dev server
- `npm run build` - Production build
- `npm run preview` - Preview the build
- `npm run lint` - ESLint

## App structure

The code is organized in layered folders under `src/`:

- `presentation/` - UI components, views, layout, and view models
- `domain/` - Entities and use cases
- `data/` - API clients, repositories, and service endpoints

Entry points:

- `src/main.jsx` - React root + router
- `src/App.jsx` - Routes, role-based views, and app state

## Key features

- Role-based dashboards: admin, manager, operator, viewer
- SIM inventory and bulk operations (admin)
- MSISDN inventory management
- Customers, plans, and transactions
- User management and settings (admin)
- Notifications and session expiration handling

## API integration

API endpoints are defined in `src/data/services/endpoints.js`. Requests go through `src/data/services/backendApi/client.js`, which handles auth tokens, expiration, and error normalization. The auth session is stored in local storage under `sim-auth-session`.

## Configuration

Copy `.env.example` to `.env` and adjust as needed:

- `VITE_DEV_SERVER_PORT` - Dev server port (default 5173)
- `VITE_API_PROXY_TARGET` - Backend API base for `/api` proxy
- `VITE_DEV_ALLOWED_HOSTS` - Comma-separated allowed host list

## Notes

- The router redirects unauthenticated users to `/login`.
