# UI Coding Standards

## Component Library: shadcn/ui — Exclusive

**All UI components in this project must use [shadcn/ui](https://ui.shadcn.com/) exclusively.**

- Do **not** create custom UI components (custom buttons, inputs, modals, cards, etc.).
- Do **not** use any other component library (MUI, Radix primitives directly, Chakra, Ant Design, etc.).
- If a needed component exists in shadcn/ui, use it. If it does not exist, discuss with the team before introducing anything new.
- shadcn/ui components live in `src/components/ui/` and are added via the shadcn CLI (`npx shadcn@latest add <component>`).

### Adding a New Component

```bash
npx shadcn@latest add <component-name>
# e.g.
npx shadcn@latest add dialog
npx shadcn@latest add data-table
```

Never hand-write the contents of `src/components/ui/` — always use the CLI so the component matches the installed shadcn version and picks up the project's Tailwind theme tokens.

---

## Date Formatting: date-fns

All date formatting must use **[date-fns](https://date-fns.org/)**.

### Required Format

Dates displayed to users must follow this style:

| Example output |
|----------------|
| 1st Sep 2025   |
| 2nd Aug 2025   |
| 3rd Jan 2026   |
| 4th Jun 2024   |

This is an **ordinal day, abbreviated month, full year** format.

### Implementation

Use `format` together with `do` (ordinal day token) from date-fns:

```ts
import { format } from "date-fns";

// "do" produces "1st", "2nd", "3rd", "4th", ...
format(date, "do MMM yyyy");
// → "1st Sep 2025", "2nd Aug 2025", etc.
```

### Rules

- Never use `Date.toLocaleDateString()`, `Intl.DateTimeFormat`, or manual string concatenation for user-facing dates.
- Always import from `date-fns` — never from `date-fns/esm` or a sub-path unless required by a build constraint.
- Keep all date logic in a single utility (e.g. `src/lib/date.ts`) so the format is defined once and referenced everywhere.

```ts
// src/lib/date.ts
import { format } from "date-fns";

export function formatDate(date: Date | string | number): string {
  return format(new Date(date), "do MMM yyyy");
}
```
