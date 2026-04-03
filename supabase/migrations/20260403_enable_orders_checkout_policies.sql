alter table if exists public.orders enable row level security;

drop policy if exists "orders_insert_checkout" on public.orders;
create policy "orders_insert_checkout"
on public.orders
for insert
to anon, authenticated
with check (
  status in ('pending', 'confirmed', 'preparing', 'ready', 'delivered', 'cancelled')
);

drop policy if exists "orders_select_own" on public.orders;
create policy "orders_select_own"
on public.orders
for select
to authenticated
using (
  customer_email = auth.email()
);

drop policy if exists "orders_select_admin" on public.orders;
create policy "orders_select_admin"
on public.orders
for select
to authenticated
using (
  public.current_user_role() = 'admin'
);

drop policy if exists "orders_update_checkout_status" on public.orders;
create policy "orders_update_checkout_status"
on public.orders
for update
to anon, authenticated
using (true)
with check (
  status in ('pending', 'confirmed', 'preparing', 'ready', 'delivered', 'cancelled')
);
