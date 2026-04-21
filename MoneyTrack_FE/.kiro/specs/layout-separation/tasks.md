# Implementation Plan

- [x] 1. Refactor root layout into a minimal HTML shell





  - Remove `<Navigation>` and `<FloatingActionButton>` imports and JSX from `app/layout.tsx`
  - Keep `<html>`, `<body>`, font classes, `<Analytics>`, and `{children}`
  - _Requirements: 5.1, 5.2, 5.3_

- [x] 2. Create the `(main)` route group with MainLayout





  - Create `app/(main)/layout.tsx` that renders `<Navigation>`, `{children}`, and `<FloatingActionButton>`
  - Move `app/page.tsx` into `app/(main)/page.tsx`
  - Move `app/transactions/` into `app/(main)/transactions/`
  - Move `app/account/` into `app/(main)/account/`
  - _Requirements: 4.1, 4.2, 5.3_

- [x] 3. Create the `(auth)` route group with AuthLayout





  - Create `app/(auth)/layout.tsx` that renders only `{children}` (no nav, no FAB)
  - Move `app/login/` into `app/(auth)/login/`
  - Move `app/register/` into `app/(auth)/register/`
  - _Requirements: 2.1, 2.2, 2.3, 5.1_

- [x] 4. Create the shared AdminLayout




  - Create `app/admin/layout.tsx` that renders `<AdminNavigation>` + `<main className="flex-1 p-6">{children}</main>` inside a flex wrapper
  - _Requirements: 3.1, 3.2, 5.2_

- [x] 5. Remove self-contained layout from each admin page










  - In `app/admin/dashboard/page.tsx`: remove `<AdminNavigation>` import, remove outer `<div className="flex min-h-screen ...">` and sidebar JSX, keep only the `<main>` inner content (unwrapped)
  - In `app/admin/categories/page.tsx`: same removal
  - In `app/admin/settings/page.tsx`: same removal
  - _Requirements: 3.1, 5.5_



- [x] 6. Remove Admin link from main Navigation component



  - In `components/navigation.tsx`: delete the desktop Admin `<Link>` block and the mobile Admin `<Link>` block
  - _Requirements: 1.1, 1.2_
