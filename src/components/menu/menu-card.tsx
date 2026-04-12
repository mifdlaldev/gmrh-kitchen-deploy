"use client";

import Link from "next/link";
import { useState } from "react";
import { Product } from "@/types/product";
import { useCart } from "@/context/cart-context";
import { useUser } from "@/hooks/use-user";
import { ArrowUpRight, Check, ShoppingCart } from "lucide-react";
import { AuthModal } from "@/components/ui/auth-modal";

export function MenuCard({ menu }: { menu: Product }) {
  const { user } = useUser();
  const { addToCart } = useCart();
  const [added, setAdded] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);

  const handleAdd = (e: React.MouseEvent) => {
    e.preventDefault();

    if (!user) {
      setShowAuthModal(true);
      return;
    }

    addToCart({
      id: menu.id,
      name: menu.name,
      price: menu.price,
      image: menu.image,
    });

    setAdded(true);

    setTimeout(() => {
      setAdded(false);
    }, 1500);
  };

  return (
    <>
      <div className="group surface-panel overflow-hidden rounded-[2rem] transition duration-300 hover:-translate-y-1 hover:shadow-[0_26px_50px_rgba(67,44,17,0.12)]">
        <Link href={`/menu/${menu.id}`} className="block">
          <div className="relative overflow-hidden border-b border-[#efe2d2] bg-[#f4ede3]">
            <div className="absolute left-4 top-4 rounded-full bg-white/80 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-orange-700">
              {menu.stock > 0 ? `Stok ${menu.stock}` : "Habis"}
            </div>

            <div className="aspect-[4/3] w-full p-4">
              <div className="flex h-full w-full items-center justify-center overflow-hidden rounded-[1.6rem] bg-white/75 shadow-inner">
                {menu.image ? (
                  <img
                    src={menu.image}
                    alt={menu.name}
                    className="h-full w-full object-contain transition duration-300 group-hover:scale-[1.03]"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center px-4 text-center text-sm text-gray-400">
                    No Image
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="p-6">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-2xl font-semibold text-slate-900">{menu.name}</h3>
              </div>
            </div>

            <div className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-orange-600">
              Lihat Detail
              <ArrowUpRight className="h-4 w-4" strokeWidth={2.2} />
            </div>
          </div>
        </Link>

        <div className="flex items-center justify-between px-6 pb-6">
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Harga</p>
            <span className="mt-1 block text-2xl font-bold text-slate-900">
              Rp {menu.price.toLocaleString("id-ID")}
            </span>
          </div>

          {menu.stock === 0 ? (
            <button
              className="cursor-not-allowed rounded-2xl bg-gray-200 px-4 py-3 text-sm font-semibold text-gray-500"
              disabled
            >
              Stok Habis
            </button>
          ) : (
            <button
              onClick={handleAdd}
              className={`rounded-2xl px-4 py-3 text-sm font-semibold text-white transition ${
                added ? "bg-green-500" : "kitchen-primary-btn"
              }`}
            >
              {added ? (
                <span className="inline-flex items-center gap-2">
                  <Check className="h-4 w-4" strokeWidth={2.4} />
                  Ditambahkan
                </span>
              ) : (
                <span className="inline-flex items-center gap-2">
                  <ShoppingCart className="h-4 w-4" strokeWidth={2.4} />
                  Keranjang
                </span>
              )}
            </button>
          )}
        </div>
      </div>
      <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />
    </>
  );
}
