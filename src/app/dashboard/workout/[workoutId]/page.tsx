import { notFound } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getWorkoutById } from "@/data/workouts";
import { EditWorkoutForm } from "./EditWorkoutForm";

interface EditWorkoutPageProps {
  params: Promise<{ workoutId: string }>;
}

export default async function EditWorkoutPage({ params }: EditWorkoutPageProps) {
  const { workoutId } = await params;
  const id = Number(workoutId);

  if (!Number.isInteger(id) || id <= 0) notFound();

  const workout = await getWorkoutById(id);
  if (!workout) notFound();

  const defaultDate = workout.createdAt.toISOString().slice(0, 10);
  const defaultName = workout.name ?? "";

  return (
    <div className="container mx-auto max-w-md px-4 py-10">
      <Card>
        <CardHeader>
          <CardTitle>Edit Workout</CardTitle>
          <CardDescription>Update the name or date of this workout.</CardDescription>
        </CardHeader>
        <CardContent>
          <EditWorkoutForm
            workoutId={id}
            defaultName={defaultName}
            defaultDate={defaultDate}
          />
        </CardContent>
      </Card>
    </div>
  );
}
