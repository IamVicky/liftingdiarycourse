# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

> **CRITICAL RULE — applies to every code generation task:**
> Before writing any code, always read the relevant documentation file(s) in the `/docs` directory first. The `/docs` directory is the authoritative reference for this project's conventions, decisions, and component contracts. No code should be written without first consulting it.

- /docs/ui.md
- /docs/data-fetching.md
- /docs/data-mutations.md
- /docs/auth.md

> **CRITICAL RULE — data mutations:**
> All data mutations MUST be performed via Server Actions in colocated `actions.ts` files. Server Action parameters MUST be explicitly typed (no `FormData`) and MUST be validated with Zod before any other logic. All database mutations MUST go through helper functions in the `/data` directory using Drizzle ORM — never call the database directly from a Server Action.

@AGENTS.md

## Commands

```bash
npm run dev      # Start development server on http://localhost:3000
npm run build    # Production build
npm run lint     # Run ESLint
```

No test runner is configured yet.

## Stack

- **Next.js 16.2.6** with the App Router (`src/app/`) — read `node_modules/next/dist/docs/` before writing any Next.js code; APIs differ from prior versions
- **React 19.2.4** — new APIs (use, transitions, etc.) may differ from training data
- **Tailwind CSS v4** — CSS-first config, no `tailwind.config.js`; theme tokens defined via `@theme` in `globals.css`; utilities added via `@import "tailwindcss"`
- **TypeScript** (strict mode, `@/*` path alias maps to `src/*`)

## Architecture

All routing and UI lives under `src/app/` using the App Router file conventions (`page.tsx`, `layout.tsx`). The root layout (`src/app/layout.tsx`) loads Geist fonts as CSS variables and wraps all pages in a flex column body. Global styles and Tailwind theme tokens are in `src/app/globals.css`.

Custom theme colors (`--color-background`, `--color-foreground`) are defined in `globals.css` using the `@theme inline` block and wired to CSS custom properties for dark mode support via `prefers-color-scheme`.
