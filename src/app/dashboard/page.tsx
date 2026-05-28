export const dynamic = "force-dynamic";

import { getWorkoutsForDate } from "@/data/workouts";
import { formatDate } from "@/lib/date";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { WorkoutDatePicker } from "./WorkoutDatePicker";
import Link from "next/link";

interface DashboardPageProps {
  searchParams: Promise<{ date?: string }>;
}

export default async function DashboardPage({
  searchParams,
}: DashboardPageProps) {
  const { date: dateParam } = await searchParams;

  const date = dateParam ? new Date(dateParam) : new Date();
  const workouts = await getWorkoutsForDate(date);

  return (
    <div className="container mx-auto max-w-2xl px-4 py-10 space-y-8">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground text-sm">
            View your workouts for a specific date.
          </p>
        </div>
        <Button nativeButton={false} render={<Link href={`/dashboard/workout/new?date=${dateParam ?? new Date().toISOString().slice(0, 10)}`} />}>
          New Workout
        </Button>
      </div>

      <WorkoutDatePicker selected={date} />

      <div className="space-y-3">
        <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
          Workouts logged for {formatDate(date)}
        </h2>

        {workouts.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            No workouts logged for this date.
          </p>
        ) : (
          <div className="space-y-3">
            {workouts.map((workout) => (
              <Link key={workout.id} href={`/dashboard/workout/${workout.id}`}>
                <Card className="hover:bg-muted/50 transition-colors cursor-pointer">
                  <CardHeader className="pb-1">
                    <CardTitle className="text-base">
                      {workout.name ?? "Untitled Workout"}
                    </CardTitle>
                    <CardDescription>{formatDate(workout.createdAt)}</CardDescription>
                  </CardHeader>
                  {(workout.startedAt || workout.completedAt) && (
                    <CardContent>
                      <p className="text-sm text-muted-foreground">
                        {workout.startedAt && `Started: ${formatDate(workout.startedAt)}`}
                        {workout.completedAt && ` · Completed: ${formatDate(workout.completedAt)}`}
                      </p>
                    </CardContent>
                  )}
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
