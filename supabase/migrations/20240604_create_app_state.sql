/* Migration: create app_state table and policies */

-- Create table to store singleton application state
CREATE TABLE IF NOT EXISTS public.app_state (
    id text PRIMARY KEY,               -- always 'singleton'
    state_json jsonb NOT NULL           -- JSON representation of the entire app state
);

-- Insert initial row if it does not exist
INSERT INTO public.app_state (id, state_json)
VALUES ('singleton', '{}'::jsonb)
ON CONFLICT (id) DO NOTHING;

-- Enable row level security (required for policies)
ALTER TABLE public.app_state ENABLE ROW LEVEL SECURITY;

-- Policy to allow anonymous users to SELECT (read) the state
CREATE POLICY "public_select"
    ON public.app_state
    FOR SELECT
    USING (true);

-- Policy to allow anonymous users to INSERT/UPDATE (upsert) the state
CREATE POLICY "public_upsert"
    ON public.app_state
    FOR INSERT, UPDATE
    WITH CHECK (true);
