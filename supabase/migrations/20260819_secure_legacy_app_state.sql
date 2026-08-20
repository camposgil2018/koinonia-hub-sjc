-- O estado da igreja contém dados internos e não pode ser acessado anonimamente.
alter table public.app_state enable row level security;

drop policy if exists "public_select" on public.app_state;
drop policy if exists "public_insert" on public.app_state;
drop policy if exists "public_update" on public.app_state;
drop policy if exists "authenticated_select" on public.app_state;
drop policy if exists "authenticated_insert" on public.app_state;
drop policy if exists "authenticated_update" on public.app_state;

create policy "authenticated_select"
on public.app_state for select
to authenticated
using (true);

create policy "authenticated_insert"
on public.app_state for insert
to authenticated
with check (true);

create policy "authenticated_update"
on public.app_state for update
to authenticated
using (true)
with check (true);
