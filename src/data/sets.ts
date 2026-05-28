import { db } from "@/db";
import { sets, workoutExercises, workouts } from "@/db/schema";
import { and, eq, sql } from "drizzle-orm";
import { auth } from "@clerk/nextjs/server";

async function assertSetOwnership(setId: number, userId: string) {
  const [row] = await db
    .select({ id: sets.id })
    .from(sets)
    .innerJoin(workoutExercises, eq(workoutExercises.id, sets.workoutExerciseId))
    .innerJoin(workouts, eq(workouts.id, workoutExercises.workoutId))
    .where(and(eq(sets.id, setId), eq(workouts.userId, userId)));
  if (!row) throw new Error("Not found");
}

export async function addSet(
  workoutExerciseId: number,
  reps?: number,
  weightKg?: string
) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  // Verify ownership
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

  const countResult = await db
    .select({ count: sql<number>`count(*)` })
    .from(sets)
    .where(eq(sets.workoutExerciseId, workoutExerciseId));
  const setNumber = Number(countResult[0].count) + 1;

  const [set] = await db
    .insert(sets)
    .values({ workoutExerciseId, setNumber, reps: reps ?? null, weightKg: weightKg ?? null })
    .returning();

  return set;
}

export async function updateSet(
  setId: number,
  reps?: number,
  weightKg?: string
) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  await assertSetOwnership(setId, userId);

  const [set] = await db
    .update(sets)
    .set({ reps: reps ?? null, weightKg: weightKg ?? null })
    .where(eq(sets.id, setId))
    .returning();

  return set;
}

export async function deleteSet(setId: number) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  await assertSetOwnership(setId, userId);

  await db.delete(sets).where(eq(sets.id, setId));
}
