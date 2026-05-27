import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { createWorkoutAction } from "./actions";
import { CreateWorkoutForm } from "./CreateWorkoutForm";

export default function NewWorkoutPage() {
  return (
    <div className="container mx-auto max-w-md px-4 py-10">
      <Card>
        <CardHeader>
          <CardTitle>New Workout</CardTitle>
          <CardDescription>Give your workout a name to get started.</CardDescription>
        </CardHeader>
        <CardContent>
          <CreateWorkoutForm action={createWorkoutAction} />
        </CardContent>
      </Card>
    </div>
  );
}
