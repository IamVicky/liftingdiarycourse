"use client";

import { useState, useTransition, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { PencilIcon, PlusIcon, Trash2Icon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDate } from "@/lib/date";
import type { Workout, Exercise } from "@/db/schema";
import type { WorkoutExerciseWithSets } from "@/data/workoutExercises";
import {
  addExerciseToWorkoutAction,
  removeExerciseFromWorkoutAction,
  addSetAction,
  updateSetAction,
  deleteSetAction,
} from "./actions";

interface WorkoutLoggerProps {
  workout: Workout;
  workoutExercises: WorkoutExerciseWithSets[];
  allExercises: Exercise[];
}

export function WorkoutLogger({
  workout,
  workoutExercises,
  allExercises,
}: WorkoutLoggerProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [search, setSearch] = useState("");

  const filteredExercises = allExercises.filter((e) =>
    e.name.toLowerCase().includes(search.toLowerCase())
  );

  const existingExerciseIds = new Set(workoutExercises.map((we) => we.exerciseId));

  function refresh() {
    router.refresh();
  }

  function handleAddExercise(exerciseId: number) {
    startTransition(async () => {
      await addExerciseToWorkoutAction({ workoutId: workout.id, exerciseId });
      setDialogOpen(false);
      setSearch("");
      refresh();
    });
  }

  function handleRemoveExercise(workoutExerciseId: number) {
    startTransition(async () => {
      await removeExerciseFromWorkoutAction({ workoutExerciseId });
      refresh();
    });
  }

  function handleAddSet(workoutExerciseId: number) {
    startTransition(async () => {
      await addSetAction({ workoutExerciseId });
      refresh();
    });
  }

  function handleDeleteSet(setId: number) {
    startTransition(async () => {
      await deleteSetAction({ setId });
      refresh();
    });
  }

  return (
    <div className="container mx-auto max-w-2xl px-4 py-10 space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">
            {workout.name ?? "Untitled Workout"}
          </h1>
          <p className="text-sm text-muted-foreground">
            {formatDate(workout.createdAt)}
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          nativeButton={false}
          render={<Link href={`/dashboard/workout/${workout.id}/edit`} />}
        >
          <PencilIcon />
          Edit
        </Button>
      </div>

      {/* Exercise cards */}
      <div className="space-y-4">
        {workoutExercises.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No exercises logged yet. Add one below.
          </p>
        ) : (
          workoutExercises.map((we) => (
            <ExerciseCard
              key={we.id}
              we={we}
              isPending={isPending}
              onAddSet={handleAddSet}
              onDeleteSet={handleDeleteSet}
              onRemoveExercise={handleRemoveExercise}
            />
          ))
        )}
      </div>

      {/* Add Exercise */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogTrigger
          render={
            <Button disabled={isPending}>
              <PlusIcon />
              {isPending ? "Adding…" : "Add Exercise"}
            </Button>
          }
        />
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add Exercise</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Input
              placeholder="Search exercises…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              autoFocus
            />
            <ul className="max-h-64 overflow-y-auto space-y-1">
              {filteredExercises.length === 0 ? (
                <li className="text-sm text-muted-foreground px-2 py-1">
                  No exercises found.
                </li>
              ) : (
                filteredExercises.map((exercise) => (
                  <li key={exercise.id}>
                    <button
                      type="button"
                      disabled={isPending || existingExerciseIds.has(exercise.id)}
                      onClick={() => handleAddExercise(exercise.id)}
                      className="w-full text-left px-3 py-2 rounded-md text-sm hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {exercise.name}
                      {existingExerciseIds.has(exercise.id) && (
                        <span className="ml-2 text-xs text-muted-foreground">
                          (already added)
                        </span>
                      )}
                    </button>
                  </li>
                ))
              )}
            </ul>
          </div>
          <div className="flex justify-end">
            <DialogClose render={<Button variant="outline" />}>
              Cancel
            </DialogClose>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

interface ExerciseCardProps {
  we: WorkoutExerciseWithSets;
  isPending: boolean;
  onAddSet: (workoutExerciseId: number) => void;
  onDeleteSet: (setId: number) => void;
  onRemoveExercise: (workoutExerciseId: number) => void;
}

function ExerciseCard({
  we,
  isPending,
  onAddSet,
  onDeleteSet,
  onRemoveExercise,
}: ExerciseCardProps) {
  const router = useRouter();
  const [isSaving, startSaveTransition] = useTransition();

  function handleSetBlur(
    setId: number,
    reps: string,
    weightKg: string
  ) {
    const parsedReps = reps ? Number(reps) : undefined;
    const parsedWeight = weightKg || undefined;
    startSaveTransition(async () => {
      await updateSetAction({ setId, reps: parsedReps, weightKg: parsedWeight });
      router.refresh();
    });
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">{we.exerciseName}</CardTitle>
          <Button
            variant="ghost"
            size="icon-sm"
            disabled={isPending}
            onClick={() => onRemoveExercise(we.id)}
            aria-label={`Remove ${we.exerciseName}`}
          >
            <Trash2Icon />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {we.sets.length > 0 && (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">Set</TableHead>
                <TableHead>Reps</TableHead>
                <TableHead>Weight (kg)</TableHead>
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {we.sets.map((set) => (
                <SetRow
                  key={`${set.id}-${set.reps ?? ""}-${set.weightKg ?? ""}`}
                  set={set}
                  isPending={isPending || isSaving}
                  onBlurSave={handleSetBlur}
                  onDelete={onDeleteSet}
                />
              ))}
            </TableBody>
          </Table>
        )}
        <Button
          variant="outline"
          size="sm"
          disabled={isPending}
          onClick={() => onAddSet(we.id)}
        >
          <PlusIcon />
          Add Set
        </Button>
      </CardContent>
    </Card>
  );
}

interface SetRowProps {
  set: WorkoutExerciseWithSets["sets"][number];
  isPending: boolean;
  onBlurSave: (setId: number, reps: string, weightKg: string) => void;
  onDelete: (setId: number) => void;
}

function SetRow({ set, isPending, onBlurSave, onDelete }: SetRowProps) {
  const repsRef = useRef<HTMLInputElement>(null);
  const weightRef = useRef<HTMLInputElement>(null);

  function handleBlur() {
    const reps = repsRef.current?.value ?? "";
    const weight = weightRef.current?.value ?? "";
    onBlurSave(set.id, reps, weight);
  }

  return (
    <TableRow>
      <TableCell className="font-medium text-muted-foreground">
        {set.setNumber}
      </TableCell>
      <TableCell>
        <Input
          ref={repsRef}
          type="number"
          min={1}
          defaultValue={set.reps ?? ""}
          placeholder="—"
          className="h-7 w-20"
          disabled={isPending}
          onBlur={handleBlur}
        />
      </TableCell>
      <TableCell>
        <Input
          ref={weightRef}
          type="number"
          min={0}
          step={0.5}
          defaultValue={set.weightKg ?? ""}
          placeholder="—"
          className="h-7 w-24"
          disabled={isPending}
          onBlur={handleBlur}
        />
      </TableCell>
      <TableCell>
        <Button
          variant="ghost"
          size="icon-sm"
          disabled={isPending}
          onClick={() => onDelete(set.id)}
          aria-label="Delete set"
        >
          <Trash2Icon />
        </Button>
      </TableCell>
    </TableRow>
  );
}
