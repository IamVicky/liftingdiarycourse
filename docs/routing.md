# Routing Standards

## Route Structure: `/dashboard` as the App Root

**All authenticated application routes must be nested under `/dashboard`.**

- Do **not** create top-level routes for app features (e.g. `/workouts`, `/profile`).
- Every feature page lives at `/dashboard/<feature>` or deeper (e.g. `/dashboard/workout/[workoutId]`).
- The only routes permitted outside `/dashboard` are public routes: `/`, `/sign-in`, `/sign-up`.

### Directory Layout

```
src/app/
├── page.tsx                          # Public landing page (/)
├── sign-in/[[...sign-in]]/page.tsx   # Public — Clerk sign-in
├── sign-up/[[...sign-up]]/page.tsx   # Public — Clerk sign-up
└── dashboard/
    ├── layout.tsx                    # Shared dashboard shell (nav, sidebar, etc.)
    ├── page.tsx                      # /dashboard
    └── workout/
        ├── new/
        │   └── page.tsx              # /dashboard/workout/new
        └── [workoutId]/
            └── page.tsx              # /dashboard/workout/:workoutId
```

---

## Route Protection: Next.js Middleware

All `/dashboard` routes (and any other non-public routes) **must** be protected via Next.js middleware in `src/middleware.ts`. Do **not** add redirect logic inside `page.tsx` files.

See [`auth.md`](./auth.md) for the canonical middleware implementation using `clerkMiddleware`.

### Rule of Thumb

| Route | Public? | Protected? |
|-------|---------|------------|
| `/` | ✅ | — |
| `/sign-in`, `/sign-up` | ✅ | — |
| `/dashboard` and all sub-routes | — | ✅ |
| `/api/*` | — | ✅ |

---

## Navigation Between Routes

Use Next.js `<Link>` for all internal navigation — never use `<a href>` for client-side transitions.

```tsx
// ✅ CORRECT
import Link from "next/link";
<Link href="/dashboard/workout/new">New Workout</Link>

// ❌ WRONG — causes a full page reload
<a href="/dashboard/workout/new">New Workout</a>
```

For programmatic navigation (e.g. after a form submission), use `redirect` from `next/navigation` in Server Actions, or `useRouter` in Client Components.

```ts
// ✅ Server Action redirect after mutation
import { redirect } from "next/navigation";

export async function createWorkout(...) {
  // ... mutation logic
  redirect("/dashboard");
}
```

---

## Summary Checklist

- [ ] All app feature routes live under `/dashboard`
- [ ] Route protection is in `src/middleware.ts`, not in page files
- [ ] Internal links use Next.js `<Link>`, not `<a>`
- [ ] Programmatic redirects use `redirect()` (server) or `useRouter` (client)
