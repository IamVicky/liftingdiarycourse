# Data Mutation Standards

## CRITICAL: Server Actions Only

**All data mutations in this app MUST be performed via Next.js Server Actions.**

- Do **NOT** mutate data in Route Handlers (`src/app/api/`)
- Do **NOT** mutate data directly from Client Components via `fetch`
- Do **NOT** call the database from Server Actions directly — always go through the `/data` layer
- Do **NOT** call `/data` mutation helpers from anywhere other than a Server Action

---

## Server Actions: `actions.ts` Colocation Rule

Every Server Action must live in a file named `actions.ts` colocated with the route segment it belongs to.

```
src/
  app/
    workout/
      page.tsx
      actions.ts        ← Server Actions for the workout route
    dashboard/
      page.tsx
      actions.ts        ← Server Actions for the dashboard route
```

- One `actions.ts` per route segment — do **not** create a global/shared `actions.ts`
- Every file must begin with the `"use server"` directive

```ts
// src/app/workout/actions.ts
"use server";

// ... action definitions
```

---

## Typed Parameters — No `FormData`

**All Server Action parameters must be explicitly typed. `FormData` is forbidden as a parameter type.**

Server Actions in this project are called programmatically from event handlers, not wired directly to `<form action={...}>`. This keeps argument types explicit and compiler-checked.

```ts
// ✅ CORRECT — typed parameters
export async function createWorkout(params: CreateWorkoutParams) { ... }
export async function deleteSet(setId: string) { ... }
export async function updateExercise(exerciseId: string, params: UpdateExerciseParams) { ... }
```

```ts
// ❌ WRONG — FormData parameter
export async function createWorkout(formData: FormData) { ... }
```

---

## Zod Validation: Mandatory for Every Server Action

**Every Server Action MUST validate its arguments with Zod before touching the database.**

Server Actions are public API surface — any client can call them. Zod validation is the boundary that ensures only well-shaped, expected data reaches the `/data` layer.

### Pattern

Define a Zod schema alongside (or above) each action, then `parse` at the top of the function body before any other logic.

```ts
// src/app/workout/actions.ts
"use server";

import { z } from "zod";
import { createWorkout as createWorkoutRecord } from "@/data/workouts";

const CreateWorkoutSchema = z.object({
  date: z.string().date(),
  notes: z.string().max(500).optional(),
});

type CreateWorkoutParams = z.infer<typeof CreateWorkoutSchema>;

export async function createWorkout(params: CreateWorkoutParams) {
  const validated = CreateWorkoutSchema.parse(params);
  return createWorkoutRecord(validated);
}
```

```ts
// ❌ WRONG — no validation; raw params reach the /data layer
export async function createWorkout(params: CreateWorkoutParams) {
  return createWorkoutRecord(params);
}
```

### Using `safeParse` for User-Facing Errors

When an action needs to return a structured error to the UI rather than throw, use `safeParse`:

```ts
export async function updateSet(setId: string, params: UpdateSetParams) {
  const result = UpdateSetSchema.safeParse(params);
  if (!result.success) {
    return { error: result.error.flatten().fieldErrors };
  }
  return updateSetRecord(setId, result.data);
}
```

---

## `/data` Layer: Mutation Helpers

**Every database mutation must be wrapped in a helper function inside the `/data` directory.**

Mutation helpers follow the same rules as query helpers (see `data-fetching.md`):

1. Retrieve the session and extract the authenticated user's ID
2. Scope the mutation with a `where` clause that includes `userId` — never mutate a record without verifying ownership
3. Use **Drizzle ORM** — never write raw SQL strings

```ts
// src/data/workouts.ts
import { db } from "@/lib/db";
import { workouts } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { auth } from "@/lib/auth";

export async function createWorkout(params: { date: string; notes?: string }) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const [workout] = await db
    .insert(workouts)
    .values({ ...params, userId: session.user.id })
    .returning();

  return workout;
}

export async function deleteWorkout(workoutId: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  // userId filter is mandatory — never delete by ID alone
  await db
    .delete(workouts)
    .where(
      and(
        eq(workouts.id, workoutId),
        eq(workouts.userId, session.user.id)   // ← ownership check
      )
    );
}
```

### Security Rules

| Rule | Reason |
|------|--------|
| Always filter mutations by `userId` from the session | Prevents one user from mutating another user's records by guessing IDs |
| Never accept `userId` as a parameter | A caller could pass a different user's ID; always derive it from the session |
| Never write raw SQL | Raw strings bypass Drizzle's type safety and can introduce SQL injection |
| Always check session before mutating | Unauthenticated requests must be rejected before any DB call |

