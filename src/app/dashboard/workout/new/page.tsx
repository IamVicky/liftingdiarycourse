import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { CreateWorkoutForm } from "./CreateWorkoutForm";

interface NewWorkoutPageProps {
  searchParams: Promise<{ date?: string }>;
}

export default async function NewWorkoutPage({ searchParams }: NewWorkoutPageProps) {
  const { date } = await searchParams;
  const dateValue = date ?? new Date().toISOString().slice(0, 10);

  return (
    <div className="container mx-auto max-w-md px-4 py-10">
      <Card>
        <CardHeader>
          <CardTitle>New Workout</CardTitle>
          <CardDescription>
            Give your workout a name to get started.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <CreateWorkoutForm date={dateValue} />
        </CardContent>
      </Card>
    </div>
  );
}
