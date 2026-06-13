"""
SQLite data-access layer for meal history.

This is the ONLY module that talks to the database directly. The FastAPI
endpoints in main.py call these functions and never write SQL themselves, so if
we ever swap SQLite for Turso/Postgres later, only this file changes.

Uses Python's stdlib `sqlite3` — no extra dependency, keeps the stack light.
"""

import os
import json
import sqlite3
from contextlib import contextmanager

# The whole database is a single file living next to this module. Absolute path
# so it doesn't depend on where uvicorn was launched from (repo root vs backend/).
DB_PATH = os.path.join(os.path.dirname(__file__), "meals.db")


@contextmanager
def get_connection():
    """Open a connection, commit on success, and ALWAYS close it.

    `row_factory = sqlite3.Row` lets us read columns by name (row["calories"])
    instead of by numeric index, which keeps the query code readable.
    """
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    try:
        yield conn
        conn.commit()          # persist any writes made inside the `with` block
    finally:
        conn.close()


def init_db():
    """Create the meals table + index if they don't exist. Safe to call on every startup."""
    with get_connection() as conn:
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS meals (
                id          INTEGER PRIMARY KEY AUTOINCREMENT,
                device_id   TEXT    NOT NULL,
                meal_type   TEXT    NOT NULL,   -- 'breakfast' | 'lunch' | 'dinner' | 'snack'
                logged_at   TEXT    NOT NULL,   -- ISO timestamp, e.g. 2026-06-13T10:30:00
                calories    INTEGER NOT NULL DEFAULT 0,
                protein     INTEGER NOT NULL DEFAULT 0,
                carbs       INTEGER NOT NULL DEFAULT 0,
                fats        INTEGER NOT NULL DEFAULT 0,
                zinc_mg     REAL    NOT NULL DEFAULT 0,   -- micros are floats (iron is often < 2 mg)
                calcium_mg  REAL    NOT NULL DEFAULT 0,
                iron_mg     REAL    NOT NULL DEFAULT 0,
                items_json  TEXT    NOT NULL DEFAULT '[]' -- per-item breakdown, stored as JSON text
            )
            """
        )
        # Index the columns we filter by, so "today's meals for this device" stays fast.
        conn.execute(
            "CREATE INDEX IF NOT EXISTS idx_meals_device_date ON meals(device_id, logged_at)"
        )


def insert_meal(device_id, meal_type, logged_at, totals, items):
    """Insert one logged meal and return its new row id.

    `totals` is a dict with the 7 nutrient keys; `items` is the list of per-item
    dicts (we serialize it to a JSON string for the items_json column).
    Every value goes through a `?` placeholder — no string concatenation, no
    SQL injection.
    """
    with get_connection() as conn:
        cursor = conn.execute(
            """
            INSERT INTO meals
                (device_id, meal_type, logged_at,
                 calories, protein, carbs, fats, zinc_mg, calcium_mg, iron_mg, items_json)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                device_id,
                meal_type,
                logged_at,
                totals.get("calories", 0),
                totals.get("protein", 0),
                totals.get("carbs", 0),
                totals.get("fats", 0),
                totals.get("zinc_mg", 0),
                totals.get("calcium_mg", 0),
                totals.get("iron_mg", 0),
                json.dumps(items),
            ),
        )
        return cursor.lastrowid


def get_meals_for_date(device_id, date):
    """Return all meals for a device on a given date (YYYY-MM-DD), newest first.

    `date(logged_at)` extracts just the day from the ISO timestamp, so we match
    the entire day regardless of the time portion.
    """
    with get_connection() as conn:
        rows = conn.execute(
            """
            SELECT * FROM meals
            WHERE device_id = ? AND date(logged_at) = ?
            ORDER BY logged_at DESC
            """,
            (device_id, date),
        ).fetchall()

    # Convert each sqlite3.Row into a plain dict and parse items_json back to a list.
    meals = []
    for row in rows:
        meal = dict(row)
        meal["items"] = json.loads(meal.pop("items_json"))
        meals.append(meal)
    return meals


def delete_meal(device_id, meal_id):
    """Delete a meal by id, but only if it belongs to this device.

    The `AND device_id = ?` guard means one device can never delete another
    device's row. Returns True if a row was actually deleted.
    """
    with get_connection() as conn:
        cursor = conn.execute(
            "DELETE FROM meals WHERE id = ? AND device_id = ?",
            (meal_id, device_id),
        )
        return cursor.rowcount > 0
