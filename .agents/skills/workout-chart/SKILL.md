---
name: workout-chart
description: Query the lifting diary database for all workout entries over the past year and generate a bar chart image showing workouts per day. Use this skill whenever the user asks to visualize workout history, plot workout frequency, chart lifting activity, export a workout graph, or see how often they've been training over time — even if they don't say "chart" explicitly.
---

# Workout Chart

Generate a bar chart of daily workout counts for the past year by querying the PostgreSQL database and running the bundled Python script.

## Steps

1. **Read the DATABASE_URL** from the `.env` file in the project root.
   - Look for a line starting with `DATABASE_URL=`.
   - Strip any surrounding whitespace or quotes.

2. **Determine the output path.**
   - Default: `workouts_chart.png` in the current working directory.
   - If the user specified a path or filename, use that instead.

3. **Run the bundled script**, passing the connection string and output path:
   ```
   python .agents/skills/workout-chart/scripts/plot_workouts.py "<DATABASE_URL>" "<output_path>"
   ```
   The script auto-installs `psycopg2-binary` and `matplotlib` if they're missing, so no manual setup is needed.

4. **Report back** — tell the user where the image was saved and describe what it shows (date range, total days with workouts, peak day if notable).

## What the script does

- Connects to the Neon PostgreSQL database using the provided URL.
- Queries the `workouts` table for rows where `created_at` is within the past 365 days.
- Groups by date and counts entries per day.
- Renders a bar chart (x = date, y = workout count) and saves it as a PNG at 150 dpi.

## Notes

- The script uses `created_at` (never null) rather than `started_at` (nullable) for reliability.
- Dates are normalized to UTC so cross-timezone data stays consistent.
- The chart x-axis uses monthly tick marks regardless of how sparse the data is — this keeps the label readable even for users who train infrequently.
