# Design Document — Layout Separation

## Overview

The goal is to split the app into three layout zones using Next.js App Router's nested layout system. Currently, `app/layout.tsx` (the root layout) renders `<Navigation>` and `<FloatingActionButton>` for every route. We need to move those into a scoped layout so auth and admin routes are unaffected.

The approach uses **Next.js route groups** (`(group)` folders) to apply different layouts without changing URL paths.

---

## Architecture

```
app/
  layout.tsx                  ← Root layout: only <html>, <body>, fonts, Analytics, ThemeProvider
  (main)/                     ← Route group — main app pages
    layout.tsx                ← MainLayout: Navigation + FloatingActionButton
    page.tsx                  ← /
    transactions/
    account/
  (auth)/                     ← Route group — auth pages
    layout.tsx                ← AuthLayout: minimal, no nav, no FAB
    login/
    register/
  admin/                      ← Admin section (NOT a route group — keeps /admin/* URLs)
    layout.tsx                ← AdminLayout: AdminNavigation sidebar, no FAB
    dashboard/
    categories/
    settings/
```

Route groups (`(main)` and `(auth)`) are transparent to the URL — `/login` stays `/login`, `/` stays `/`.

---

## Components and Interfaces

### Root Layout (`app/layout.tsx`)
- Keeps: `<html>`, `<body>`, font setup, `<Analytics>`, `ThemeProvider` (if present)
- Removes: `<Navigation>`, `<FloatingActionButton>`
- Renders `{children}` only

### MainLayout (`app/(main)/layout.tsx`)
- Renders `<Navigation>` above `{children}`
- Renders `<FloatingActionButton>` below `{children}`
- No changes to either component

### AuthLayout (`app/(auth)/layout.tsx`)
- Renders `{children}` only (the pages already have their own centered Card layout)
- No nav, no FAB

### AdminLayout (`app/admin/layout.tsx`)
- Renders `<AdminNavigation>` sidebar alongside `{children}` in a flex container
- No `<Navigation>`, no `<FloatingActionButton>`
- Wraps content in `<div className="flex min-h-screen bg-slate-50 dark:bg-slate-900">`

### Navigation (`components/navigation.tsx`)
- Remove the Admin link (both desktop and mobile sections)
- No other changes

### Admin page components
- Remove the self-contained `<AdminNavigation>` + outer flex wrapper from each admin page
- Each page's `<main>` content becomes the direct child of the admin layout's flex container

---

## Data Models

No data model changes. This is purely a structural/layout change.

---

## Error Handling

No new error states introduced. Existing page-level error handling is unchanged.

---

## Testing Strategy

Manual verification checklist:
- `/login` — no nav, no FAB, centered card layout renders correctly
- `/register` — no nav, no FAB, centered card layout renders correctly
- `/` — main nav visible, FAB visible, no admin link in nav
- `/transactions` — main nav visible, FAB visible
- `/account` — main nav visible, FAB visible
- `/admin/dashboard` — admin sidebar visible, no main nav, no FAB, active link highlighted
- `/admin/categories` — admin sidebar visible, no main nav, no FAB, active link highlighted
- `/admin/settings` — admin sidebar visible, no main nav, no FAB, active link highlighted

---

## Key Design Decisions

1. **Route groups over conditional rendering** — Using `(main)` and `(auth)` route groups is the idiomatic Next.js App Router approach. It avoids `usePathname()` checks in the root layout and keeps layout logic co-located with the routes it applies to.

2. **`app/admin/layout.tsx` (not a route group)** — Admin already lives under `/admin/*`, so a regular nested layout file is sufficient. No route group needed.

3. **Admin pages lose their self-contained layout** — Currently each admin page renders `<AdminNavigation>` and the outer flex wrapper itself. After this change, the shared `app/admin/layout.tsx` handles that, and pages only render their `<main>` content. This removes duplication.

4. **Root layout becomes a shell** — `app/layout.tsx` becomes a minimal HTML shell. All layout chrome moves into the appropriate group layouts.

5. **No component redesign** — `Navigation`, `AdminNavigation`, and `FloatingActionButton` are reused as-is. Only the Admin link is removed from `Navigation`.
