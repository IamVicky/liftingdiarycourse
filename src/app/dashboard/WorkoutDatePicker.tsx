"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CalendarIcon } from "lucide-react";

import { formatDate } from "@/lib/date";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

export function WorkoutDatePicker({ selected }: { selected: Date }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        className={cn(
          buttonVariants({ variant: "outline" }),
          "w-full justify-start gap-2"
        )}
      >
        <CalendarIcon className="size-4" />
        {formatDate(selected)}
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={selected}
          onSelect={(d) => {
            if (d) {
              router.replace(
                `?date=${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
              );
              setOpen(false);
            }
          }}
          disabled={{ after: new Date() }}
          initialFocus
        />
      </PopoverContent>
    </Popover>
  );
}
