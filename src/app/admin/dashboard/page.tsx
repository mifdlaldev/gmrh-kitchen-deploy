"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Activity,
  Banknote,
  Inbox,
  Package2,
  RefreshCcw,
  ShoppingBasket,
  TriangleAlert,
  Users,
} from "lucide-react";
import {
  LiveActivityChart,
  type LiveActivityPoint,
} from "@/components/admin/live-activity-chart";
import StatCard from "@/components/admin/stat-card";
import { createClient } from "@/lib/supabase/client";
import { hasSupabaseEnv, missingSupabaseEnvMessage } from "@/lib/supabase/env";
import { formatOrderCurrency, type OrderRecord } from "@/lib/orders";

type DashboardProduct = {
  id: string;
  name: string;
  price?: number | null;
  stock?: number | null;
  created_at?: string | null;
};

type DashboardUser = {
  id: string;
  role?: string | null;
  created_at?: string | null;
};

type DashboardMessage = {
  id: string;
  name: string;
  email: string;
  message: string;
  created_at?: string | null;
};

type DashboardOrder = OrderRecord;

const DAILY_WINDOW = 7;

function isMissingRelationError(message?: string) {
  if (!message) {
    return false;
  }

  const normalized = message.toLowerCase();

  return (
    normalized.includes("does not exist") ||
    normalized.includes("schema cache") ||
    normalized.includes("could not find the table")
  );
}

function safeCount<T>(items: T[]) {
  return items.length.toLocaleString("id-ID");
}

function sumNumber(values: Array<number | null | undefined>) {
  return values.reduce<number>((total, value) => total + (value ?? 0), 0);
}

function buildTimeline(
  orders: DashboardOrder[],
  messages: DashboardMessage[],
): LiveActivityPoint[] {
  const buckets = Array.from({ length: DAILY_WINDOW }, (_, index) => {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() - (DAILY_WINDOW - 1 - index));

    return {
      key: date.toISOString().slice(0, 10),
      label: date.toLocaleDateString("id-ID", { weekday: "short" }),
      orders: 0,
      revenue: 0,
      messages: 0,
    };
  });

  const bucketByKey = new Map(buckets.map((bucket) => [bucket.key, bucket]));

  orders.forEach((order) => {
    if (!order.created_at) {
      return;
    }

    const date = new Date(order.created_at);

    if (Number.isNaN(date.getTime())) {
      return;
    }

    const key = new Date(date.getFullYear(), date.getMonth(), date.getDate())
      .toISOString()
      .slice(0, 10);
    const bucket = bucketByKey.get(key);

    if (!bucket) {
      return;
    }

    bucket.orders += 1;

    if (
      ["confirmed", "preparing", "ready", "delivered"].includes(
        order.status ?? "",
      )
    ) {
      bucket.revenue += order.total_price ?? 0;
    }
  });

  messages.forEach((message) => {
    if (!message.created_at) {
      return;
    }

    const date = new Date(message.created_at);

    if (Number.isNaN(date.getTime())) {
      return;
    }

    const key = new Date(date.getFullYear(), date.getMonth(), date.getDate())
      .toISOString()
      .slice(0, 10);
    const bucket = bucketByKey.get(key);

    if (!bucket) {
      return;
    }

    bucket.messages += 1;
  });

  return buckets.map((bucket) => ({
    label: bucket.label,
    orders: bucket.orders,
    revenue: bucket.revenue,
    messages: bucket.messages,
  }));
}

