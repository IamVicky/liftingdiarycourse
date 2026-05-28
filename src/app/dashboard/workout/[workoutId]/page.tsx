import { notFound } from "next/navigation";
import { getWorkoutById } from "@/data/workouts";
import { getWorkoutExercisesWithSets } from "@/data/workoutExercises";
import { getAllExercises } from "@/data/exercises";
import { WorkoutLogger } from "./WorkoutLogger";

interface WorkoutPageProps {
  params: Promise<{ workoutId: string }>;
}

export default async function WorkoutPage({ params }: WorkoutPageProps) {
  const { workoutId } = await params;
  const id = Number(workoutId);

  if (!Number.isInteger(id) || id <= 0) notFound();

  const workout = await getWorkoutById(id);
  if (!workout) notFound();

  const [workoutExercises, allExercises] = await Promise.all([
    getWorkoutExercisesWithSets(id),
    getAllExercises(),
  ]);

  return (
    <WorkoutLogger
      workout={workout}
      workoutExercises={workoutExercises}
      allExercises={allExercises}
    />
  );
}
