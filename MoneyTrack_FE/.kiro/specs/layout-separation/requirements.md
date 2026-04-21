# Requirements Document

## Introduction

MoneyTrack FE currently uses a single root layout (`app/layout.tsx`) that renders the main navigation and Floating Action Button (FAB) for all routes — including auth pages (`/login`, `/register`) and admin pages (`/admin/*`). This causes the main nav and FAB to appear on pages where they should not be visible.

This feature separates the app into three distinct layout zones:
- **AuthLayout** — minimal centered layout for `/login` and `/register`, no nav, no FAB
- **AdminLayout** — sidebar-based layout for `/admin/*`, uses `AdminNavigation`, no FAB
- **MainLayout** — existing layout for all other user-facing pages, with main nav and FAB

The Admin link must also be removed from the main user navigation.

---

## Requirements

### Requirement 1 — Remove Admin link from main navigation

**User Story:** As a regular user, I want the main navigation to only show user-relevant pages, so that I am not exposed to admin routes.

#### Acceptance Criteria

1. WHEN a user views any main app page THEN the navigation SHALL NOT display an "Admin" link or tab.
2. WHEN a user navigates to `/admin/*` via direct URL THEN the main navigation SHALL NOT be rendered.

---

### Requirement 2 — Auth pages use a minimal layout

**User Story:** As a visitor on the login or register page, I want a clean, focused layout, so that I am not distracted by app navigation.

#### Acceptance Criteria

1. WHEN a user visits `/login` THEN the page SHALL NOT render the main navigation component.
2. WHEN a user visits `/register` THEN the page SHALL NOT render the main navigation component.
3. WHEN a user visits `/login` or `/register` THEN the page SHALL NOT render the Floating Action Button.
4. WHEN a user visits `/login` or `/register` THEN the page SHALL render a minimal centered layout using existing Card, Input, and Button components.

---

### Requirement 3 — Admin pages use a dedicated admin layout

**User Story:** As an admin, I want a dedicated admin layout with its own navigation, so that the admin experience is clearly separated from the user-facing app.

#### Acceptance Criteria

1. WHEN a user visits any `/admin/*` route THEN the page SHALL render the `AdminNavigation` sidebar and NOT the main user navigation.
2. WHEN a user visits any `/admin/*` route THEN the page SHALL NOT render the Floating Action Button.
3. WHEN a user visits `/admin/dashboard`, `/admin/categories`, or `/admin/settings` THEN the `AdminNavigation` SHALL highlight the currently active route.
4. WHEN the admin layout is rendered THEN it SHALL use consistent spacing and styling with the rest of the app (same color tokens, Tailwind dark mode classes).

---

### Requirement 4 — Main app pages retain existing layout

**User Story:** As a logged-in user on any non-admin, non-auth page, I want the main navigation and FAB to always be present, so that I can navigate and create transactions easily.

#### Acceptance Criteria

1. WHEN a user visits `/`, `/transactions`, or `/account` THEN the main navigation SHALL be rendered.
2. WHEN a user visits any main app page THEN the Floating Action Button SHALL be rendered.
3. WHEN the layout is changed THEN the existing design system (colors, spacing, typography, components) SHALL remain unchanged.

---

### Requirement 5 — Layout separation via Next.js App Router route groups or nested layouts

**User Story:** As a developer, I want layout separation to be implemented cleanly using Next.js App Router conventions, so that the codebase is maintainable.

#### Acceptance Criteria

1. WHEN the app is structured THEN auth routes (`/login`, `/register`) SHALL use a layout that excludes `Navigation` and `FloatingActionButton`.
2. WHEN the app is structured THEN admin routes (`/admin/*`) SHALL use a layout that includes `AdminNavigation` and excludes `Navigation` and `FloatingActionButton`.
3. WHEN the app is structured THEN main app routes SHALL use a layout that includes `Navigation` and `FloatingActionButton`.
4. WHEN implementing layout separation THEN the solution SHALL reuse existing components (`Navigation`, `AdminNavigation`, `FloatingActionButton`) without redesigning them.
5. WHEN admin pages currently self-render `AdminNavigation` inside their page components THEN that duplication SHALL be removed in favor of the shared admin layout.
