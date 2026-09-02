-- Permite que somente a Liderança remova definitivamente outro usuário.
create or replace function public.delete_member(target_user_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null then
    raise exception 'Usuário não autenticado';
  end if;

  if auth.uid() = target_user_id then
    raise exception 'Você não pode remover a si mesmo';
  end if;

  if not public.has_role(auth.uid(), 'admin'::public.app_role) then
    raise exception 'Apenas administradores podem remover membros';
  end if;

  if not exists (select 1 from auth.users where id = target_user_id) then
    raise exception 'Membro não encontrado';
  end if;

  delete from auth.users where id = target_user_id;
end;
$$;

revoke all on function public.delete_member(uuid) from public;
grant execute on function public.delete_member(uuid) to authenticated;
