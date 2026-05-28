# Authentication Standards

## Auth Provider: Clerk — Exclusive

**This app uses [Clerk](https://clerk.com/) as its sole authentication provider.**

- Do **not** implement custom session management, JWT handling, or password logic.
- Do **not** use NextAuth, Auth.js, Supabase Auth, or any other auth library.
- All authentication state — sign-in, sign-out, session, user identity — is managed entirely by Clerk.

---

## Server-Side Auth: `auth()` from Clerk

In Server Components and data helpers, retrieve the current session using Clerk's `auth()` helper:

```ts
import { auth } from "@clerk/nextjs/server";
```

This is re-exported via the project's auth abstraction at `@/lib/auth` — **always import from there**, not directly from `@clerk/nextjs/server`. This keeps Clerk as an implementation detail and makes future swaps a one-file change.

```ts
// ✅ CORRECT — import from the project's auth abstraction
import { auth } from "@/lib/auth";

export async function getWorkoutsForUser() {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");
  // ...
}
```

```ts
// ❌ WRONG — importing Clerk directly from data helpers or components
import { auth } from "@clerk/nextjs/server";
```

---

## Protecting Pages: `clerkMiddleware`

Route protection is handled in `src/middleware.ts` using Clerk's middleware. Do **not** add manual redirect logic inside `page.tsx` files for auth guards — let middleware handle it.

```ts
// src/middleware.ts
import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

const isPublicRoute = createRouteMatcher(["/", "/sign-in(.*)", "/sign-up(.*)"]);

export default clerkMiddleware(async (auth, req) => {
  if (!isPublicRoute(req)) {
    await auth.protect();
  }
});

export const config = {
  matcher: ["/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)", "/(api|trpc)(.*)"],
};
```

### Route Classification

| Route pattern | Classification |
|---------------|----------------|
| `/`           | Public         |
| `/sign-in`    | Public         |
| `/sign-up`    | Public         |
| `/dashboard`  | Protected      |
| `/workout`    | Protected      |
| `/api/*`      | Protected      |

---

## Client-Side Auth: Clerk Hooks

In Client Components, use Clerk's React hooks — never try to read session from cookies or local storage manually.

```tsx
// ✅ CORRECT — use Clerk hooks in Client Components
"use client";
import { useUser, useAuth } from "@clerk/nextjs";

export function UserGreeting() {
  const { user } = useUser();
  return <p>Hello, {user?.firstName}</p>;
}
```

```tsx
// ❌ WRONG — never read auth state from cookies/localStorage
"use client";
export function UserGreeting() {
  const userId = document.cookie.match(/userId=([^;]+)/)?.[1]; // forbidden
}
```

---

## UI Components: Clerk's Prebuilt Components

Use Clerk's prebuilt components for all auth UI. Do **not** build custom sign-in/sign-up forms.

```tsx
import { SignIn, SignUp, UserButton } from "@clerk/nextjs";

// Sign-in page
export default function SignInPage() {
  return <SignIn />;
}

// User avatar / sign-out menu in nav
export function NavBar() {
  return <UserButton />;
}
```

---

## The `userId` Rule

The authenticated user's ID must **always** be sourced from the session — never accepted as a parameter, stored in component state, or read from the URL.

| Rule | Reason |
|------|--------|
| Derive `userId` from `auth()` on every request | Session is the only trustworthy source of identity |
| Never accept `userId` as a function argument | A caller could pass a different user's ID |
| Never read `userId` from query params or route segments | URL params are user-controlled and can be tampered with |
| Always check `userId` is non-null before querying | Clerk returns `null` for unauthenticated requests |

---

## Summary Checklist

- [ ] Clerk is the only auth provider — no other libraries installed or imported
- [ ] Server-side auth uses `auth()` imported from `@/lib/auth`
- [ ] Route protection lives in `src/middleware.ts`, not in page files
- [ ] Client Components use Clerk hooks (`useUser`, `useAuth`)
- [ ] Sign-in/sign-up UI uses Clerk's prebuilt components
- [ ] `userId` is always derived from the session, never passed as a parameter
