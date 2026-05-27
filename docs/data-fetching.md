# Data Fetching Standards

## CRITICAL: Server Components Only

**All data fetching in this app MUST be done exclusively via React Server Components.**

- Do **NOT** fetch data in Client Components (`"use client"`)
- Do **NOT** fetch data in Route Handlers (`src/app/api/`)
- Do **NOT** use `useEffect`, `SWR`, `React Query`, or any client-side fetching library for loading application data
- Do **NOT** call the database from `page.tsx` or any component directly — always go through the `/data` layer

Server Components render on the server at request time and can `await` data directly. This means:
- No API keys or DB credentials are ever exposed to the browser
- No client/server waterfall round-trip
- Data is available immediately when HTML is sent to the client

```tsx
// ✅ CORRECT — async Server Component fetching via /data helper
import { getWorkoutsForUser } from "@/data/workouts";

export default async function WorkoutsPage() {
  const workouts = await getWorkoutsForUser();
  return <WorkoutList workouts={workouts} />;
}
```

```tsx
// ❌ WRONG — never fetch in a Client Component
"use client";
import { useEffect, useState } from "react";

export default function WorkoutsPage() {
  const [workouts, setWorkouts] = useState([]);
  useEffect(() => {
    fetch("/api/workouts").then(...); // forbidden
  }, []);
}
```

```ts
// ❌ WRONG — never use Route Handlers to serve data
// src/app/api/workouts/route.ts  ← do not create these for data fetching
export async function GET() { ... }
```

---

## Database Queries: `/data` Directory with Drizzle ORM

**Every database query must live in a helper function inside the `/data` directory.**

- The `/data` directory is the sole place where the database is touched
- All helpers must use **Drizzle ORM** — do **NOT** write raw SQL strings
- Each helper is responsible for enforcing that the logged-in user can only access **their own data**

### Directory Structure

```
src/
  data/
    workouts.ts      # all workout-related queries
    exercises.ts     # all exercise-related queries
    sets.ts          # all set-related queries
```

### Writing a Data Helper

Every helper must:

1. Retrieve the current session and extract the authenticated user's ID
2. Scope every query with a `where` clause that filters by `userId`
3. Throw (or redirect) if there is no authenticated session

```ts
// src/data/workouts.ts
import { db } from "@/lib/db";
import { workouts } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";

export async function getWorkoutsForUser() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  return db
    .select()
    .from(workouts)
    .where(eq(workouts.userId, session.user.id));
}

export async function getWorkoutById(workoutId: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  // userId filter is mandatory — never query by ID alone
  const [workout] = await db
    .select()
    .from(workouts)
    .where(
      and(
        eq(workouts.id, workoutId),
        eq(workouts.userId, session.user.id)   // ← ownership check
      )
    );

  return workout ?? null;
}
```

### Security Rules

| Rule | Reason |
|------|--------|
| Always filter by `userId` from the session | Prevents users from accessing other users' records by guessing IDs |
| Never accept `userId` as a function parameter | A caller could pass a different user's ID; always derive it from the session |
| Never write raw SQL | Raw strings bypass Drizzle's type safety and can introduce SQL injection |
| Always check session before querying | Unauthenticated requests must be rejected before any DB call |

### Anti-patterns to Avoid

```ts
// ❌ WRONG — no ownership filter; any user can fetch any workout
export async function getWorkoutById(id: string) {
  return db.select().from(workouts).where(eq(workouts.id, id));
}

// ❌ WRONG — userId accepted as a parameter (caller controls it)
export async function getWorkoutsForUser(userId: string) {
  return db.select().from(workouts).where(eq(workouts.userId, userId));
}

// ❌ WRONG — raw SQL
export async function getWorkouts() {
  return db.execute(sql`SELECT * FROM workouts`);
}
```

---

## Summary Checklist

- [ ] Data fetching happens in a Server Component
- [ ] The Server Component calls a helper from `/data`, not the DB directly
- [ ] The helper retrieves the session internally and throws if unauthenticated
- [ ] Every query is scoped to the current user's `userId`
- [ ] Drizzle ORM is used — no raw SQL
