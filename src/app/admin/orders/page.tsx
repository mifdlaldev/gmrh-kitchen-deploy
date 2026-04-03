"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Clock3,
  CreditCard,
  MapPin,
  RefreshCcw,
  ShoppingBasket,
  TimerReset,
  Truck,
  Wallet,
} from "lucide-react";
import StatCard from "@/components/admin/stat-card";
import { OrderItemsSummary } from "@/components/orders/order-items-summary";
import { createClient } from "@/lib/supabase/client";
import { hasSupabaseEnv, missingSupabaseEnvMessage } from "@/lib/supabase/env";
import {
  formatOrderCurrency,
  groupOrderItemsByOrderId,
  getAdminOrderPrimaryAction,
  getOrderStatusClasses,
  getOrderStatusLabel,
  isFinalOrderStatus,
  mapOrdersErrorMessage,
  type OrderItemRecord,
  type OrderRecord,
} from "@/lib/orders";

function formatSyncLabel(date: Date | null) {
  if (!date) {
    return "belum tersinkron";
  }

  return date.toLocaleTimeString("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

export default function OrdersPage() {
  const isSupabaseReady = hasSupabaseEnv();
  const requestInFlight = useRef(false);

  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [orderItemsByOrderId, setOrderItemsByOrderId] = useState<
    Record<string, OrderItemRecord[]>
  >({});
  const [productImagesById, setProductImagesById] = useState<
    Record<string, string>
  >({});
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdatedAt, setLastUpdatedAt] = useState<Date | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [actionMessage, setActionMessage] = useState("");
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);

  const loadOrders = useCallback(async (silent = false) => {
    if (requestInFlight.current) {
      return;
    }

    const supabase = createClient();

    if (!supabase) {
      setLoading(false);
      return;
    }

    requestInFlight.current = true;

    if (!silent) {
      setLoading(true);
    }

    setIsRefreshing(true);

    try {
      const { data, error } = await supabase
        .from("orders")
        .select(
          "id,customer_name,customer_email,delivery_address,total_price,status,created_at",
        )
        .order("created_at", { ascending: false });

      if (error) {
        setErrorMessage(mapOrdersErrorMessage(error.message));
        return;
      }

      const nextOrders = (data as OrderRecord[]) ?? [];
      setOrders(nextOrders);
      setErrorMessage("");

      const orderIds = nextOrders.map((order) => order.id);

      if (orderIds.length === 0) {
        setOrderItemsByOrderId({});
        setProductImagesById({});
        setLastUpdatedAt(new Date());
        return;
      }

      const { data: orderItemsData, error: orderItemsError } = await supabase
        .from("order_items")
        .select(
          "id,order_id,product_id,product_name,product_price,quantity,subtotal",
        )
        .in("order_id", orderIds);

      if (orderItemsError) {
        setErrorMessage(mapOrdersErrorMessage(orderItemsError.message));
        setLastUpdatedAt(new Date());
        return;
      }

      const nextOrderItems = (orderItemsData as OrderItemRecord[] | null) ?? [];
      setOrderItemsByOrderId(groupOrderItemsByOrderId(nextOrderItems));

      const productIds = [
        ...new Set(nextOrderItems.map((item) => item.product_id)),
      ];

      if (productIds.length > 0) {
        const { data: productsData, error: productsError } = await supabase
          .from("products")
          .select("id,image")
          .in("id", productIds);

        if (productsError) {
          setErrorMessage(mapOrdersErrorMessage(productsError.message));
        } else {
          setProductImagesById(
            (
              (productsData as { id: string; image: string | null }[] | null) ??
              []
            ).reduce<Record<string, string>>((map, product) => {
              if (product.image) {
                map[product.id] = product.image;
              }
              return map;
            }, {}),
          );
        }
      } else {
        setProductImagesById({});
      }

      setLastUpdatedAt(new Date());
    } finally {
      requestInFlight.current = false;
      setLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void loadOrders();
  }, [loadOrders]);

  useEffect(() => {
    const supabase = createClient();

    if (!supabase) {
      return;
    }

    const refreshOrders = () => {
      void loadOrders(true);
    };

    const intervalId = window.setInterval(refreshOrders, 15000);

    const handleWindowFocus = () => {
      refreshOrders();
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        refreshOrders();
      }
    };

    window.addEventListener("focus", handleWindowFocus);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    const channel = supabase
      .channel("admin-orders-live")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "orders" },
        refreshOrders,
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "order_items" },
        refreshOrders,
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "products" },
        refreshOrders,
      )
      .subscribe();

    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener("focus", handleWindowFocus);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      void supabase.removeChannel(channel);
    };
  }, [loadOrders]);

  const syncMidtransStatus = async (orderId: string) => {
    setUpdatingOrderId(orderId);
    setActionMessage("");
    setErrorMessage("");

    try {
      const response = await fetch(`/api/orders/${orderId}/verify`, {
        method: "GET",
        cache: "no-store",
      });
      const data = (await response.json()) as {
        error?: string;
        order?: OrderRecord | null;
        status?: string;
      };

      if (!response.ok) {
        throw new Error(data.error || "Sinkronisasi status Midtrans gagal.");
      }

      const nextStatus = data.status || data.order?.status || "pending";

      setOrders((currentOrders) =>
        currentOrders.map((order) =>
          order.id === orderId
            ? {
                ...order,
                ...(data.order ?? {}),
                status: nextStatus,
              }
            : order,
        ),
      );

      setActionMessage(
        nextStatus === "pending"
          ? "Status pembayaran masih menunggu konfirmasi Midtrans."
          : "Status pembayaran berhasil diperbarui dari Midtrans.",
      );
      setLastUpdatedAt(new Date());
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Sinkronisasi status Midtrans gagal.",
      );
    } finally {
      setUpdatingOrderId(null);
    }
  };

  const updateOrderStatus = async (orderId: string, status: string) => {
    setUpdatingOrderId(orderId);
    setActionMessage("");
    setErrorMessage("");

    try {
      const response = await fetch(`/api/orders/${orderId}/status`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status }),
      });
      const data = (await response.json()) as {
        error?: string;
        status?: string;
      };

      if (!response.ok) {
        throw new Error(data.error || "Status order gagal diperbarui.");
      }

      setOrders((currentOrders) =>
        currentOrders.map((order) =>
          order.id === orderId
            ? {
                ...order,
                status: data.status || status,
              }
            : order,
        ),
      );

      setActionMessage("Status pesanan berhasil diperbarui.");
      setLastUpdatedAt(new Date());
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Status order gagal diperbarui.",
      );
    } finally {
      setUpdatingOrderId(null);
    }
  };

  const pendingOrders = useMemo(
    () => orders.filter((order) => (order.status ?? "pending") === "pending"),
    [orders],
  );

  const paidOrders = useMemo(
    () =>
      orders.filter((order) =>
        ["confirmed", "preparing", "ready", "delivered"].includes(
          order.status ?? "",
        ),
      ),
    [orders],
  );

  const cancelledOrders = useMemo(
    () => orders.filter((order) => order.status === "cancelled"),
    [orders],
  );

  const totalRevenue = useMemo(
    () =>
      paidOrders.reduce((total, order) => total + (order.total_price ?? 0), 0),
    [paidOrders],
  );

  return (
    <section className="space-y-8">
      <div className="surface-panel overflow-hidden rounded-[2.4rem] border border-[#ead7c3] bg-gradient-to-br from-white via-[#fffdfa] to-[#fcefdc] p-7 md:p-8">
        <div className="flex flex-col gap-5">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-[#fff1df] px-3 py-1 text-[11px] font-bold uppercase tracking-[0.24em] text-orange-700">
              <ShoppingBasket className="h-3.5 w-3.5" strokeWidth={2.2} />
              Order control list
            </div>
            <h1 className="font-display mt-5 text-5xl font-bold tracking-[-0.04em] text-slate-900">
              Pesanan Pelanggan
            </h1>
            <p className="mt-4 max-w-3xl text-sm leading-8 text-slate-600">
              Setiap kartu memisahkan identitas order, alamat, item, waktu buat,
              nilai transaksi, dan tombol aksi supaya admin bisa membaca status
              dapur dalam satu sapuan mata.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 xl:max-w-[420px]">
            <div className="rounded-[1.5rem] border border-[#ead7c3] bg-white/85 p-4">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
                Sinkron terakhir
              </p>
              <p className="mt-3 text-2xl font-bold text-slate-900">
                {formatSyncLabel(lastUpdatedAt)}
              </p>
              <p className="mt-2 text-sm text-slate-500">
                Auto-refresh aktif setiap 15 detik.
              </p>
            </div>

            <div className="rounded-[1.5rem] border border-[#ead7c3] bg-slate-900 p-4 text-white">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-orange-200">
                Order aktif
              </p>
              <p className="mt-3 text-2xl font-bold">
                {loading ? "..." : pendingOrders.length.toLocaleString("id-ID")}
              </p>
              <p className="mt-2 text-sm text-slate-300">
                Antrean yang masih perlu dipantau atau digerakkan statusnya.
              </p>
            </div>
          </div>
        </div>
      </div>

      {!isSupabaseReady && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          {missingSupabaseEnvMessage}
        </div>
      )}

      {errorMessage && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {errorMessage}
        </div>
      )}

      {actionMessage && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {actionMessage}
        </div>
      )}

      <div className="grid gap-6 xl:grid-cols-4">
        <StatCard
          title="Orders"
          value={loading ? "..." : orders.length.toLocaleString("id-ID")}
          icon={ShoppingBasket}
          description="Total pesanan yang sudah masuk melalui halaman checkout."
          footnote={`${pendingOrders.length} antrean aktif`}
          accent="orange"
        />
        <StatCard
          title="Paid"
          value={loading ? "..." : paidOrders.length.toLocaleString("id-ID")}
          icon={Wallet}
          description="Order yang sudah lunas dan boleh diproses sampai selesai."
          footnote={`${cancelledOrders.length} order dibatalkan`}
          accent="emerald"
        />
        <StatCard
          title="Pending"
          value={loading ? "..." : pendingOrders.length.toLocaleString("id-ID")}
          icon={TimerReset}
          description="Order yang masih menunggu konfirmasi atau sinkronisasi Midtrans."
          footnote={
            pendingOrders.length > 0 ? "Perlu cek admin" : "Tidak ada antrean"
          }
          accent="amber"
        />
        <StatCard
          title="Revenue"
          value={loading ? "..." : formatOrderCurrency(totalRevenue)}
          icon={CreditCard}
          description="Akumulasi nilai order yang sudah aktif atau lunas."
          footnote={
            orders.length > 0
              ? "Berbasis transaksi valid"
              : "Belum ada transaksi"
          }
          accent="navy"
        />
      </div>

      <div className="surface-panel rounded-[2.2rem] border border-[#ead7c3] bg-white p-7">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-orange-700">
              Latest activity
            </p>
            <h2 className="mt-2 text-3xl font-semibold tracking-[-0.03em] text-slate-900">
              Daftar order terbaru
            </h2>
          </div>
          <div className="inline-flex items-center gap-2 rounded-full border border-[#ead7c3] bg-[#fffaf4] px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
            <RefreshCcw
              className={`h-3.5 w-3.5 ${isRefreshing ? "animate-spin text-orange-600" : "text-slate-400"}`}
              strokeWidth={2.2}
            />
            {isRefreshing
              ? "Menyegarkan"
              : `Tersinkron ${formatSyncLabel(lastUpdatedAt)}`}
          </div>
        </div>

        {loading ? (
          <div className="mt-6 rounded-[1.6rem] border border-[#f0dfcb] bg-[#fffaf4] p-5 text-sm text-slate-500">
            Memuat data order...
          </div>
        ) : orders.length === 0 ? (
          <div className="mt-6 rounded-[1.6rem] border border-[#f0dfcb] bg-[#fffaf4] p-5 text-sm text-slate-500">
            Belum ada order masuk. Setelah checkout Midtrans pertama dibuat,
            data pesanan akan muncul di sini.
          </div>
        ) : (
          <div className="mt-6 space-y-5">
            {orders.map((order) => {
              const primaryAction = getAdminOrderPrimaryAction(order.status);
              const isUpdating = updatingOrderId === order.id;
              const orderItems = orderItemsByOrderId[order.id] ?? [];
              const totalItemCount = orderItems.reduce(
                (sum, item) => sum + item.quantity,
                0,
              );

              return (
                <article
                  key={order.id}
                  className="overflow-hidden rounded-[2rem] border border-[#ead7c3] bg-gradient-to-br from-white via-white to-[#fff7ee] p-5"
                >
                  <div className="grid gap-5 xl:grid-cols-[1.25fr_0.75fr]">
                    <div className="space-y-4">
                      <div className="flex flex-wrap items-start justify-between gap-4">
                        <div>
                          <div className="flex flex-wrap items-center gap-3">
                            <h3 className="text-2xl font-semibold tracking-[-0.03em] text-slate-900">
                              {order.customer_name || "Pelanggan GMRH"}
                            </h3>
                            <span
                              className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${getOrderStatusClasses(order.status)}`}
                            >
                              {getOrderStatusLabel(order.status)}
                            </span>
                          </div>
                          <p className="mt-2 text-sm text-slate-500">
                            {order.customer_email || "Email belum tersedia"}
                          </p>
                          <p className="mt-3 text-xs uppercase tracking-[0.18em] text-slate-400">
                            Order ID: {order.id}
                          </p>
                        </div>

                        <div className="rounded-[1.3rem] border border-[#f0dfcb] bg-[#fffaf4] px-4 py-3">
                          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                            Total item
                          </p>
                          <p className="mt-2 text-2xl font-bold text-slate-900">
                            {totalItemCount}
                          </p>
                        </div>
                      </div>

                      <div className="grid gap-4 lg:grid-cols-[0.95fr_1.05fr]">
                        <div className="rounded-[1.5rem] border border-[#f0dfcb] bg-[#fffaf4] p-4">
                          <div className="flex items-start gap-3">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-orange-600 shadow-sm">
                              <MapPin className="h-4 w-4" strokeWidth={2.2} />
                            </div>
                            <div>
                              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                                Alamat pengantaran
                              </p>
                              <p className="mt-2 text-sm leading-7 text-slate-700">
                                {order.delivery_address ||
                                  "Alamat belum tersedia untuk pesanan ini."}
                              </p>
                            </div>
                          </div>
                        </div>

                        <OrderItemsSummary
                          items={orderItems}
                          productImagesById={productImagesById}
                        />
                      </div>

                      <div className="rounded-[1.5rem] border border-[#f0dfcb] bg-white/80 px-4 py-3 text-sm leading-7 text-slate-600">
                        {order.status === "pending" && (
                          <p>
                            Pesanan ini masih menunggu pembayaran. Cek Midtrans
                            dulu sebelum melanjutkan proses dapur.
                          </p>
                        )}
                        {!isFinalOrderStatus(order.status) &&
                          order.status !== "pending" && (
                            <p>
                              Status order sudah aktif. Tim dapur bisa
                              melanjutkan proses sesuai tahap operasional yang
                              tersedia di panel aksi kanan.
                            </p>
                          )}
                        {isFinalOrderStatus(order.status) && (
                          <p>
                            Pesanan ini sudah berada di status akhir dan tidak
                            memerlukan aksi lanjutan.
                          </p>
                        )}
                      </div>
                    </div>

                    <aside className="grid gap-4 content-start">
                      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1">
                        <div className="rounded-[1.5rem] border border-[#f0dfcb] bg-[#fffaf4] p-4">
                          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                            Total transaksi
                          </p>
                          <p className="mt-3 text-3xl font-bold text-slate-900">
                            {formatOrderCurrency(order.total_price)}
                          </p>
                        </div>

                        <div className="rounded-[1.5rem] border border-[#f0dfcb] bg-[#fffaf4] p-4">
                          <div className="flex items-center gap-2">
                            <Clock3
                              className="h-4 w-4 text-orange-600"
                              strokeWidth={2.2}
                            />
                            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                              Dibuat
                            </p>
                          </div>
                          <p className="mt-3 text-sm font-semibold leading-6 text-slate-900">
                            {order.created_at
                              ? new Date(order.created_at).toLocaleString(
                                  "id-ID",
                                )
                              : "-"}
                          </p>
                        </div>
                      </div>

                      <div className="rounded-[1.6rem] border border-[#ead7c3] bg-slate-900 p-4 text-white">
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <p className="text-xs font-bold uppercase tracking-[0.18em] text-orange-200">
                              Panel aksi
                            </p>
                            <p className="mt-2 text-sm leading-6 text-slate-300">
                              Gerakkan status order dari sini tanpa pindah
                              halaman.
                            </p>
                          </div>
                          <Truck
                            className="h-5 w-5 text-orange-300"
                            strokeWidth={2.2}
                          />
                        </div>

                        <div className="mt-4 flex flex-wrap gap-3">
                          {order.status === "pending" && (
                            <button
                              type="button"
                              onClick={() => syncMidtransStatus(order.id)}
                              disabled={isUpdating}
                              className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/15 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              <RefreshCcw
                                className="h-4 w-4"
                                strokeWidth={2.2}
                              />
                              {isUpdating ? "Mengecek..." : "Cek Midtrans"}
                            </button>
                          )}

                          {primaryAction && (
                            <button
                              type="button"
                              onClick={() =>
                                updateOrderStatus(
                                  order.id,
                                  primaryAction.nextStatus,
                                )
                              }
                              disabled={isUpdating}
                              className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-orange-500 to-[#ff9b52] px-5 py-2.5 text-sm font-semibold text-white shadow-[0_18px_40px_-24px_rgba(249,115,22,0.8)] transition hover:translate-y-[-1px] disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              <Truck className="h-4 w-4" strokeWidth={2.2} />
                              {isUpdating
                                ? "Menyimpan..."
                                : primaryAction.label}
                            </button>
                          )}

                        </div>
                      </div>
                    </aside>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
