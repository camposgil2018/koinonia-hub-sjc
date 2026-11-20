-- Limit direct shared-state access to leadership; members use validated server functions.
drop policy if exists "app_state_select_authenticated" on public.app_state;
create policy "app_state_select_authenticated"
on public.app_state for select
to authenticated
using (
  id = 'singleton'
  and (
    public.has_role(auth.uid(), 'admin'::public.app_role)
    or public.has_role(auth.uid(), 'moderator'::public.app_role)
  )
);

drop policy if exists "app_state_insert_authenticated" on public.app_state;
create policy "app_state_insert_authenticated"
on public.app_state for insert
to authenticated
with check (
  id = 'singleton'
  and public.has_role(auth.uid(), 'admin'::public.app_role)
);

drop policy if exists "app_state_update_authenticated" on public.app_state;
create policy "app_state_update_authenticated"
on public.app_state for update
to authenticated
using (
  id = 'singleton'
  and (
    public.has_role(auth.uid(), 'admin'::public.app_role)
    or public.has_role(auth.uid(), 'moderator'::public.app_role)
  )
)
with check (
  id = 'singleton'
  and (
    public.has_role(auth.uid(), 'admin'::public.app_role)
    or public.has_role(auth.uid(), 'moderator'::public.app_role)
  )
);

-- Phone numbers and email addresses are available to their owner and leadership.
drop policy if exists "profiles_select_authenticated" on public.profiles;
create policy "profiles_select_authenticated"
on public.profiles for select
to authenticated
using (
  auth.uid() = id
  or public.has_role(auth.uid(), 'admin'::public.app_role)
  or public.has_role(auth.uid(), 'moderator'::public.app_role)
);

-- Role assignments are visible to their owner and leadership only.
drop policy if exists "user_roles_select_authenticated" on public.user_roles;
create policy "user_roles_select_authenticated"
on public.user_roles for select
to authenticated
using (
  auth.uid() = user_id
  or public.has_role(auth.uid(), 'admin'::public.app_role)
  or public.has_role(auth.uid(), 'moderator'::public.app_role)
);

-- A safe directory preserves names needed by member schedules without exposing
-- other members' phone numbers, email addresses or role assignments.
create or replace function public.get_member_directory()
returns table (
  id uuid,
  name text,
  email text,
  phone text,
  ministries text[],
  avatar_color text,
  role public.app_role
)
language sql
stable
security definer
set search_path = public
as $$
  with caller as (
    select (
      public.has_role(auth.uid(), 'admin'::public.app_role)
      or public.has_role(auth.uid(), 'moderator'::public.app_role)
    ) as elevated
  )
  select
    p.id,
    p.name,
    case when caller.elevated or p.id = auth.uid() then p.email else '' end as email,
    case when caller.elevated or p.id = auth.uid() then p.phone else null end as phone,
    p.ministries,
    p.avatar_color,
    case
      when caller.elevated or p.id = auth.uid() then coalesce(
        (
          select ur.role
          from public.user_roles ur
          where ur.user_id = p.id
          order by case ur.role
            when 'admin' then 0
            when 'moderator' then 1
            else 2
          end
          limit 1
        ),
        'member'::public.app_role
      )
      else 'member'::public.app_role
    end as role
  from public.profiles p
  cross join caller
  where auth.uid() is not null;
$$;

revoke all on function public.get_member_directory() from public, anon;
grant execute on function public.get_member_directory() to authenticated;
