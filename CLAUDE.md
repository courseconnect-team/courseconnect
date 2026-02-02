# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

CourseConnect is a web application for managing teaching position applications (TAs, UPIs, Graders) and course information. It serves students (submit/track applications), faculty (review applications, manage courses), and department leaders (manage users/courses, upload data via spreadsheets).

## Tech Stack

- **Frontend:** React 19, Next.js 15 (App Router), TypeScript
- **UI:** Material UI (MUI) 6, Tailwind CSS 4
- **Backend:** Firebase/Firestore, Firebase Cloud Functions
- **State:** React Query (TanStack), React Context
- **Forms:** React Hook Form

## Common Commands

```bash
# Development
npm run dev              # Start dev server at localhost:3000
npm run build            # Production build
npm run start            # Start production server
npm run lint             # Run ESLint

# Testing (Playwright E2E)
npm run test:e2e         # Run all E2E tests
npm run test:e2e:ui      # Run tests with Playwright UI
npm run test:e2e:debug   # Debug tests
npx playwright show-report  # View test report after failure

# Firebase Functions (from /functions directory)
npm run build            # Compile TypeScript
npm run serve            # Run functions locally with emulator
npm run deploy           # Deploy functions to Firebase
```

## Architecture

```
src/
├── app/                 # Next.js App Router pages
│   ├── admin-applications/  # Admin: manage all applications
│   ├── admincourses/        # Admin: course management
│   ├── announcements/       # Announcements feature
│   ├── applications/        # Student application submission
│   ├── courses/             # Course viewing
│   ├── dashboard/           # Main dashboard
│   ├── faculty/             # Faculty management
│   ├── users/               # Admin: user management
│   └── layout.tsx           # Root layout with providers
├── components/          # Reusable React components
├── contexts/            # React contexts (Auth, Announcements)
├── firebase/            # Firebase config and utilities
├── hooks/               # Custom React hooks (useGetItems, etc.)
├── types/               # TypeScript type definitions
└── utils/               # Utility functions

functions/               # Firebase Cloud Functions (email notifications)
tests/e2e/              # Playwright E2E tests
```

## Key Patterns

- **Path alias:** Use `@/*` to import from `src/*`
- **Providers:** AuthProvider and AnnouncementsProvider wrap the app in `layout.tsx`
- **Data fetching:** React Query hooks in `src/hooks/` for Firestore operations
- **E2E test mode:** Feature flags via `NEXT_PUBLIC_E2E` env var and localStorage

## Pre-commit Hooks

Husky runs ESLint and Prettier on staged files automatically. If commits fail, check lint errors with `npm run lint`.

## Firebase Functions

Cloud Functions in `functions/src/index.ts` handle email notifications (application confirmations, status updates, faculty notifications). Uses Nodemailer with configured SMTP credentials.
