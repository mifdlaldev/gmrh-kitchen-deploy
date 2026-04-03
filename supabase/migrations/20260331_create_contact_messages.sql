create table if not exists public.contact_messages (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  message text not null,
  created_at timestamptz not null default timezone('utc', now())
);

alter table public.contact_messages enable row level security;

drop policy if exists "Anyone can insert contact messages" on public.contact_messages;
create policy "Anyone can insert contact messages"
on public.contact_messages
for insert
to public
with check (
  char_length(trim(name)) > 0
  and char_length(trim(email)) > 0
  and char_length(trim(message)) > 0
);

drop policy if exists "Admins can read contact messages" on public.contact_messages;
create policy "Admins can read contact messages"
on public.contact_messages
for select
to authenticated
using (public.current_user_role() = 'admin');

comment on table public.contact_messages is 'Messages submitted from the public contact form.';
