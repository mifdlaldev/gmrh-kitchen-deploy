do $$
declare
  target_email text := 'CHANGE_ME@example.com';
begin
  update public.users
  set role = 'admin'
  where email = target_email;

  if not found then
    raise exception 'User dengan email % tidak ditemukan di public.users', target_email;
  end if;
end
$$;
