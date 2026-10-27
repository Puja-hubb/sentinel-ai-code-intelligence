import json
import sqlite3
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

DB_PATH = Path(__file__).resolve().parent.parent / "sentinel_history.db"


def get_connection() -> sqlite3.Connection:
    connection = sqlite3.connect(DB_PATH, timeout=10)
    connection.row_factory = sqlite3.Row
    return connection


def initialize_database() -> None:
    with get_connection() as connection:
        connection.execute(
            """
            CREATE TABLE IF NOT EXISTS scans (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                filename TEXT NOT NULL,
                language TEXT NOT NULL,
                created_at TEXT NOT NULL,
                findings_count INTEGER NOT NULL,
                findings_json TEXT NOT NULL
            )
            """
        )


def save_scan(
    filename: str,
    language: str,
    findings: list[dict[str, Any]],
) -> int:
    created_at = datetime.now(timezone.utc).isoformat()
    findings_json = json.dumps(findings)

    with get_connection() as connection:
        cursor = connection.execute(
            """
            INSERT INTO scans (
                filename, language, created_at,
                findings_count, findings_json
            ) VALUES (?, ?, ?, ?, ?)
            """,
            (filename, language, created_at, len(findings), findings_json),
        )
        return int(cursor.lastrowid)


def list_scans(limit: int = 50) -> list[dict[str, Any]]:
    with get_connection() as connection:
        rows = connection.execute(
            """
            SELECT id, filename, language, created_at, findings_count
            FROM scans
            ORDER BY id DESC
            LIMIT ?
            """,
            (limit,),
        ).fetchall()

    return [dict(row) for row in rows]


def get_scan(scan_id: int) -> dict[str, Any] | None:
    with get_connection() as connection:
        row = connection.execute(
            "SELECT * FROM scans WHERE id = ?",
            (scan_id,),
        ).fetchone()

    if row is None:
        return None

    result = dict(row)
    result["findings"] = json.loads(result.pop("findings_json"))
    return result
