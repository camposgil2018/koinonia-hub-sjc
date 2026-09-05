drop index if exists public.bible_notes_user_passage_idx;

alter table public.bible_notes
  drop column if exists book_id,
  drop column if exists book_name,
  drop column if exists chapter;

create index if not exists bible_notes_user_updated_idx
  on public.bible_notes (user_id, updated_at desc);
