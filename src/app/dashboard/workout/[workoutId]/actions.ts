"use server";

import { z } from "zod";
import {
  addExerciseToWorkout,
  removeExerciseFromWorkout,
} from "@/data/workoutExercises";
import { addSet, updateSet, deleteSet } from "@/data/sets";

const AddExerciseSchema = z.object({
  workoutId: z.coerce.number().int().positive(),
  exerciseId: z.coerce.number().int().positive(),
});

const RemoveExerciseSchema = z.object({
  workoutExerciseId: z.coerce.number().int().positive(),
});

const AddSetSchema = z.object({
  workoutExerciseId: z.coerce.number().int().positive(),
});

const UpdateSetSchema = z.object({
  setId: z.coerce.number().int().positive(),
  reps: z.coerce.number().int().positive().optional(),
  weightKg: z.string().regex(/^\d+(\.\d{1,2})?$/).optional(),
});

const DeleteSetSchema = z.object({
  setId: z.coerce.number().int().positive(),
});

export async function addExerciseToWorkoutAction(
  params: z.infer<typeof AddExerciseSchema>
) {
  const { workoutId, exerciseId } = AddExerciseSchema.parse(params);
  await addExerciseToWorkout(workoutId, exerciseId);
  return { success: true };
}

export async function removeExerciseFromWorkoutAction(
  params: z.infer<typeof RemoveExerciseSchema>
) {
  const { workoutExerciseId } = RemoveExerciseSchema.parse(params);
  await removeExerciseFromWorkout(workoutExerciseId);
  return { success: true };
}

export async function addSetAction(params: z.infer<typeof AddSetSchema>) {
  const { workoutExerciseId } = AddSetSchema.parse(params);
  await addSet(workoutExerciseId);
  return { success: true };
}

export async function updateSetAction(params: z.infer<typeof UpdateSetSchema>) {
  const { setId, reps, weightKg } = UpdateSetSchema.parse(params);
  await updateSet(setId, reps, weightKg);
  return { success: true };
}

export async function deleteSetAction(params: z.infer<typeof DeleteSetSchema>) {
  const { setId } = DeleteSetSchema.parse(params);
  await deleteSet(setId);
  return { success: true };
}
