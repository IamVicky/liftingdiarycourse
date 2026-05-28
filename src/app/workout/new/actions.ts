"use server";

import { createWorkout } from "@/data/workouts";
import { redirect } from "next/navigation";

export async function createWorkoutAction(formData: FormData) {
  const name = (formData.get("name") as string | null)?.trim() || undefined;
  const workout = await createWorkout(name);
  redirect(`/dashboard`);
}
