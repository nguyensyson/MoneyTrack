# Project Structure

```
app/                  # Next.js App Router pages
  page.tsx            # Dashboard/overview (/)
  layout.tsx          # Root layout (Navigation + FAB + Analytics)
  transactions/       # Transaction ledger (/transactions)
  account/            # User account page (/account)
  login/              # Login page (/login)
  register/           # Register page (/register)
  admin/              # Admin section (/admin/*)

components/           # Shared React components
  ui/                 # shadcn/ui primitives (Button, Card, Input, etc.)
  navigation.tsx      # Top nav bar
  admin-navigation.tsx
  transaction-form.tsx
  transaction-item.tsx
  transaction-type-tabs.tsx
  category-list.tsx
  category-selector.tsx
  chart-card.tsx
  floating-action-button.tsx
  theme-provider.tsx

lib/
  mock-data.ts        # All mock data + data access functions (no real API yet)
  utils.ts            # cn() helper and shared utilities

types/
  index.ts            # Shared TypeScript types (Transaction, Category, User, etc.)

hooks/                # Custom React hooks
styles/               # Global CSS
public/               # Static assets
```

## Conventions

- Pages use default exports; components use named exports.
- Client components are marked with `'use client'` at the top.
- All data access goes through functions in `lib/mock-data.ts`.
- Shared types live in `types/index.ts` — import from `@/types`.
- Use `cn()` from `@/lib/utils` for conditional class merging.
- Tailwind dark mode classes (`dark:`) are used throughout — always include dark variants.
- Max content width is `max-w-6xl mx-auto` on most pages.
- Vietnamese strings are used directly in JSX (no i18n library).
