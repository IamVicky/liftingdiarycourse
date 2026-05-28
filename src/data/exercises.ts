import { db } from "@/db";
import { exercises } from "@/db/schema";
import { eq } from "drizzle-orm";
import { auth } from "@clerk/nextjs/server";

export async function getAllExercises() {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  return db.select().from(exercises).orderBy(exercises.name);
}

export async function createExercise(name: string) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const [exercise] = await db
    .insert(exercises)
    .values({ name })
    .onConflictDoNothing()
    .returning();

  if (!exercise) {
    const [existing] = await db
      .select()
      .from(exercises)
      .where(eq(exercises.name, name));
    return existing;
  }

  return exercise;
}
