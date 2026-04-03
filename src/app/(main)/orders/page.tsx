import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ClipboardList,
  Clock3,
  CreditCard,
  MapPin,
  ShoppingBag,
} from "lucide-react";
import { OrderItemsSummary } from "@/components/orders/order-items-summary";
import { createClient } from "@/lib/supabase/server";
import { hasSupabaseEnv, missingSupabaseEnvMessage } from "@/lib/supabase/env";
import {
  formatOrderCurrency,
  groupOrderItemsByOrderId,
  getOrderStatusClasses,
  getOrderStatusLabel,
  isPaidOrderStatus,
  mapOrdersErrorMessage,
  type OrderItemRecord,
  type OrderRecord,
} from "@/lib/orders";

export default async function UserOrdersPage() {
  const isSupabaseReady = hasSupabaseEnv();

  if (!isSupabaseReady) {
    return (
      <div className="min-h-screen bg-[#f6ecdf] py-16">
        <div className="container mx-auto max-w-6xl px-6">
          <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            {missingSupabaseEnvMessage}
          </div>
        </div>
      </div>
    );
  }

  const supabase = await createClient();

  if (!supabase) {
    return (
      <div className="min-h-screen bg-[#f6ecdf] py-16">
        <div className="container mx-auto max-w-6xl px-6">
          <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            {missingSupabaseEnvMessage}
          </div>
        </div>
      </div>
    );
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email) {
    redirect("/login?next=/orders");
  }

  const { data, error } = await supabase
    .from("orders")
    .select("id,customer_name,customer_email,delivery_address,total_price,status,created_at")
    .eq("customer_email", user.email)
    .order("created_at", { ascending: false });

  const orders = ((data as OrderRecord[] | null) ?? []);
  const orderIds = orders.map((order) => order.id);
  let orderItemsByOrderId: Record<string, OrderItemRecord[]> = {};
  let productImagesById: Record<string, string> = {};
  let orderItemsErrorMessage = "";

  if (orderIds.length > 0) {
    const { data: orderItemsData, error: orderItemsError } = await supabase
      .from("order_items")
      .select("id,order_id,product_id,product_name,product_price,quantity,subtotal")
      .in("order_id", orderIds);

    if (orderItemsError) {
      orderItemsErrorMessage = mapOrdersErrorMessage(orderItemsError.message);
    } else {
      const orderItems = (orderItemsData as OrderItemRecord[] | null) ?? [];
      orderItemsByOrderId = groupOrderItemsByOrderId(orderItems);

      const productIds = [...new Set(orderItems.map((item) => item.product_id))];

      if (productIds.length > 0) {
        const { data: productsData, error: productsError } = await supabase
          .from("products")
          .select("id,image")
          .in("id", productIds);

        if (productsError) {
          orderItemsErrorMessage = mapOrdersErrorMessage(productsError.message);
        } else {
          productImagesById = ((productsData as { id: string; image: string | null }[] | null) ?? [])
            .reduce<Record<string, string>>((map, product) => {
              if (product.image) {
                map[product.id] = product.image;
              }
              return map;
            }, {});
        }
      }
    }
  }

  const pendingOrders = orders.filter((order) => !isPaidOrderStatus(order.status));
  const paidOrders = orders.filter((order) => isPaidOrderStatus(order.status));
  const totalSpent = paidOrders.reduce(
    (total, order) => total + (order.total_price ?? 0),
    0
  );

  return (
    <div className="min-h-screen bg-[#f6ecdf] py-16">
      <div className="container mx-auto max-w-6xl px-6">
        <div className="mb-10">
          <div className="kitchen-badge">Order history</div>
          <h1 className="font-display mt-6 text-5xl font-bold text-slate-900">
            Pesanan saya
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-8 text-slate-600">
            Lihat status pembayaran dan riwayat checkout Anda di GMRH Kitchen
            dalam satu halaman yang rapi.
          </p>
        </div>

        {error && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {mapOrdersErrorMessage(error.message)}
          </div>
        )}

        {orderItemsErrorMessage && (
          <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            {orderItemsErrorMessage}
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="surface-panel rounded-[2rem] p-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">
                  Total orders
                </p>
                <p className="mt-4 text-4xl font-bold text-slate-900">
                  {orders.length.toLocaleString("id-ID")}
                </p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-900 text-white">
                <ClipboardList className="h-5 w-5" strokeWidth={2.2} />
              </div>
            </div>
          </div>

          <div className="surface-panel rounded-[2rem] p-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">
                  Menunggu
                </p>
                <p className="mt-4 text-4xl font-bold text-slate-900">
                  {pendingOrders.length.toLocaleString("id-ID")}
                </p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-900 text-white">
                <Clock3 className="h-5 w-5" strokeWidth={2.2} />
              </div>
            </div>
          </div>

          <div className="surface-panel rounded-[2rem] p-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">
                  Total belanja
                </p>
                <p className="mt-4 text-3xl font-bold text-slate-900">
                  {formatOrderCurrency(totalSpent)}
                </p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-900 text-white">
                <CreditCard className="h-5 w-5" strokeWidth={2.2} />
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 surface-panel rounded-[2rem] p-6 md:p-7">
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.24em] text-orange-700">
                Latest orders
              </p>
              <h2 className="mt-2 text-2xl font-semibold text-slate-900">
                Riwayat pesanan terbaru
              </h2>
            </div>
            <p className="text-sm text-slate-500">
              Status akan berubah otomatis saat pembayaran Midtrans terverifikasi.
            </p>
          </div>

          {orders.length === 0 ? (
            <div className="mt-6 rounded-[1.6rem] bg-white/70 p-8 text-center">
              <ShoppingBag className="mx-auto h-10 w-10 text-orange-500" strokeWidth={2.2} />
              <h3 className="mt-4 text-xl font-semibold text-slate-900">
                Belum ada pesanan
              </h3>
              <p className="mt-3 text-sm leading-7 text-slate-500">
                Setelah Anda checkout dan membayar pesanan pertama, riwayatnya akan tampil di sini.
              </p>
              <Link
                href="/menu"
                className="kitchen-primary-btn mt-6 px-6 py-3 text-sm font-semibold"
              >
                Pesan Sekarang
              </Link>
            </div>
          ) : (
            <div className="mt-6 space-y-4">
              {orders.map((order) => {
                const orderItems = orderItemsByOrderId[order.id] ?? [];

                return (
                  <article
                    key={order.id}
                    className="rounded-[1.7rem] border border-[#eadbc9] bg-white/85 p-5"
                  >
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      <div className="space-y-3">
                        <div className="flex flex-wrap items-center gap-3">
                          <h3 className="text-lg font-semibold text-slate-900">
                            {order.customer_name || "Pelanggan GMRH"}
                          </h3>
                          <span
                            className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${getOrderStatusClasses(order.status)}`}
                          >
                            {getOrderStatusLabel(order.status)}
                          </span>
                        </div>
                        <p className="text-sm text-slate-500">
                          {order.customer_email || user.email}
                        </p>
                        <p className="text-xs uppercase tracking-[0.18em] text-slate-400">
                          Order ID: {order.id}
                        </p>

                        <div className="flex items-start gap-3 rounded-[1.1rem] bg-[#fbf5ec] px-4 py-3">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-orange-600 shadow-sm">
                            <MapPin className="h-4 w-4" strokeWidth={2.2} />
                          </div>
                          <div>
                            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                              Alamat pengantaran
                            </p>
                            <p className="mt-1 text-sm leading-6 text-slate-700">
                              {order.delivery_address || "Alamat belum tersedia untuk pesanan ini."}
                            </p>
                          </div>
                        </div>

                        <OrderItemsSummary
                          items={orderItems}
                          productImagesById={productImagesById}
                        />
                      </div>

                      <div className="grid gap-4 sm:grid-cols-2 lg:min-w-[340px]">
                        <div className="rounded-[1.3rem] bg-[#fbf5ec] px-4 py-3">
                          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                            Total
                          </p>
                          <p className="mt-2 text-lg font-bold text-slate-900">
                            {formatOrderCurrency(order.total_price)}
                          </p>
                        </div>
                        <div className="rounded-[1.3rem] bg-[#fbf5ec] px-4 py-3">
                          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                            Dibuat
                          </p>
                          <p className="mt-2 text-sm font-semibold text-slate-900">
                            {order.created_at
                              ? new Date(order.created_at).toLocaleString("id-ID")
                              : "-"}
                          </p>
                        </div>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
