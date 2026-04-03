"use client";

import Link from "next/link";
import Script from "next/script";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, CreditCard, PackageOpen } from "lucide-react";
import { useCart } from "@/context/cart-context";
import { useUser } from "@/hooks/use-user";
import { saveLastCheckout } from "@/lib/checkout-session";

const midtransClientKey = process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY || "";
const snapScriptSource = midtransClientKey.startsWith("SB-")
  ? "https://app.sandbox.midtrans.com/snap/snap.js"
  : "https://app.midtrans.com/snap/snap.js";

export default function CheckoutPage() {
  const router = useRouter();
  const { cart, isHydrated, clearCart } = useCart();
  const { user } = useUser();
  const [name, setName] = useState<string | null>(null);
  const [phone, setPhone] = useState<string | null>(null);
  const [address, setAddress] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [noticeMessage, setNoticeMessage] = useState("");
  const [processing, setProcessing] = useState(false);
  const [snapReady, setSnapReady] = useState(false);

  const totalPrice = cart.reduce(
    (acc, item) => acc + item.price * item.quantity,
    0
  );

  const handleCheckout = async () => {
    const resolvedName = name ?? user?.full_name ?? "";
    const resolvedPhone = phone ?? user?.phone ?? "";

    if (!resolvedName || !resolvedPhone || !address) {
      setErrorMessage("Lengkapi nama, nomor telepon, dan alamat terlebih dahulu.");
      return;
    }

    if (!snapReady || typeof window === "undefined" || !window.snap) {
      setErrorMessage("Snap Midtrans belum siap dimuat. Tunggu sebentar lalu coba lagi.");
      return;
    }

    setProcessing(true);
    setErrorMessage("");
    setNoticeMessage("");

    try {
      const res = await fetch("/api/create-transaction", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: resolvedName,
          phone: resolvedPhone,
          address,
          customerEmail: user?.email ?? "",
          cart,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.snapToken || !data.orderId) {
        setErrorMessage(data.error || "Transaksi gagal dibuat. Coba lagi.");
        setProcessing(false);
        return;
      }

      saveLastCheckout({
        orderId: data.orderId,
        customerName: resolvedName,
        customerEmail: user?.email,
        deliveryAddress: address,
        totalPrice,
        status: "pending",
        createdAt: Date.now(),
      });

      window.snap.pay(data.snapToken, {
        onSuccess: async (result) => {
          saveLastCheckout({
            orderId: data.orderId,
            customerName: resolvedName,
            customerEmail: user?.email,
            deliveryAddress: address,
            totalPrice,
            status: result.transaction_status || "settlement",
            createdAt: Date.now(),
          });

          await fetch(`/api/orders/${data.orderId}/status`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              status: result.transaction_status || "settlement",
            }),
          }).catch(() => null);

          clearCart();
          router.replace(
            `/checkout/success?order_id=${encodeURIComponent(
              data.orderId
            )}&transaction_status=${encodeURIComponent(
              result.transaction_status || "settlement"
            )}`
          );
        },
        onPending: async (result) => {
          saveLastCheckout({
            orderId: data.orderId,
            customerName: resolvedName,
            customerEmail: user?.email,
            deliveryAddress: address,
            totalPrice,
            status: result.transaction_status || "pending",
            createdAt: Date.now(),
          });

          await fetch(`/api/orders/${data.orderId}/status`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              status: result.transaction_status || "pending",
            }),
          }).catch(() => null);

          setNoticeMessage(
            "Pembayaran Anda masih menunggu penyelesaian. Pesanan sudah tercatat di admin dengan status menunggu."
          );
          setProcessing(false);
        },
        onError: async (result) => {
          await fetch(`/api/orders/${data.orderId}/status`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              status: result.transaction_status || "failure",
            }),
          }).catch(() => null);

          setErrorMessage("Pembayaran gagal diproses oleh Midtrans. Silakan coba lagi.");
          setProcessing(false);
        },
        onClose: () => {
          setNoticeMessage(
            "Popup pembayaran ditutup. Pesanan masih tersimpan dengan status menunggu sampai Anda menyelesaikan pembayaran."
          );
          setProcessing(false);
        },
      });
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Terjadi kendala saat memulai pembayaran."
      );
      setProcessing(false);
    }
  };

  if (!isHydrated) {
    return (
      <div className="min-h-screen bg-[#f6ecdf] py-16">
        <div className="container mx-auto max-w-5xl px-6">
          <div className="surface-panel rounded-[2rem] p-10 text-center text-slate-500">
            Memuat checkout...
          </div>
        </div>
      </div>
    );
  }

  if (cart.length === 0) {
    return (
      <div className="min-h-screen bg-[#f6ecdf] py-16">
        <div className="container mx-auto max-w-5xl px-6">
          <div className="surface-panel rounded-[2rem] p-12 text-center">
            <PackageOpen className="mx-auto h-14 w-14 text-orange-500" strokeWidth={2.2} />
            <h1 className="mt-5 text-3xl font-semibold text-slate-900">
              Checkout belum bisa dilanjutkan
            </h1>
            <p className="mt-3 text-sm leading-7 text-slate-500">
              Keranjang Anda masih kosong. Tambahkan produk dulu sebelum melakukan pembayaran.
            </p>
            <Link href="/menu" className="kitchen-primary-btn mt-6 px-6 py-3 text-sm font-semibold">
              Kembali ke Menu
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f6ecdf] py-16">
      <Script
        src={snapScriptSource}
        data-client-key={midtransClientKey}
        strategy="afterInteractive"
        onLoad={() => setSnapReady(true)}
        onError={() =>
          setErrorMessage(
            "Script Midtrans gagal dimuat. Periksa NEXT_PUBLIC_MIDTRANS_CLIENT_KEY lalu coba lagi."
          )
        }
      />

      <div className="container mx-auto max-w-6xl px-6">
        <Link
          href="/cart"
          className="kitchen-secondary-btn mb-8 px-4 py-3 text-sm font-semibold text-slate-700"
        >
          <ArrowLeft className="h-4 w-4" strokeWidth={2.2} />
          Kembali ke Keranjang
        </Link>

        <div className="grid gap-8 lg:grid-cols-[1fr_0.95fr]">
          <div className="surface-panel rounded-[2rem] p-7 md:p-8">
            <div className="kitchen-badge">
              <CreditCard className="h-4 w-4" strokeWidth={2.2} />
              Checkout form
            </div>
            <h1 className="font-display mt-6 text-5xl font-bold leading-[0.95] text-slate-900">
              Selesaikan pesanan Anda
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-8 text-slate-600">
              Isi data penerima, lalu lanjutkan pembayaran melalui Midtrans.
            </p>

            {errorMessage && (
              <div className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {errorMessage}
              </div>
            )}

            {noticeMessage && (
              <div className="mt-6 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-700">
                {noticeMessage}
              </div>
            )}

            <div className="mt-8 space-y-5">
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-800">
                  Nama Penerima
                </label>
                <input
                  placeholder="Nama lengkap"
                  value={name ?? user?.full_name ?? ""}
                  onChange={(e) => setName(e.target.value)}
                  className="kitchen-input"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-800">
                  Nomor Telepon
                </label>
                <input
                  placeholder="08xxxxxxxxxx"
                  value={phone ?? user?.phone ?? ""}
                  onChange={(e) => setPhone(e.target.value)}
                  className="kitchen-input"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-800">
                  Alamat Lengkap
                </label>
                <textarea
                  placeholder="Tulis alamat penerima"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="kitchen-input min-h-36 resize-none"
                />
              </div>

              <button
                onClick={handleCheckout}
                disabled={processing}
                className="kitchen-primary-btn w-full px-6 py-4 text-base font-semibold disabled:cursor-not-allowed disabled:opacity-70"
              >
                {processing ? "Membuka pembayaran..." : "Bayar Sekarang"}
              </button>
            </div>
          </div>

          <div className="surface-panel h-fit rounded-[2rem] p-7">
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-orange-700">
              Order summary
            </p>
            <h2 className="font-display mt-4 text-4xl font-bold text-slate-900">
              Ringkasan belanja
            </h2>

            <div className="mt-8 space-y-4">
              {cart.map((item) => (
                <div key={item.id} className="flex items-center justify-between gap-4 border-b border-[#efe2d2] pb-4">
                  <div>
                    <p className="font-semibold text-slate-900">{item.name}</p>
                    <p className="mt-1 text-sm text-slate-500">
                      {item.quantity} x Rp {item.price.toLocaleString("id-ID")}
                    </p>
                  </div>
                  <p className="font-semibold text-slate-900">
                    Rp {(item.quantity * item.price).toLocaleString("id-ID")}
                  </p>
                </div>
              ))}
            </div>

            <div className="mt-6 rounded-[1.5rem] bg-slate-900 p-5 text-white">
              <div className="flex items-center justify-between">
                <span className="text-sm text-orange-200">Total pembayaran</span>
                <span className="text-2xl font-bold">
                  Rp {totalPrice.toLocaleString("id-ID")}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