---

## Full Example: End-to-End Mutation Flow

```
Client Component
  → calls Server Action (actions.ts)
      → Zod validates params
          → /data helper performs the DB mutation (Drizzle ORM, userId-scoped)
```

```tsx
// src/app/workout/WorkoutForm.tsx  (Client Component)
"use client";
import { createWorkout } from "./actions";

export function WorkoutForm() {
  async function handleSubmit() {
    await createWorkout({ date: "2026-05-27", notes: "Heavy day" });
  }
  return <button onClick={handleSubmit}>Log Workout</button>;
}
```

```ts
// src/app/workout/actions.ts
"use server";
import { z } from "zod";
import { createWorkout as createWorkoutRecord } from "@/data/workouts";

const CreateWorkoutSchema = z.object({
  date: z.string().date(),
  notes: z.string().max(500).optional(),
});

type CreateWorkoutParams = z.infer<typeof CreateWorkoutSchema>;

export async function createWorkout(params: CreateWorkoutParams) {
  const validated = CreateWorkoutSchema.parse(params);
  return createWorkoutRecord(validated);
}
```

```ts
// src/data/workouts.ts
import { db } from "@/lib/db";
import { workouts } from "@/lib/db/schema";
import { auth } from "@/lib/auth";

export async function createWorkout(params: { date: string; notes?: string }) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const [workout] = await db
    .insert(workouts)
    .values({ ...params, userId: session.user.id })
    .returning();

  return workout;
}
```

---

## Anti-patterns to Avoid

```ts
// ❌ WRONG — mutation called directly from a Route Handler
// src/app/api/workouts/route.ts
export async function POST(req: Request) {
  const body = await req.json();
  await db.insert(workouts).values(body); // forbidden
}

// ❌ WRONG — Server Action calls the DB directly instead of going through /data
export async function createWorkout(params: CreateWorkoutParams) {
  const validated = CreateWorkoutSchema.parse(params);
  await db.insert(workouts).values(validated); // must use /data helper
}

// ❌ WRONG — /data helper mutates without an ownership check
export async function deleteWorkout(workoutId: string) {
  await db.delete(workouts).where(eq(workouts.id, workoutId)); // no userId filter
}

// ❌ WRONG — Server Action has no Zod validation
export async function createWorkout(params: CreateWorkoutParams) {
  return createWorkoutRecord(params); // params are unvalidated
}
```

---

## No `redirect()` in Server Actions

**Never call `redirect()` from `next/navigation` inside a Server Action.**

`redirect()` works by throwing a special exception that interrupts the response stream. This couples navigation logic to the server and removes the client's ability to decide what happens after a mutation succeeds.

Instead, Server Actions must return data (e.g. the created record or a relevant ID), and the **calling Client Component** is responsible for navigating using `useRouter`.

```ts
// ✅ CORRECT — action returns data; client navigates
// src/app/dashboard/workout/new/actions.ts
export async function createWorkoutAction(params: CreateWorkoutParams) {
  const { name, date } = CreateWorkoutSchema.parse(params);
  const workout = await createWorkout(name, new Date(date));
  return { date }; // return what the client needs to navigate
}

// src/app/dashboard/workout/new/CreateWorkoutForm.tsx
"use client";
import { useRouter } from "next/navigation";

export function CreateWorkoutForm() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const { date } = await createWorkoutAction({ name, date });
      router.push(`/dashboard?date=${date}`); // client owns the navigation
    });
  }
}
```

```ts
// ❌ WRONG — action handles navigation itself
export async function createWorkoutAction(params: CreateWorkoutParams) {
  const { name, date } = CreateWorkoutSchema.parse(params);
  await createWorkout(name, new Date(date));
  redirect(`/dashboard?date=${date}`); // forbidden
}
```

---

## Summary Checklist

- [ ] The mutation is triggered via a Server Action in a colocated `actions.ts` file
- [ ] The `actions.ts` file starts with `"use server"`
- [ ] Action parameters are explicitly typed — no `FormData`
- [ ] Every action validates its arguments with a Zod schema before any other logic
- [ ] The action delegates the DB call to a helper in `/data`, not the DB directly
- [ ] The `/data` helper retrieves the session internally and throws if unauthenticated
- [ ] Every mutation is scoped to the current user's `userId`
- [ ] Drizzle ORM is used — no raw SQL
- [ ] `redirect()` is NOT called inside the Server Action — navigation is handled client-side via `useRouter`
