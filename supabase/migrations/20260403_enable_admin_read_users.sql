drop policy if exists "Admins can read all profiles" on public.users;

create policy "Admins can read all profiles"
on public.users
for select
to authenticated
using (public.current_user_role() = 'admin');
