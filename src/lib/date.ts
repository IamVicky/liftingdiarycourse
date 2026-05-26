import { format } from "date-fns";

export function formatDate(date: Date | string | number): string {
  return format(new Date(date), "do MMM yyyy");
}
