"""
RASHTRA DB MIGRATION SCRIPT
Run this ONCE to add new columns and tables to your existing database.
Usage: python migrate_db.py
"""

import os
import psycopg2
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.environ.get("DATABASE_URL", "postgresql://postgres:postgres@localhost:5432/rashtra")

MIGRATIONS = [
    # --- Soft delete columns on complaints ---
    "ALTER TABLE complaints ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP;",
    "ALTER TABLE complaints ADD COLUMN IF NOT EXISTS deleted_by VARCHAR;",
    "ALTER TABLE complaints ADD COLUMN IF NOT EXISTS deleted_by_name VARCHAR;",
    "ALTER TABLE complaints ADD COLUMN IF NOT EXISTS deleted_by_role VARCHAR;",
    "ALTER TABLE complaints ADD COLUMN IF NOT EXISTS delete_reason TEXT;",
    "ALTER TABLE complaints ADD COLUMN IF NOT EXISTS road_type VARCHAR;",
    "ALTER TABLE complaints ADD COLUMN IF NOT EXISTS priority_rank FLOAT DEFAULT 0;",
    "ALTER TABLE complaints ADD COLUMN IF NOT EXISTS rejection_reason TEXT;",

    # --- Appeal requests table ---
    """
    CREATE TABLE IF NOT EXISTS appeal_requests (
        id          VARCHAR PRIMARY KEY,
        complaint_id VARCHAR NOT NULL REFERENCES complaints(id),
        from_dept   VARCHAR NOT NULL,
        reason      TEXT NOT NULL,
        status      VARCHAR NOT NULL DEFAULT 'PENDING',
        assigned_to VARCHAR,
        reviewed_by VARCHAR,
        created_at  TIMESTAMP NOT NULL DEFAULT NOW(),
        reviewed_at TIMESTAMP
    );
    """,

    # --- Index for fast audit queries ---
    "CREATE INDEX IF NOT EXISTS idx_complaints_deleted_at ON complaints(deleted_at);",
    "CREATE INDEX IF NOT EXISTS idx_appeals_status ON appeal_requests(status);",

    # --- Messages table for inter-department chat ---
    """
    CREATE TABLE IF NOT EXISTS messages (
        id          VARCHAR PRIMARY KEY,
        channel     VARCHAR NOT NULL,
        sender_id   VARCHAR NOT NULL,
        sender_name VARCHAR NOT NULL,
        sender_dept VARCHAR,
        text        TEXT NOT NULL,
        timestamp   TIMESTAMP NOT NULL DEFAULT NOW()
    );
    """,
    "CREATE INDEX IF NOT EXISTS idx_messages_channel ON messages(channel);",
    "CREATE INDEX IF NOT EXISTS idx_messages_timestamp ON messages(timestamp);",
]

def run():
    print("Connecting to database...")
    conn = psycopg2.connect(DATABASE_URL)
    conn.autocommit = True
    cur = conn.cursor()

    for i, sql in enumerate(MIGRATIONS):
        try:
            cur.execute(sql)
            print(f"  ✅ Migration {i+1} applied")
        except Exception as e:
            print(f"  ⚠️  Migration {i+1} skipped/failed: {e}")

    cur.close()
    conn.close()
    print("\nMigration complete. You can now start the server normally.")

if __name__ == "__main__":
    run()