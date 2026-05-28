"use server";

import { z } from "zod";
import { updateWorkout } from "@/data/workouts";

const UpdateWorkoutSchema = z.object({
  workoutId: z.coerce.number().int().positive(),
  name: z.string().max(100).optional(),
  date: z.string().date(),
});

type UpdateWorkoutParams = z.infer<typeof UpdateWorkoutSchema>;

export async function updateWorkoutAction(params: UpdateWorkoutParams) {
  const { workoutId, name, date } = UpdateWorkoutSchema.parse(params);
  await updateWorkout(workoutId, { name: name?.trim() || undefined, date });
  return { date };
}
