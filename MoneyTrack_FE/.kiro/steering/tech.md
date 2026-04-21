# Tech Stack

- Framework: Next.js 16 (App Router)
- Language: TypeScript 5.7
- Styling: Tailwind CSS v4
- UI Components: shadcn/ui (Radix UI primitives + `components/ui/`)
- Charts: Recharts
- Forms: React Hook Form + Zod
- Icons: Lucide React
- Fonts: Geist / Geist Mono (next/font/google)
- Theming: next-themes
- Analytics: Vercel Analytics
- Package manager: pnpm (pnpm-lock.yaml present)

## Common Commands

```bash
pnpm dev        # start dev server (localhost:3000)
pnpm build      # production build
pnpm start      # serve production build
pnpm lint       # run ESLint
```

## Path Aliases

`@/` maps to the project root (configured in tsconfig.json).
