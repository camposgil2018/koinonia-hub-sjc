create table if not exists public.bible_notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  book_id integer not null check (book_id between 1 and 66),
  book_name text not null,
  chapter integer not null check (chapter > 0),
  content text not null check (char_length(trim(content)) between 1 and 10000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists bible_notes_user_passage_idx
  on public.bible_notes (user_id, book_id, chapter, updated_at desc);

alter table public.bible_notes enable row level security;

create policy "users_can_read_their_bible_notes"
on public.bible_notes for select
to authenticated
using (auth.uid() = user_id);

create policy "users_can_create_their_bible_notes"
on public.bible_notes for insert
to authenticated
with check (auth.uid() = user_id);

create policy "users_can_update_their_bible_notes"
on public.bible_notes for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "users_can_delete_their_bible_notes"
on public.bible_notes for delete
to authenticated
using (auth.uid() = user_id);
