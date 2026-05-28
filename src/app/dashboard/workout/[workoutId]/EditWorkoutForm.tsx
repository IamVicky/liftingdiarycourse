"use client";

import { useTransition, useRef } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { updateWorkoutAction } from "./actions";

interface EditWorkoutFormProps {
  workoutId: number;
  defaultName: string;
  defaultDate: string;
}

export function EditWorkoutForm({ workoutId, defaultName, defaultDate }: EditWorkoutFormProps) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const nameRef = useRef<HTMLInputElement>(null);
  const dateRef = useRef<HTMLInputElement>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const name = nameRef.current?.value.trim() || undefined;
    const date = dateRef.current?.value ?? defaultDate;
    startTransition(async () => {
      const { date: savedDate } = await updateWorkoutAction({ workoutId, name, date });
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
          defaultValue={defaultDate}
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
          defaultValue={defaultName}
          autoFocus
          disabled={isPending}
        />
        <p className="text-xs text-muted-foreground">
          Optional — leave blank for an untitled workout.
        </p>
      </div>
      <div className="flex gap-2">
        <Button type="submit" disabled={isPending} className="flex-1">
          {isPending ? "Saving…" : "Save Changes"}
        </Button>
        <Button
          type="button"
          variant="outline"
          disabled={isPending}
          onClick={() => router.back()}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}
