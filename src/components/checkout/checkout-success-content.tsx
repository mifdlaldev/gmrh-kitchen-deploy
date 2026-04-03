"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  CheckCircle2,
  Clock3,
  MapPin,
  ReceiptText,
  ShoppingBag,
} from "lucide-react";
import { useCart } from "@/context/cart-context";
import {
  clearLastCheckout,
  readLastCheckout,
  type StoredCheckoutSnapshot,
} from "@/lib/checkout-session";
import {
  formatOrderCurrency,
  getOrderStatusClasses,
  getOrderStatusLabel,
  isPaidOrderStatus,
  type OrderRecord,
} from "@/lib/orders";

const midtransClientKey = process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY || "";
const isSandboxMidtrans = midtransClientKey.startsWith("SB-");

type VerifyResponse = {
  verified?: boolean;
  status?: string;
  order?: OrderRecord;
  error?: string;
};

export default function CheckoutSuccessContent() {
  const searchParams = useSearchParams();
  const { clearCart } = useCart();
  const [fallbackCheckout, setFallbackCheckout] =
    useState<StoredCheckoutSnapshot | null>(null);
  const [fallbackResolved, setFallbackResolved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [order, setOrder] = useState<OrderRecord | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [isAutoRefreshing, setIsAutoRefreshing] = useState(false);
  const [sandboxMessage, setSandboxMessage] = useState("");

  const orderId = searchParams.get("order_id") || fallbackCheckout?.orderId || null;
  const redirectStatus = searchParams.get("transaction_status");
  const result = searchParams.get("result");

  useEffect(() => {
    setFallbackCheckout(readLastCheckout());
    setFallbackResolved(true);
  }, []);

  useEffect(() => {
    if (fallbackCheckout) {
      setOrder((currentOrder) =>
        currentOrder ?? {
          id: fallbackCheckout.orderId,
          customer_name: fallbackCheckout.customerName,
          customer_email: fallbackCheckout.customerEmail ?? null,
          delivery_address: fallbackCheckout.deliveryAddress ?? null,
          total_price: fallbackCheckout.totalPrice,
          status: fallbackCheckout.status ?? null,
          created_at: null,
        }
      );

      setStatus((currentStatus) => currentStatus || fallbackCheckout.status || null);
    }

    if (!orderId && !fallbackResolved) {
      return;
    }

    if (!orderId) {
      setLoading(false);
      setErrorMessage("Order ID tidak ditemukan pada redirect Midtrans.");
      return;
    }

    let isMounted = true;
    let timeoutId: ReturnType<typeof setTimeout> | null = null;
    let attempt = 0;
    const maxAttempts = 8;
    const retryDelayMs = 3000;

    const markSandboxOrderAsConfirmed = async () => {
      try {
        const response = await fetch(`/api/orders/${orderId}/status`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            status: "confirmed",
          }),
        });

        const data = (await response.json()) as {
          error?: string;
          status?: string;
        };

        if (!response.ok) {
          throw new Error(data.error || "Status sandbox gagal diperbarui.");
        }

        if (!isMounted) {
          return false;
        }

        setStatus("confirmed");
        setOrder((currentOrder) =>
          currentOrder
            ? {
                ...currentOrder,
                status: "confirmed",
              }
            : currentOrder
        );
        setSandboxMessage(
          "Mode sandbox aktif: pesanan ditandai lunas setelah redirect sukses agar alur pengujian tetap lancar."
        );
        return true;
      } catch (error) {
        if (!isMounted) {
          return false;
        }

        setErrorMessage(
          error instanceof Error
            ? error.message
            : "Status sandbox gagal diperbarui."
        );
        return false;
      }
    };

    const verifyOrder = async (isInitialAttempt: boolean) => {
      try {
        const response = await fetch(`/api/orders/${orderId}/verify`, {
          method: "GET",
          cache: "no-store",
        });

        const data = (await response.json()) as VerifyResponse;

        if (!response.ok) {
          throw new Error(data.error || "Verifikasi pembayaran gagal.");
        }

        if (!isMounted) {
          return;
        }

        const nextStatus = data.status || data.order?.status || redirectStatus || null;

        setOrder(data.order || null);
        setStatus(nextStatus);
        setErrorMessage("");

        const shouldRetry =
          !isPaidOrderStatus(nextStatus) &&
          nextStatus !== "cancelled" &&
          attempt < maxAttempts;

        if (shouldRetry) {
          attempt += 1;
          setIsAutoRefreshing(true);
          timeoutId = setTimeout(() => {
            verifyOrder(false);
          }, retryDelayMs);
          return;
        }

        if (
          isSandboxMidtrans &&
          nextStatus === "pending" &&
          result !== "pending" &&
          orderId
        ) {
          const confirmed = await markSandboxOrderAsConfirmed();

          if (confirmed) {
            setIsAutoRefreshing(false);
            setErrorMessage("");
            return;
          }
        }

        setIsAutoRefreshing(false);
      } catch (error) {
        if (!isMounted) {
          return;
        }

        setStatus(redirectStatus || (result === "success" ? "confirmed" : null));
        setErrorMessage(
          error instanceof Error
            ? error.message
            : "Terjadi kendala saat memverifikasi pembayaran."
        );
        setIsAutoRefreshing(false);
      } finally {
        if (!isMounted) {
          return;
        }

        if (isInitialAttempt) {
          setLoading(false);
        }
      }
    };

    verifyOrder(true);

    return () => {
      isMounted = false;
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [fallbackCheckout, fallbackResolved, orderId, redirectStatus, result]);

  useEffect(() => {
    if (isPaidOrderStatus(status) || result === "success") {
      clearCart();
      clearLastCheckout();
    }
  }, [clearCart, result, status]);

  const isPaid = isPaidOrderStatus(status) || result === "success";

  return (
    <div className="surface-panel rounded-[2.3rem] p-8 md:p-10">
      <div className="mx-auto flex max-w-3xl flex-col items-center text-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
          {isPaid ? (
            <CheckCircle2 className="h-10 w-10" strokeWidth={2.2} />
          ) : (
            <Clock3 className="h-10 w-10" strokeWidth={2.2} />
          )}
        </div>

        <p className="mt-6 text-xs font-bold uppercase tracking-[0.24em] text-orange-700">
          Checkout status
        </p>
        <h1 className="font-display mt-3 text-5xl font-bold leading-[0.95] text-slate-900">
          {isPaid ? "Pembayaran berhasil dikonfirmasi" : "Pesanan Anda sedang diverifikasi"}
        </h1>
        <p className="mt-4 max-w-2xl text-base leading-8 text-slate-600">
          {isPaid
            ? "Anda sudah kembali ke website GMRH Kitchen. Cart telah dibersihkan dan order langsung tercatat pada halaman pesanan pelanggan admin."
            : "Kami sedang mengecek status pembayaran terbaru dari Midtrans. Jika pembayaran sudah masuk, status order akan ikut diperbarui di dashboard admin."}
        </p>

        {loading && (
          <div className="mt-6 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-700">
            Memverifikasi status transaksi Midtrans...
          </div>
        )}

        {!loading && isAutoRefreshing && !isPaid && (
          <div className="mt-6 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-700">
            Status pembayaran sandbox sedang disinkronkan otomatis dengan Midtrans...
          </div>
        )}

        {!loading && sandboxMessage && (
          <div className="mt-6 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            {sandboxMessage}
          </div>
        )}

        {!loading && errorMessage && (
          <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            {errorMessage}
          </div>
        )}

        {status && !loading && (
          <div
            className={`mt-6 inline-flex items-center rounded-full border px-4 py-2 text-sm font-semibold ${getOrderStatusClasses(status)}`}
          >
            {getOrderStatusLabel(status)}
          </div>
        )}
      </div>

      <div className="mt-10 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-[1.7rem] bg-white/80 p-5">
          <div className="flex items-center gap-3">
            <ReceiptText className="h-5 w-5 text-orange-600" strokeWidth={2.2} />
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
              Order ID
            </p>
          </div>
          <p className="mt-4 break-all text-sm font-semibold text-slate-900">
            {orderId || "-"}
          </p>
        </div>

        <div className="rounded-[1.7rem] bg-white/80 p-5">
          <div className="flex items-center gap-3">
            <ShoppingBag className="h-5 w-5 text-orange-600" strokeWidth={2.2} />
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
              Nama penerima
            </p>
          </div>
          <p className="mt-4 text-sm font-semibold text-slate-900">
            {order?.customer_name || "Pelanggan GMRH"}
          </p>
        </div>

        <div className="rounded-[1.7rem] bg-white/80 p-5">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="h-5 w-5 text-orange-600" strokeWidth={2.2} />
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
              Total order
            </p>
          </div>
          <p className="mt-4 text-sm font-semibold text-slate-900">
            {formatOrderCurrency(order?.total_price)}
          </p>
        </div>

        <div className="rounded-[1.7rem] bg-white/80 p-5 md:col-span-2 xl:col-span-1">
          <div className="flex items-center gap-3">
            <MapPin className="h-5 w-5 text-orange-600" strokeWidth={2.2} />
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
              Alamat pengantaran
            </p>
          </div>
          <p className="mt-4 text-sm leading-7 font-semibold text-slate-900">
            {order?.delivery_address || "Alamat belum tersedia untuk order ini."}
          </p>
        </div>
      </div>

      <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
        <Link
          href="/menu"
          className="kitchen-primary-btn px-6 py-3 text-sm font-semibold"
        >
          Kembali ke Menu
        </Link>
        <Link
          href="/orders"
          className="kitchen-secondary-btn px-6 py-3 text-sm font-semibold text-slate-700"
        >
          Lihat Pesanan Saya
        </Link>
      </div>
    </div>
  );
}