function formatRelativeSync(date: Date | null) {
  if (!date) {
    return "belum pernah";
  }

  return date.toLocaleTimeString("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

export default function DashboardPage() {
  const isSupabaseReady = hasSupabaseEnv();
  const requestInFlight = useRef(false);

  const [products, setProducts] = useState<DashboardProduct[]>([]);
  const [users, setUsers] = useState<DashboardUser[]>([]);
  const [messages, setMessages] = useState<DashboardMessage[]>([]);
  const [orders, setOrders] = useState<DashboardOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [infoNotes, setInfoNotes] = useState<string[]>([]);
  const [lastUpdatedAt, setLastUpdatedAt] = useState<Date | null>(null);

  const loadDashboard = useCallback(async (silent = false) => {
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
      const [productsResult, usersResult, messagesResult, ordersResult] =
        await Promise.all([
          supabase.from("products").select("id,name,price,stock,created_at"),
          supabase.from("users").select("id,role,created_at"),
          supabase
            .from("contact_messages")
            .select("id,name,email,message,created_at")
            .order("created_at", { ascending: false }),
          supabase
            .from("orders")
            .select(
              "id,customer_name,customer_email,delivery_address,total_price,status,created_at",
            )
            .order("created_at", { ascending: false }),
        ]);

      const notes: string[] = [];
      let nextError = "";

      if (productsResult.error) {
        if (isMissingRelationError(productsResult.error.message)) {
          notes.push(
            "Tabel produk belum siap penuh, sehingga panel stok masih memakai state kosong yang aman.",
          );
        } else {
          nextError = productsResult.error.message;
        }
      } else {
        setProducts((productsResult.data as DashboardProduct[]) ?? []);
      }

      if (usersResult.error) {
        if (isMissingRelationError(usersResult.error.message)) {
          notes.push(
            "Tabel users belum lengkap, jadi panel customer memakai state kosong yang aman.",
          );
        } else if (!nextError) {
          nextError = usersResult.error.message;
        }
      } else {
        setUsers((usersResult.data as DashboardUser[]) ?? []);
      }

      if (messagesResult.error) {
        if (isMissingRelationError(messagesResult.error.message)) {
          notes.push(
            "Tabel pesan kontak belum tersedia. Jalankan migration contact messages untuk mengaktifkan inbox dashboard.",
          );
        } else if (!nextError) {
          nextError = messagesResult.error.message;
        }
      } else {
        setMessages((messagesResult.data as DashboardMessage[]) ?? []);
      }

      if (ordersResult.error) {
        if (isMissingRelationError(ordersResult.error.message)) {
          notes.push(
            "Tabel orders belum siap penuh, jadi chart transaksi dan pulse order memakai state kosong yang aman.",
          );
        } else if (!nextError) {
          nextError = ordersResult.error.message;
        }
      } else {
        setOrders((ordersResult.data as DashboardOrder[]) ?? []);
      }

      setErrorMessage(nextError);
      setInfoNotes(notes);
      setLastUpdatedAt(new Date());
    } finally {
      requestInFlight.current = false;
      setLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void loadDashboard();
  }, [loadDashboard]);

  useEffect(() => {
    const supabase = createClient();

    if (!supabase) {
      return;
    }

    const refreshDashboard = () => {
      void loadDashboard(true);
    };

    const intervalId = window.setInterval(refreshDashboard, 15000);

    const handleWindowFocus = () => {
      refreshDashboard();
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        refreshDashboard();
      }
    };

    window.addEventListener("focus", handleWindowFocus);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    const channel = supabase
      .channel("admin-dashboard-live")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "orders" },
        refreshDashboard,
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "products" },
        refreshDashboard,
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "users" },
        refreshDashboard,
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "contact_messages" },
        refreshDashboard,
      )
      .subscribe();

    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener("focus", handleWindowFocus);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      void supabase.removeChannel(channel);
    };
  }, [loadDashboard]);

  const customerUsers = useMemo(
    () => users.filter((user) => user.role !== "admin"),
    [users],
  );

  const activeOrders = useMemo(
    () =>
      orders.filter((order) =>
        ["pending", "confirmed", "preparing", "ready"].includes(
          order.status ?? "",
        ),
      ),
    [orders],
  );

  const completedOrders = useMemo(
    () =>
      orders.filter((order) =>
        ["confirmed", "preparing", "ready", "delivered"].includes(
          order.status ?? "",
        ),
      ),
    [orders],
  );

  const paidRevenue = useMemo(
    () => sumNumber(completedOrders.map((order) => order.total_price)),
    [completedOrders],
  );

  const avgOrderValue = useMemo(() => {
    if (completedOrders.length === 0) {
      return 0;
    }

    return Math.round(paidRevenue / completedOrders.length);
  }, [completedOrders.length, paidRevenue]);

  const lowStockProducts = useMemo(
    () =>
      products.filter(
        (product) => (product.stock ?? 0) > 0 && (product.stock ?? 0) <= 5,
      ),
    [products],
  );

  const outOfStockProducts = useMemo(
    () => products.filter((product) => (product.stock ?? 0) <= 0),
    [products],
  );

  const totalInventory = useMemo(
    () => sumNumber(products.map((product) => product.stock)),
    [products],
  );

  const estimatedCatalogValue = useMemo(
    () =>
      products.reduce(
        (total, product) => total + (product.price ?? 0) * (product.stock ?? 0),
        0,
      ),
    [products],
  );

  const recentMessages = useMemo(() => messages.slice(0, 4), [messages]);

  const recentOrders = useMemo(() => orders.slice(0, 5), [orders]);

  const timeline = useMemo(
    () => buildTimeline(orders, messages),
    [orders, messages],
  );

  const statusSummary = useMemo(() => {
    const orderStatus = [
      {
        key: "pending",
        label: "Menunggu",
        count: 0,
        tone: "bg-amber-100 text-amber-700",
      },
      {
        key: "confirmed",
        label: "Lunas",
        count: 0,
        tone: "bg-emerald-100 text-emerald-700",
      },
      {
        key: "preparing",
        label: "Diproses",
        count: 0,
        tone: "bg-sky-100 text-sky-700",
      },
      {
        key: "ready",
        label: "Siap kirim",
        count: 0,
        tone: "bg-violet-100 text-violet-700",
      },
      {
        key: "delivered",
        label: "Selesai",
        count: 0,
        tone: "bg-teal-100 text-teal-700",
      },
      {
        key: "cancelled",
        label: "Dibatalkan",
        count: 0,
        tone: "bg-rose-100 text-rose-700",
      },
    ];

    orders.forEach((order) => {
      const bucket = orderStatus.find(
        (item) => item.key === (order.status ?? "pending"),
      );

      if (bucket) {
        bucket.count += 1;
      }
    });

    return orderStatus;
  }, [orders]);

  const topStockProducts = useMemo(
    () =>
      [...products].sort((a, b) => (b.stock ?? 0) - (a.stock ?? 0)).slice(0, 5),
    [products],
  );

  const operationalNotes = useMemo(() => {
    return [
      lowStockProducts.length > 0
        ? `${lowStockProducts.length} produk masuk zona stok rendah.`
        : "Belum ada produk di zona stok rendah.",
      recentMessages.length > 0
        ? `${recentMessages.length} pesan pelanggan terbaru siap dibaca.`
        : "Belum ada pesan baru di inbox.",
      activeOrders.length > 0
        ? `${activeOrders.length} order masih aktif dan perlu dipantau tim dapur.`
        : "Tidak ada order aktif yang perlu dipantau saat ini.",
    ];
  }, [activeOrders.length, lowStockProducts.length, recentMessages.length]);

  return (
    <section className="space-y-8">
      <div className="surface-panel overflow-hidden rounded-[2.4rem] border border-[#ead7c3] bg-gradient-to-br from-white via-[#fffdf9] to-[#fcefdc] p-7 md:p-8">
        <div className="flex flex-col gap-5">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-[#fff1df] px-3 py-1 text-[11px] font-bold uppercase tracking-[0.24em] text-orange-700">
              <Activity className="h-3.5 w-3.5" strokeWidth={2.2} />
              Control room analytics
            </div>
            <h1 className="font-display mt-5 text-5xl font-bold tracking-[-0.04em] text-slate-900">
              Dashboard admin
            </h1>
            <p className="mt-4 max-w-3xl text-sm leading-8 text-slate-600">
              Semua panel di bawah ini ikut menyegarkan data secara otomatis,
              jadi admin bisa memantau order, revenue, stok, dan pesan pelanggan
              tanpa bolak-balik pindah halaman.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 xl:max-w-[420px]">
            <div className="rounded-[1.5rem] border border-[#ead7c3] bg-white/85 p-4">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
                Sinkron terakhir
              </p>
              <p className="mt-3 text-2xl font-bold text-slate-900">
                {formatRelativeSync(lastUpdatedAt)}
              </p>
              <p className="mt-2 text-sm text-slate-500">
                Refresh otomatis tiap 15 detik + saat ada perubahan data.
              </p>
            </div>

            <div className="rounded-[1.5rem] border border-[#ead7c3] bg-slate-900 p-4 text-white">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-orange-200">
                Rata-rata order
              </p>
              <p className="mt-3 text-2xl font-bold">
                {formatOrderCurrency(avgOrderValue)}
              </p>
              <p className="mt-2 text-sm text-slate-300">
                Dibaca dari transaksi aktif dan lunas yang sudah masuk.
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

      {infoNotes.map((note) => (
        <div
          key={note}
          className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-700"
        >
          {note}
        </div>
      ))}

      <div className="grid gap-6 md:grid-cols-2">
        <StatCard
          title="Products"
          value={loading ? "..." : safeCount(products)}
          icon={Package2}
          description="Produk aktif yang sedang mengisi katalog marketplace kitchen Anda."
          footnote={`${lowStockProducts.length} stok rendah • ${outOfStockProducts.length} habis`}
          accent="orange"
        />
        <StatCard
          title="Messages"
          value={loading ? "..." : safeCount(messages)}
          icon={Inbox}
          description="Pesan dari halaman contact yang masuk ke panel admin."
          footnote={
            recentMessages.length > 0
              ? `${recentMessages.length} pesan baru siap dibaca`
              : "Inbox masih tenang"
          }
          accent="amber"
        />
        <StatCard
          title="Customers"
          value={loading ? "..." : safeCount(customerUsers)}
          icon={Users}
          description="User non-admin yang tercatat dan bisa melakukan pemesanan."
          footnote={`${users.filter((user) => user.role === "admin").length} admin aktif`}
          accent="navy"
        />
        <StatCard
          title="Revenue"
          value={loading ? "..." : formatOrderCurrency(paidRevenue)}
          icon={Banknote}
          description="Akumulasi nilai transaksi yang sudah masuk ke status aktif atau lunas."
          footnote={`${completedOrders.length} order bernilai positif`}
          accent="emerald"
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <LiveActivityChart
          points={timeline}
          isRefreshing={isRefreshing}
          lastUpdatedLabel={formatRelativeSync(lastUpdatedAt)}
        />

        <div className="grid gap-6">
          <div className="rounded-[2.2rem] bg-slate-900 p-7 text-white shadow-[0_28px_70px_-30px_rgba(15,23,42,0.75)]">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.24em] text-orange-200">
                  Status pulse
                </p>
                <h2 className="mt-3 text-3xl font-semibold tracking-[-0.03em]">
                  Distribusi order saat ini
                </h2>
              </div>
              <RefreshCcw
                className={`h-5 w-5 ${isRefreshing ? "animate-spin text-orange-300" : "text-white/40"}`}
                strokeWidth={2.2}
              />
            </div>

            <div className="mt-6 space-y-3">
              {statusSummary.map((item) => (
                <div
                  key={item.key}
                  className="flex items-center justify-between rounded-[1.4rem] border border-white/10 bg-white/5 px-4 py-3"
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${item.tone}`}
                    >
                      {item.label}
                    </span>
                  </div>
                  <span className="text-2xl font-bold">{item.count}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="surface-panel rounded-[2.2rem] border border-[#ead7c3] bg-white p-7">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.24em] text-orange-700">
                  Ops note
                </p>
                <h2 className="mt-2 text-2xl font-semibold text-slate-900">
                  Catatan cepat admin
                </h2>
              </div>
              <TriangleAlert
                className="h-5 w-5 text-orange-600"
                strokeWidth={2.2}
              />
            </div>

            <div className="mt-6 space-y-3">
              {operationalNotes.map((note) => (
                <div
                  key={note}
                  className="rounded-[1.4rem] border border-[#f0dfcb] bg-[#fff8ef] px-4 py-3 text-sm leading-7 text-slate-600"
                >
                  {note}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[0.92fr_1.08fr]">
        <div className="surface-panel rounded-[2.2rem] border border-[#ead7c3] bg-white p-7">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.24em] text-orange-700">
                Inventory radar
              </p>
              <h2 className="mt-2 text-2xl font-semibold text-slate-900">
                Fokus stok produk
              </h2>
            </div>
            <Package2 className="h-5 w-5 text-orange-600" strokeWidth={2.2} />
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <div className="rounded-[1.4rem] border border-[#f0dfcb] bg-[#fffaf4] p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                Total stok
              </p>
              <p className="mt-3 text-3xl font-bold text-slate-900">
                {totalInventory.toLocaleString("id-ID")}
              </p>
            </div>
            <div className="rounded-[1.4rem] border border-[#f0dfcb] bg-[#fffaf4] p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                Nilai katalog
              </p>
              <p className="mt-3 text-2xl font-bold text-slate-900">
                {formatOrderCurrency(estimatedCatalogValue)}
              </p>
            </div>
            <div className="rounded-[1.4rem] border border-[#f0dfcb] bg-[#fffaf4] p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                Risiko stok
              </p>
              <p className="mt-3 text-3xl font-bold text-slate-900">
                {lowStockProducts.length + outOfStockProducts.length}
              </p>
            </div>
          </div>

          <div className="mt-7 space-y-4">
            {topStockProducts.length > 0 ? (
              topStockProducts.map((product) => {
                const maxStock = Math.max(
                  ...topStockProducts.map((item) => item.stock ?? 0),
                  1,
                );
                const width = `${Math.max(((product.stock ?? 0) / maxStock) * 100, 8)}%`;

                return (
                  <div
                    key={product.id}
                    className="rounded-[1.4rem] border border-[#f0dfcb] bg-[#fffaf4] p-4"
                  >
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <p className="font-semibold text-slate-900">
                          {product.name}
                        </p>
                        <p className="mt-1 text-sm text-slate-500">
                          {formatOrderCurrency(product.price ?? 0)}
                        </p>
                      </div>
                      <div className="rounded-full bg-white px-3 py-1 text-sm font-semibold text-slate-700">
                        {product.stock ?? 0} stok
                      </div>
                    </div>
                    <div className="mt-4 h-3 overflow-hidden rounded-full bg-[#f1e3d1]">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-slate-900 via-[#2a3c67] to-orange-500"
                        style={{ width }}
                      />
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="rounded-[1.4rem] border border-[#f0dfcb] bg-[#fffaf4] p-4 text-sm text-slate-500">
                Belum ada produk yang bisa dianalisis dari sisi stok.
              </div>
            )}
          </div>
        </div>

        <div className="grid gap-6">
          <div className="surface-panel rounded-[2.2rem] border border-[#ead7c3] bg-white p-7">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.24em] text-orange-700">
                  Message feed
                </p>
                <h2 className="mt-2 text-2xl font-semibold text-slate-900">
                  Pesan pelanggan terbaru
                </h2>
              </div>
              <Inbox className="h-5 w-5 text-orange-600" strokeWidth={2.2} />
            </div>

            <div className="mt-6 space-y-4">
              {recentMessages.length > 0 ? (
                recentMessages.map((message) => (
                  <article
                    key={message.id}
                    className="rounded-[1.4rem] border border-[#f0dfcb] bg-[#fffaf4] p-4"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="font-semibold text-slate-900">
                          {message.name}
                        </p>
                        <p className="mt-1 text-sm text-orange-600">
                          {message.email}
                        </p>
                      </div>
                      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">
                        {message.created_at
                          ? new Date(message.created_at).toLocaleDateString(
                              "id-ID",
                            )
                          : "-"}
                      </p>
                    </div>
                    <p className="mt-3 line-clamp-3 text-sm leading-7 text-slate-600">
                      {message.message}
                    </p>
                  </article>
                ))
              ) : (
                <div className="rounded-[1.4rem] border border-[#f0dfcb] bg-[#fffaf4] p-4 text-sm text-slate-500">
                  Belum ada pesan terbaru untuk ditampilkan.
                </div>
              )}
            </div>
          </div>

          <div className="surface-panel rounded-[2.2rem] border border-[#ead7c3] bg-white p-7">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.24em] text-orange-700">
                  Live orders
                </p>
                <h2 className="mt-2 text-2xl font-semibold text-slate-900">
                  Order terbaru yang masuk
                </h2>
              </div>
              <ShoppingBasket
                className="h-5 w-5 text-orange-600"
                strokeWidth={2.2}
              />
            </div>

            <div className="mt-6 space-y-3">
              {recentOrders.length > 0 ? (
                recentOrders.map((order) => (
                  <article
                    key={order.id}
                    className="rounded-[1.4rem] border border-[#f0dfcb] bg-[#fffaf4] p-4"
                  >
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <p className="font-semibold text-slate-900">
                          {order.customer_name || "Pelanggan GMRH"}
                        </p>
                        <p className="mt-1 text-sm text-slate-500">
                          {order.customer_email || "Email belum tersedia"}
                        </p>
                      </div>
                      <div className="rounded-full bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                        {order.status || "pending"}
                      </div>
                    </div>
                    <div className="mt-4 flex items-center justify-between gap-4 text-sm text-slate-600">
                      <span>{formatOrderCurrency(order.total_price)}</span>
                      <span>
                        {order.created_at
                          ? new Date(order.created_at).toLocaleString("id-ID")
                          : "-"}
                      </span>
                    </div>
                  </article>
                ))
              ) : (
                <div className="rounded-[1.4rem] border border-[#f0dfcb] bg-[#fffaf4] p-4 text-sm text-slate-500">
                  Belum ada order terbaru untuk ditampilkan.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
