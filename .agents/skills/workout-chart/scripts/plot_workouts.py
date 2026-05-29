#!/usr/bin/env python3
"""
Query workouts from the past year and export a bar chart of daily workout counts.
Usage: python plot_workouts.py <DATABASE_URL> [output_path]
"""

import sys
import os
from datetime import datetime, timedelta, timezone

try:
    import psycopg2
except ImportError:
    os.system(f"{sys.executable} -m pip install psycopg2-binary -q")
    import psycopg2

try:
    import matplotlib
    matplotlib.use("Agg")
    import matplotlib.pyplot as plt
    import matplotlib.dates as mdates
except ImportError:
    os.system(f"{sys.executable} -m pip install matplotlib -q")
    import matplotlib
    matplotlib.use("Agg")
    import matplotlib.pyplot as plt
    import matplotlib.dates as mdates

from collections import defaultdict

def main():
    if len(sys.argv) < 2:
        print("Usage: python plot_workouts.py <DATABASE_URL> [output_path]")
        sys.exit(1)

    db_url = sys.argv[1]
    output_path = sys.argv[2] if len(sys.argv) > 2 else "workouts_chart.png"

    one_year_ago = datetime.now(timezone.utc) - timedelta(days=365)

    conn = psycopg2.connect(db_url)
    cur = conn.cursor()
    cur.execute(
        """
        SELECT DATE(created_at AT TIME ZONE 'UTC') AS workout_date, COUNT(*) AS count
        FROM workouts
        WHERE created_at >= %s
        GROUP BY workout_date
        ORDER BY workout_date
        """,
        (one_year_ago,),
    )
    rows = cur.fetchall()
    cur.close()
    conn.close()

    if not rows:
        print("No workouts found in the past year.")
        sys.exit(0)

    dates = [row[0] for row in rows]
    counts = [row[1] for row in rows]

    fig, ax = plt.subplots(figsize=(14, 6))
    ax.bar(dates, counts, color="#4f8ef7", width=0.8, edgecolor="none")

    ax.xaxis.set_major_locator(mdates.MonthLocator())
    ax.xaxis.set_major_formatter(mdates.DateFormatter("%b %Y"))
    plt.xticks(rotation=45, ha="right")

    ax.set_xlabel("Date", fontsize=12)
    ax.set_ylabel("Number of Workouts", fontsize=12)
    ax.set_title("Workouts Per Day — Past Year", fontsize=14, fontweight="bold")
    ax.yaxis.get_major_locator().set_params(integer=True)
    ax.grid(axis="y", linestyle="--", alpha=0.5)

    plt.tight_layout()
    plt.savefig(output_path, dpi=150)
    print(f"Chart saved to: {os.path.abspath(output_path)}")


if __name__ == "__main__":
    main()
