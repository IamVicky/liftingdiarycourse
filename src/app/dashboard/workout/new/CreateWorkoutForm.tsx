"use client";

import { useTransition, useRef } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { createWorkoutAction } from "./actions";

interface CreateWorkoutFormProps {
  date: string;
}

export function CreateWorkoutForm({ date }: CreateWorkoutFormProps) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const nameRef = useRef<HTMLInputElement>(null);
  const dateRef = useRef<HTMLInputElement>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const name = nameRef.current?.value.trim() || undefined;
    const selectedDate = dateRef.current?.value ?? date;
    startTransition(async () => {
      const { date: savedDate } = await createWorkoutAction({ name, date: selectedDate });
      router.push(`/dashboard?date=${savedDate}`);
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="date">Date</Label>
        <Input
          ref={dateRef}
          id="date"
          name="date"
          type="date"
          defaultValue={date}
          disabled={isPending}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="name">Workout name</Label>
        <Input
          ref={nameRef}
          id="name"
          name="name"
          placeholder="e.g. Push Day, Leg Day…"
          autoFocus
          disabled={isPending}
        />
        <p className="text-xs text-muted-foreground">
          Optional — leave blank for an untitled workout.
        </p>
      </div>
      <Button type="submit" disabled={isPending} className="w-full">
        {isPending ? "Creating…" : "Create Workout"}
      </Button>
    </form>
  );
}
