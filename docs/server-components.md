# Server Component Standards

## Next.js 15: `params` and `searchParams` Are Promises

**In Next.js 15, `params` and `searchParams` are Promises. They MUST be `await`ed before accessing any property.**

This is a breaking change from Next.js 14. The types reflect this — both props arrive as `Promise<{...}>`, not plain objects.

### Dynamic Route Params

```tsx
// ✅ CORRECT — params is a Promise, must be awaited
interface PageProps {
  params: Promise<{ workoutId: string }>;
}

export default async function EditWorkoutPage({ params }: PageProps) {
  const { workoutId } = await params;
  // now safe to use workoutId
}
```

```tsx
// ❌ WRONG — destructuring params directly without awaiting
export default async function EditWorkoutPage({ params }: { params: { workoutId: string } }) {
  const { workoutId } = params; // runtime error in Next.js 15
}
```

### Search Params

```tsx
// ✅ CORRECT — searchParams is also a Promise
interface PageProps {
  searchParams: Promise<{ date?: string }>;
}

export default async function WorkoutPage({ searchParams }: PageProps) {
  const { date } = await searchParams;
}
```

```tsx
// ❌ WRONG — accessing searchParams as a plain object
export default async function WorkoutPage({ searchParams }: { searchParams: { date?: string } }) {
  const { date } = searchParams; // runtime error in Next.js 15
}
```

---

## Page Component Rules

### Always `async`

All `page.tsx` files should be `async` functions. Data fetching via `/data` helpers requires `await`, and params/searchParams require `await`.

```tsx
// ✅ CORRECT
export default async function MyPage({ params }: PageProps) { ... }

// ❌ WRONG — sync page cannot await params or data
export default function MyPage({ params }: PageProps) { ... }
```

### Type Both Props Separately

When a page uses both `params` and `searchParams`, declare each as its own `Promise`:

```tsx
interface PageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ tab?: string }>;
}

export default async function Page({ params, searchParams }: PageProps) {
  const { id } = await params;
  const { tab } = await searchParams;
}
```

---

## Not-Found Handling

Use `notFound()` from `next/navigation` when a record is missing or the user is unauthorized to see it. Always validate URL segments before querying the database.

```tsx
import { notFound } from "next/navigation";

export default async function EditWorkoutPage({ params }: PageProps) {
  const { workoutId } = await params;
  const id = Number(workoutId);

  // Validate the URL segment before hitting the database
  if (!Number.isInteger(id) || id <= 0) notFound();

  const workout = await getWorkoutById(id);
  if (!workout) notFound();
}
```

---

## Summary Checklist

- [ ] `params` prop is typed as `Promise<{ ... }>`
- [ ] `searchParams` prop is typed as `Promise<{ ... }>`
- [ ] Both are `await`ed before any property access
- [ ] Page function is `async`
- [ ] URL segments are validated before DB calls
- [ ] `notFound()` is called for missing or unauthorized records
