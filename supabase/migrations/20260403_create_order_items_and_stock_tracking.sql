create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete cascade,
  product_id uuid not null references public.products (id) on delete restrict,
  product_name text not null,
  product_price integer not null,
  quantity integer not null check (quantity > 0),
  subtotal integer not null check (subtotal >= 0),
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists order_items_order_id_idx on public.order_items (order_id);
create index if not exists order_items_product_id_idx on public.order_items (product_id);

alter table public.order_items enable row level security;

drop policy if exists "order_items_insert_checkout" on public.order_items;
create policy "order_items_insert_checkout"
on public.order_items
for insert
to anon, authenticated
with check (true);

drop policy if exists "order_items_select_own" on public.order_items;
create policy "order_items_select_own"
on public.order_items
for select
to authenticated
using (
  exists (
    select 1
    from public.orders
    where public.orders.id = order_items.order_id
      and public.orders.customer_email = auth.email()
  )
);

drop policy if exists "order_items_select_admin" on public.order_items;
create policy "order_items_select_admin"
on public.order_items
for select
to authenticated
using (
  public.current_user_role() = 'admin'
);

alter table public.orders
add column if not exists stock_deducted boolean not null default false;
