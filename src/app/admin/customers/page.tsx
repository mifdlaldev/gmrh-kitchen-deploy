"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Clock3,
  Mail,
  Phone,
  RefreshCcw,
  UserRound,
  Users,
  Wallet,
} from "lucide-react";
import StatCard from "@/components/admin/stat-card";
import { createClient } from "@/lib/supabase/client";
import { hasSupabaseEnv, missingSupabaseEnvMessage } from "@/lib/supabase/env";
import { formatOrderCurrency, type OrderRecord } from "@/lib/orders";

type CustomerRecord = {
  id: string;
  email: string;
  full_name: string | null;
  phone: string | null;
  role: "customer" | "seller" | "admin";
  created_at: string | null;
};

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

function getRoleBadge(role: CustomerRecord["role"]) {
  switch (role) {
    case "seller":
      return "border-sky-200 bg-sky-50 text-sky-700";
    case "admin":
      return "border-slate-200 bg-slate-100 text-slate-700";
    case "customer":
    default:
      return "border-emerald-200 bg-emerald-50 text-emerald-700";
  }
}

export default function CustomersPage() {
  const isSupabaseReady = hasSupabaseEnv();
  const requestInFlight = useRef(false);

  const [customers, setCustomers] = useState<CustomerRecord[]>([]);
  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdatedAt, setLastUpdatedAt] = useState<Date | null>(null);
  const [errorMessage, setErrorMessage] = useState("");

  const loadCustomers = useCallback(async (silent = false) => {
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
      const [usersResult, ordersResult] = await Promise.all([
        supabase
          .from("users")
          .select("id,email,full_name,phone,role,created_at")
          .neq("role", "admin")
          .order("created_at", { ascending: false }),
        supabase
          .from("orders")
          .select(
            "id,customer_name,customer_email,delivery_address,total_price,status,created_at",
          )
          .order("created_at", { ascending: false }),
      ]);

      if (usersResult.error) {
        setErrorMessage(usersResult.error.message);
        return;
      }

      if (ordersResult.error) {
        setErrorMessage(ordersResult.error.message);
        return;
      }

      setCustomers((usersResult.data as CustomerRecord[] | null) ?? []);
      setOrders((ordersResult.data as OrderRecord[] | null) ?? []);
      setErrorMessage("");
      setLastUpdatedAt(new Date());
    } finally {
      requestInFlight.current = false;
      setLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void loadCustomers();
  }, [loadCustomers]);

  useEffect(() => {
    const supabase = createClient();

    if (!supabase) {
      return;
    }

    const refreshCustomers = () => {
      void loadCustomers(true);
    };

    const intervalId = window.setInterval(refreshCustomers, 15000);

    const handleWindowFocus = () => {
      refreshCustomers();
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        refreshCustomers();
      }
    };

    window.addEventListener("focus", handleWindowFocus);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    const channel = supabase
      .channel("admin-customers-live")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "users" },
        refreshCustomers,
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "orders" },
        refreshCustomers,
      )
      .subscribe();

    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener("focus", handleWindowFocus);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      void supabase.removeChannel(channel);
    };
  }, [loadCustomers]);

  const customersByEmail = useMemo(() => {
    return customers.reduce<Record<string, OrderRecord[]>>((map, customer) => {
      map[customer.email] = orders.filter(
        (order) =>
          order.customer_email?.toLowerCase() === customer.email.toLowerCase(),
      );
      return map;
    }, {});
  }, [customers, orders]);

  const customerCount = useMemo(
    () => customers.filter((customer) => customer.role === "customer").length,
    [customers],
  );

  const customersWithPhone = useMemo(
    () => customers.filter((customer) => customer.phone?.trim()).length,
    [customers],
  );

  const buyingCustomers = useMemo(
    () =>
      customers.filter(
        (customer) => (customersByEmail[customer.email] ?? []).length > 0,
      ).length,
    [customers, customersByEmail],
  );

  const totalRevenue = useMemo(
    () =>
      orders
        .filter((order) =>
          ["confirmed", "preparing", "ready", "delivered"].includes(
            order.status ?? "",
          ),
        )
        .reduce((sum, order) => sum + (order.total_price ?? 0), 0),
    [orders],
  );

  return (
    <section className="space-y-8">
      <div className="surface-panel overflow-hidden rounded-[2.4rem] border border-[#ead7c3] bg-gradient-to-br from-white via-[#fffdfa] to-[#fcefdc] p-7 md:p-8">
        <div className="flex flex-col gap-5">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-[#fff1df] px-3 py-1 text-[11px] font-bold uppercase tracking-[0.24em] text-orange-700">
              <Users className="h-3.5 w-3.5" strokeWidth={2.2} />
              Customer registry
            </div>
            <h1 className="font-display mt-5 text-5xl font-bold tracking-[-0.04em] text-slate-900">
              Data Pelanggan
            </h1>
            <p className="mt-4 max-w-3xl text-sm leading-8 text-slate-600">
              Setiap user yang selesai register akan muncul di sini. Admin juga
              bisa langsung melihat info dasar pelanggan, status peran, nomor
              telepon, dan ringkasan order yang sudah pernah dibuat.
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
                Realtime aktif untuk perubahan user dan order.
              </p>
            </div>

            <div className="rounded-[1.5rem] border border-[#ead7c3] bg-slate-900 p-4 text-white">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-orange-200">
                Revenue aktif
              </p>
              <p className="mt-3 text-2xl font-bold">
                {formatOrderCurrency(totalRevenue)}
              </p>
              <p className="mt-2 text-sm text-slate-300">
                Dibaca dari order aktif dan lunas pelanggan.
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

      <div className="grid gap-6 xl:grid-cols-3">
        <StatCard
          title="Customers"
          value={loading ? "..." : customerCount.toLocaleString("id-ID")}
          icon={Users}
          description="Pelanggan umum yang sudah berhasil register ke website."
          footnote={`${buyingCustomers} sudah pernah order`}
          accent="orange"
        />
        <StatCard
          title="With phone"
          value={loading ? "..." : customersWithPhone.toLocaleString("id-ID")}
          icon={Phone}
          description="User yang sudah mengisi nomor telepon pada saat register."
          footnote={`${Math.max(customers.length - customersWithPhone, 0)} belum lengkap`}
          accent="amber"
        />
        <StatCard
          title="Buyer"
          value={loading ? "..." : buyingCustomers.toLocaleString("id-ID")}
          icon={Wallet}
          description="Pelanggan yang bukan hanya register, tapi juga sudah pernah checkout."
          footnote={
            orders.length > 0
              ? `${orders.length} order terbaca`
              : "Belum ada order"
          }
          accent="emerald"
        />
      </div>

      <div className="surface-panel rounded-[2.2rem] border border-[#ead7c3] bg-white p-7">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-orange-700">
              Customer list
            </p>
            <h2 className="mt-2 text-3xl font-semibold tracking-[-0.03em] text-slate-900">
              Pelanggan terdaftar terbaru
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
            Memuat data pelanggan...
          </div>
        ) : customers.length === 0 ? (
          <div className="mt-6 rounded-[1.6rem] border border-[#f0dfcb] bg-[#fffaf4] p-5 text-sm text-slate-500">
            Belum ada pelanggan terdaftar. Begitu user selesai register, datanya
            akan langsung tampil di sini.
          </div>
        ) : (
          <div className="mt-6 space-y-5">
            {customers.map((customer) => {
              const customerOrders = customersByEmail[customer.email] ?? [];
              const paidOrders = customerOrders.filter((order) =>
                ["confirmed", "preparing", "ready", "delivered"].includes(
                  order.status ?? "",
                ),
              );
              const totalSpent = paidOrders.reduce(
                (sum, order) => sum + (order.total_price ?? 0),
                0,
              );
              const latestOrder = customerOrders[0] ?? null;

              return (
                <article
                  key={customer.id}
                  className="overflow-hidden rounded-[2rem] border border-[#ead7c3] bg-gradient-to-br from-white via-white to-[#fff7ee] p-5"
                >
                  <div className="grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
                    <div className="space-y-4">
                      <div className="flex flex-wrap items-start justify-between gap-4">
                        <div>
                          <div className="flex flex-wrap items-center gap-3">
                            <h3 className="text-2xl font-semibold tracking-[-0.03em] text-slate-900">
                              {customer.full_name || "Pelanggan GMRH"}
                            </h3>
                            <span
                              className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${getRoleBadge(customer.role)}`}
                            >
                              {customer.role}
                            </span>
                          </div>
                          <p className="mt-2 text-sm text-slate-500">
                            {customer.email}
                          </p>
                          <p className="mt-3 text-xs uppercase tracking-[0.18em] text-slate-400">
                            User ID: {customer.id}
                          </p>
                        </div>

                        <div className="rounded-[1.3rem] border border-[#f0dfcb] bg-[#fffaf4] px-4 py-3">
                          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                            Total order
                          </p>
                          <p className="mt-2 text-2xl font-bold text-slate-900">
                            {customerOrders.length}
                          </p>
                        </div>
                      </div>

                      <div className="grid gap-4 lg:grid-cols-2">
                        <div className="rounded-[1.5rem] border border-[#f0dfcb] bg-[#fffaf4] p-4">
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-orange-600 shadow-sm">
                              <Phone className="h-4 w-4" strokeWidth={2.2} />
                            </div>
                            <div>
                              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                                Nomor telepon
                              </p>
                              <p className="mt-2 text-sm font-medium text-slate-700">
                                {customer.phone || "Belum diisi pelanggan"}
                              </p>
                            </div>
                          </div>
                        </div>

                        <div className="rounded-[1.5rem] border border-[#f0dfcb] bg-[#fffaf4] p-4">
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-orange-600 shadow-sm">
                              <Mail className="h-4 w-4" strokeWidth={2.2} />
                            </div>
                            <div>
                              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                                Status akun
                              </p>
                              <p className="mt-2 text-sm font-medium text-slate-700">
                                Terdaftar dan siap digunakan
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <aside className="grid gap-4 content-start">
                      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1">
                        <div className="rounded-[1.5rem] border border-[#f0dfcb] bg-[#fffaf4] p-4">
                          <div className="flex items-center gap-2">
                            <Wallet
                              className="h-4 w-4 text-orange-600"
                              strokeWidth={2.2}
                            />
                            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                              Total belanja
                            </p>
                          </div>
                          <p className="mt-3 text-3xl font-bold text-slate-900">
                            {formatOrderCurrency(totalSpent)}
                          </p>
                        </div>

                        <div className="rounded-[1.5rem] border border-[#f0dfcb] bg-[#fffaf4] p-4">
                          <div className="flex items-center gap-2">
                            <Clock3
                              className="h-4 w-4 text-orange-600"
                              strokeWidth={2.2}
                            />
                            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                              Bergabung
                            </p>
                          </div>
                          <p className="mt-3 text-sm font-semibold leading-6 text-slate-900">
                            {customer.created_at
                              ? new Date(customer.created_at).toLocaleString(
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
                              Aktivitas pelanggan
                            </p>
                            <p className="mt-2 text-sm leading-6 text-slate-300">
                              Ringkasan cepat hubungan pelanggan dengan website
                              Anda.
                            </p>
                          </div>
                          <UserRound
                            className="h-5 w-5 text-orange-300"
                            strokeWidth={2.2}
                          />
                        </div>

                        <div className="mt-4 space-y-3 text-sm text-slate-200">
                          <div className="flex items-center justify-between rounded-[1rem] bg-white/5 px-3 py-2">
                            <span>Jumlah order</span>
                            <span className="font-semibold">
                              {customerOrders.length}
                            </span>
                          </div>
                          <div className="flex items-center justify-between rounded-[1rem] bg-white/5 px-3 py-2">
                            <span>Order terakhir</span>
                            <span className="font-semibold">
                              {latestOrder?.created_at
                                ? new Date(
                                    latestOrder.created_at,
                                  ).toLocaleDateString("id-ID")
                                : "Belum ada"}
                            </span>
                          </div>
                          <div className="flex items-center justify-between rounded-[1rem] bg-white/5 px-3 py-2">
                            <span>Status pembeli</span>
                            <span className="font-semibold">
                              {paidOrders.length > 0
                                ? "Pernah belanja"
                                : "Baru daftar"}
                            </span>
                          </div>
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
