-- Recurring task series support (additive only — does NOT delete existing data)
-- Safe to run in Supabase SQL Editor.
-- Uses BIGINT ids to match existing boards/columns/tasks tables.

CREATE TABLE IF NOT EXISTS task_series (
    id BIGSERIAL PRIMARY KEY,
    user_id TEXT NOT NULL,
    column_id BIGINT NOT NULL REFERENCES columns(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    assignee TEXT,
    priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
    weekdays INTEGER[] NOT NULL DEFAULT '{1,2,3,4,5}',
    start_date DATE NOT NULL,
    end_type TEXT NOT NULL DEFAULT 'count' CHECK (end_type IN ('count', 'until')),
    occurrence_count INTEGER,
    end_date DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE tasks ADD COLUMN IF NOT EXISTS series_id BIGINT REFERENCES task_series(id) ON DELETE SET NULL;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS series_exception BOOLEAN NOT NULL DEFAULT FALSE;

ALTER TABLE boards ADD COLUMN IF NOT EXISTS is_repetitive_board BOOLEAN NOT NULL DEFAULT FALSE;

CREATE INDEX IF NOT EXISTS idx_tasks_series_id ON tasks(series_id);
CREATE INDEX IF NOT EXISTS idx_task_series_user_id ON task_series(user_id);

ALTER TABLE task_series ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public' AND tablename = 'task_series'
          AND policyname = 'Users can view their own task series'
    ) THEN
        CREATE POLICY "Users can view their own task series"
            ON task_series FOR SELECT
            USING (user_id = (auth.jwt() ->> 'sub'));
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public' AND tablename = 'task_series'
          AND policyname = 'Users can insert their own task series'
    ) THEN
        CREATE POLICY "Users can insert their own task series"
            ON task_series FOR INSERT
            WITH CHECK (user_id = (auth.jwt() ->> 'sub'));
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public' AND tablename = 'task_series'
          AND policyname = 'Users can update their own task series'
    ) THEN
        CREATE POLICY "Users can update their own task series"
            ON task_series FOR UPDATE
            USING (user_id = (auth.jwt() ->> 'sub'))
            WITH CHECK (user_id = (auth.jwt() ->> 'sub'));
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public' AND tablename = 'task_series'
          AND policyname = 'Users can delete their own task series'
    ) THEN
        CREATE POLICY "Users can delete their own task series"
            ON task_series FOR DELETE
            USING (user_id = (auth.jwt() ->> 'sub'));
    END IF;
END $$;
