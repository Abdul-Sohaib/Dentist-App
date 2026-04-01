# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Each package manages its own dependencies.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9

## Structure

```text
artifacts-monorepo/
├── artifacts/              # Deployable applications
│   ├── api-server/         # Express API server (unused by mobile app)
│   ├── mobile/             # Expo mobile app (DentBook)
│   └── mockup-sandbox/     # Canvas design sandbox
├── lib/                    # Shared libraries
└── ...
```

## DentBook Mobile App (artifacts/mobile)

A single-dentist clinic management app built with Expo + React Native.

### Product Vision
- **NOT** a multi-dentist marketplace
- A **personal CRM + booking system** for one dentist
- Dentist manages their own patients and appointments
- Patients do not have accounts — managed by the dentist

### Features
- **Auth**: Signup / Login with session persistence via AsyncStorage
- **Dashboard**: Welcome header, today's appointments, stats cards, quick actions
- **Patient CRM**: Add, search, view, edit, delete patients; see appointment history
- **Appointments**: Book for a patient, calendar slot picker, status management (confirm/complete/cancel)
- **Analytics**: Stats overview, bar charts by day-of-week and status, week-over-week comparison
- **Settings**: Edit profile, clinic info, working hours, slot duration, working days
- **Ticket Download**: PDF appointment ticket via expo-print + expo-sharing

### Architecture
- **Storage**: AsyncStorage (no backend)
- **State**: React Context (`AppContext`) — single source of truth
- **Navigation**: Expo Router Stack + custom `BottomNav` component
- **Theme**: Medical clean — white, blue (#1A7FD4), soft green (#2ECC9C)

### Navigation Structure
```
/ (index)          → redirects based on session
/auth/login        → login screen
/auth/signup       → signup screen
/dashboard         → main dashboard (BottomNav tab 1)
/patients          → patient list (BottomNav tab 2)
/patients/add      → add patient form
/patients/[id]     → patient profile + history
/appointments      → all appointments (BottomNav tab 3)
/appointments/book → book appointment (calendar + slot picker)
/appointments/success → booking success + PDF ticket download
/analytics         → analytics charts (BottomNav tab 4)
/settings          → profile settings + logout (BottomNav tab 5)
```

### Key Files
- `app/index.tsx` — Session check → redirect
- `app/auth/login.tsx` — Login
- `app/auth/signup.tsx` — Signup
- `app/dashboard.tsx` — Main dashboard
- `app/patients/index.tsx` — Patient list
- `app/patients/add.tsx` — Add patient
- `app/patients/[id].tsx` — Patient profile
- `app/appointments/index.tsx` — All appointments with filter
- `app/appointments/book.tsx` — Book appointment
- `app/appointments/success.tsx` — Success + download ticket
- `app/analytics.tsx` — Analytics dashboard
- `app/settings.tsx` — Settings + logout
- `context/AppContext.tsx` — All state, CRUD, business logic, seed data
- `components/UI.tsx` — Button, Input, Card, StatusBadge, EmptyState
- `components/BottomNav.tsx` — Bottom navigation bar
- `utils/ticketPDF.ts` — PDF appointment ticket generator

### Demo Credentials
- Email: `demo@dentbook.com` / Password: `demo123`
- Loads with 6 pre-seeded patients and 9 appointments

### Data Models
```typescript
DentistProfile { id, name, clinicName, location, phone, email, password,
                 workingHours, workingDays, slotDuration, breaks, bio }
Patient        { id, name, phone, notes, createdAt }
Appointment    { id, patientId, date, time, problem,
                 status: "pending"|"confirmed"|"completed"|"cancelled", createdAt }
```
