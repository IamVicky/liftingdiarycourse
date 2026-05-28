"use server";

import { z } from "zod";
import { createWorkout } from "@/data/workouts";
const CreateWorkoutSchema = z.object({
  name: z.string().max(100).optional(),
  date: z.string().date(),
});

type CreateWorkoutParams = z.infer<typeof CreateWorkoutSchema>;

export async function createWorkoutAction(params: CreateWorkoutParams) {
  const { name, date } = CreateWorkoutSchema.parse(params);
  await createWorkout(name?.trim() || undefined, new Date(date));
  return { date };
}
