/* Migration: create app_state table and open policies */

-- 1️⃣ Create table to store singleton application state
CREATE TABLE IF NOT EXISTS public.app_state (
    id         TEXT PRIMARY KEY,   -- always 'singleton'
    state_json JSONB NOT NULL      -- JSON containing the whole app state
);

-- 2️⃣ Insert initial row if it does not exist
INSERT INTO public.app_state (id, state_json)
VALUES ('singleton', '{}'::jsonb)
ON CONFLICT (id) DO NOTHING;

-- 3️⃣ Enable Row Level Security (required for policies)
ALTER TABLE public.app_state ENABLE ROW LEVEL SECURITY;

-- 4️⃣ Policy to allow anonymous users to SELECT (read) the state
DROP POLICY IF EXISTS public_select ON public.app_state;
CREATE POLICY "public_select"
    ON public.app_state
    FOR SELECT
    USING (true);

-- 5️⃣ Policy to allow anonymous users to INSERT the state (upsert)
DROP POLICY IF EXISTS public_insert ON public.app_state;
CREATE POLICY "public_insert"
    ON public.app_state
    FOR INSERT
    WITH CHECK (true);

-- 6️⃣ Policy to allow anonymous users to UPDATE the state (upsert)
DROP POLICY IF EXISTS public_update ON public.app_state;
CREATE POLICY "public_update"
    ON public.app_state
    FOR UPDATE
    WITH CHECK (true);
