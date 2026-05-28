import { db } from "@/db";
import { exercises, sets, workoutExercises, workouts } from "@/db/schema";
import { and, eq, sql } from "drizzle-orm";
import { auth } from "@clerk/nextjs/server";

export type WorkoutExerciseWithSets = {
  id: number;
  workoutId: number;
  exerciseId: number;
  order: number;
  exerciseName: string;
  sets: {
    id: number;
    setNumber: number;
    reps: number | null;
    weightKg: string | null;
  }[];
};

export async function getWorkoutExercisesWithSets(
  workoutId: number
): Promise<WorkoutExerciseWithSets[]> {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const rows = await db
    .select({
      weId: workoutExercises.id,
      workoutId: workoutExercises.workoutId,
      exerciseId: workoutExercises.exerciseId,
      order: workoutExercises.order,
      exerciseName: exercises.name,
      setId: sets.id,
      setNumber: sets.setNumber,
      reps: sets.reps,
      weightKg: sets.weightKg,
    })
    .from(workoutExercises)
    .innerJoin(workouts, eq(workouts.id, workoutExercises.workoutId))
    .innerJoin(exercises, eq(exercises.id, workoutExercises.exerciseId))
    .leftJoin(sets, eq(sets.workoutExerciseId, workoutExercises.id))
    .where(
      and(
        eq(workoutExercises.workoutId, workoutId),
        eq(workouts.userId, userId)
      )
    )
    .orderBy(workoutExercises.order, sets.setNumber);

  // Collapse flat rows into nested structure
  const map = new Map<number, WorkoutExerciseWithSets>();
  for (const row of rows) {
    if (!map.has(row.weId)) {
      map.set(row.weId, {
        id: row.weId,
        workoutId: row.workoutId,
        exerciseId: row.exerciseId,
        order: row.order,
        exerciseName: row.exerciseName,
        sets: [],
      });
    }
    if (row.setId !== null) {
      map.get(row.weId)!.sets.push({
        id: row.setId,
        setNumber: row.setNumber!,
        reps: row.reps ?? null,
        weightKg: row.weightKg ?? null,
      });
    }
  }

  return Array.from(map.values());
}

export async function addExerciseToWorkout(
  workoutId: number,
  exerciseId: number
) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  // Verify ownership
  const [workout] = await db
    .select()
    .from(workouts)
    .where(and(eq(workouts.id, workoutId), eq(workouts.userId, userId)));
  if (!workout) throw new Error("Workout not found");

  // Compute next order value
  const countResult = await db
    .select({ count: sql<number>`count(*)` })
    .from(workoutExercises)
    .where(eq(workoutExercises.workoutId, workoutId));
  const order = Number(countResult[0].count) + 1;

  const [we] = await db
    .insert(workoutExercises)
    .values({ workoutId, exerciseId, order })
    .returning();

  return we;
}

export async function removeExerciseFromWorkout(workoutExerciseId: number) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  // Verify ownership through join
  const [row] = await db
    .select({ weId: workoutExercises.id })
    .from(workoutExercises)
    .innerJoin(workouts, eq(workouts.id, workoutExercises.workoutId))
    .where(
      and(
        eq(workoutExercises.id, workoutExerciseId),
        eq(workouts.userId, userId)
      )
    );
  if (!row) throw new Error("Not found");

  await db
    .delete(workoutExercises)
    .where(eq(workoutExercises.id, workoutExerciseId));
}
