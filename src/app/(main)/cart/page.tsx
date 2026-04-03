"use client";

import Link from "next/link";
import { Minus, PackageOpen, Plus, Trash2 } from "lucide-react";
import { useCart } from "@/context/cart-context";

export default function CartPage() {
  const { cart, isHydrated, increaseQty, decreaseQty, removeFromCart } = useCart();

  const totalPrice = cart.reduce(
    (acc, item) => acc + item.price * item.quantity,
    0
  );

  return (
    <div className="min-h-screen bg-[#f6ecdf] py-16">
      <div className="container mx-auto max-w-6xl px-6">
        <div className="mb-10">
          <div className="kitchen-badge">Cart review</div>
          <h1 className="font-display mt-6 text-5xl font-bold text-slate-900">
            Keranjang belanja Anda
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-8 text-slate-600">
            Periksa kembali pilihan menu sebelum melanjutkan ke pembayaran.
          </p>
        </div>

        {!isHydrated ? (
          <div className="flex justify-center">
            <div className="surface-panel max-w-md rounded-[2rem] p-12 text-center">
              <div className="text-slate-500">Memuat keranjang...</div>
            </div>
          </div>
        ) : cart.length === 0 ? (
          <div className="flex justify-center">
            <div className="surface-panel max-w-md rounded-[2rem] p-12 text-center">
              <div className="mb-4 text-orange-500">
                <PackageOpen className="mx-auto h-14 w-14" strokeWidth={2.2} />
              </div>

              <h2 className="text-2xl font-semibold text-slate-900">
                Keranjang Anda Kosong
              </h2>

              <p className="mt-3 text-sm leading-7 text-slate-500">
                Belum ada produk di keranjang Anda. Jelajahi katalog kami untuk mulai memilih menu favorit.
              </p>

              <Link
                href="/menu"
                className="kitchen-primary-btn mt-6 px-6 py-3 text-sm font-semibold"
              >
                Lihat Menu
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="space-y-5">
              {cart.map((item) => (
                <div
                  key={item.id}
                  className="surface-panel flex flex-col gap-5 rounded-[2rem] p-5 md:flex-row md:items-center md:justify-between"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-[1.4rem] bg-[#f4ede3]">
                      {item.image ? (
                        <img
                          src={item.image}
                          alt={item.name}
                          className="h-full w-full object-contain"
                        />
                      ) : (
                        <span className="text-sm text-gray-400">Img</span>
                      )}
                    </div>

                    <div>
                      <h2 className="text-xl font-semibold text-slate-900">{item.name}</h2>
                      <p className="mt-2 text-sm text-slate-500">Menu GMRH Kitchen</p>
                      <p className="mt-2 text-lg font-bold text-orange-600">
                        Rp {item.price.toLocaleString("id-ID")}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                    <div className="flex items-center rounded-full border border-[#ead7c2] bg-white/80 p-1">
                      <button
                        onClick={() => decreaseQty(item.id)}
                        className="flex h-10 w-10 items-center justify-center rounded-full text-slate-600 transition hover:bg-[#f3e6d8]"
                      >
                        <Minus className="h-4 w-4" strokeWidth={2.2} />
                      </button>

                      <span className="min-w-12 px-4 text-center font-semibold text-slate-900">
                        {item.quantity}
                      </span>

                      <button
                        onClick={() => increaseQty(item.id)}
                        className="flex h-10 w-10 items-center justify-center rounded-full text-slate-600 transition hover:bg-[#f3e6d8]"
                      >
                        <Plus className="h-4 w-4" strokeWidth={2.2} />
                      </button>
                    </div>

                    <button
                      onClick={() => removeFromCart(item.id)}
                      className="inline-flex items-center gap-2 rounded-full px-4 py-3 text-sm font-semibold text-red-600 transition hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" strokeWidth={2.2} />
                      Hapus
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="surface-panel h-fit rounded-[2rem] p-6 md:p-7">
              <p className="text-xs font-bold uppercase tracking-[0.24em] text-orange-700">
                Ringkasan pesanan
              </p>
              <h2 className="font-display mt-4 text-4xl font-bold text-slate-900">
                Siap lanjut ke checkout
              </h2>

              <div className="mt-8 space-y-4 text-sm text-slate-600">
                {cart.map((item) => (
                  <div key={item.id} className="flex justify-between gap-4 border-b border-[#efe2d2] pb-4">
                    <span>
                      {item.name} x{item.quantity}
                    </span>
                    <span className="font-semibold text-slate-900">
                      Rp {(item.price * item.quantity).toLocaleString("id-ID")}
                    </span>
                  </div>
                ))}
              </div>

              <div className="mt-6 flex items-center justify-between">
                <span className="text-base font-semibold text-slate-900">Total</span>
                <span className="text-2xl font-bold text-orange-600">
                  Rp {totalPrice.toLocaleString("id-ID")}
                </span>
              </div>

              <Link
                href="/checkout"
                className="kitchen-primary-btn mt-6 w-full px-6 py-4 text-base font-semibold"
              >
                Checkout
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
