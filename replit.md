# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Each package manages its own dependencies.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)

## Structure

```text
artifacts-monorepo/
├── artifacts/              # Deployable applications
│   ├── api-server/         # Express API server
│   ├── mobile/             # Expo mobile app (DentBook)
│   └── mockup-sandbox/     # Canvas design sandbox
├── lib/                    # Shared libraries
│   ├── api-spec/           # OpenAPI spec + Orval codegen config
│   ├── api-client-react/   # Generated React Query hooks
│   ├── api-zod/            # Generated Zod schemas from OpenAPI
│   └── db/                 # Drizzle ORM schema + DB connection
├── scripts/                # Utility scripts
├── pnpm-workspace.yaml
├── tsconfig.base.json
├── tsconfig.json
└── package.json
```

## DentBook Mobile App (artifacts/mobile)

A full-featured dentist appointment booking mobile app built with Expo + React Native.

### Features
- **Customer flow** (no login): Browse dentists, view available time slots on a calendar, book appointments
- **Dentist flow** (login required): Dashboard with today/upcoming appointments, accept/reject bookings, slot management

### Architecture
- **Storage**: AsyncStorage for all local persistence
- **State**: React Context (AppContext) with full CRUD operations
- **Navigation**: Expo Router file-based routing
- **Theme**: Medical clean — white, blue (#1A7FD4), soft green (#2ECC9C)

### Key Files
- `app/index.tsx` — Entry screen (Customer / Dentist selector)
- `app/customer/dentists.tsx` — Dentist list with search
- `app/customer/dentist-profile.tsx` — Calendar slot selector
- `app/customer/booking.tsx` — Patient details form
- `app/customer/success.tsx` — Booking confirmation
- `app/dentist/login.tsx` — Login / Signup for dentists
- `app/dentist/dashboard.tsx` — Today's appointments + stats
- `app/dentist/appointments.tsx` — All appointments with filter
- `app/dentist/slots.tsx` — Working hours & slot management
- `context/AppContext.tsx` — Global state, business logic, seed data
- `components/UI.tsx` — Shared UI components (Button, Input, Card, StatusBadge)
- `constants/colors.ts` — Medical theme color palette

### Demo Credentials
- Email: `sarah@brightsmile.com` / Password: `password123`
- Other dentists: james@clearpath.com, priya@pediatrident.com, marcus@midtownimplant.com

## TypeScript & Composite Projects

Every package extends `tsconfig.base.json` which sets `composite: true`. The root `tsconfig.json` lists all packages as project references.

## Root Scripts

- `pnpm run build` — runs `typecheck` first, then recursively runs `build` in all packages
- `pnpm run typecheck` — runs `tsc --build --emitDeclarationOnly` using project references

## Packages

### `artifacts/api-server` (`@workspace/api-server`)

Express 5 API server. Routes live in `src/routes/` and use `@workspace/api-zod` for validation.

### `lib/db` (`@workspace/db`)

Database layer using Drizzle ORM with PostgreSQL.

### `lib/api-spec` (`@workspace/api-spec`)

Owns the OpenAPI 3.1 spec. Run codegen: `pnpm --filter @workspace/api-spec run codegen`
