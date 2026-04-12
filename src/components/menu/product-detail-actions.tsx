"use client";

import { useState } from "react";
import { useCart } from "@/context/cart-context";
import { useUser } from "@/hooks/use-user";
import type { Product } from "@/types/product";
import { Check, ShoppingCart } from "lucide-react";
import { AuthModal } from "@/components/ui/auth-modal";

type Props = {
  product: Product;
};

export function ProductDetailActions({ product }: Props) {
  const { user } = useUser();
  const { addToCart } = useCart();
  const [added, setAdded] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);

  const handleAddToCart = () => {
    if (!user) {
      setShowAuthModal(true);
      return;
    }

    addToCart({
      id: product.id,
      name: product.name,
      price: product.price,
      image: product.image,
    });

    setAdded(true);

    window.setTimeout(() => {
      setAdded(false);
    }, 1500);
  };

  return (
    <>
      <button
        type="button"
        onClick={handleAddToCart}
        disabled={product.stock === 0}
        className={`inline-flex w-full items-center justify-center gap-2 rounded-2xl px-6 py-4 text-sm font-semibold transition md:w-auto ${
          product.stock === 0
            ? "cursor-not-allowed bg-gray-300 text-gray-600"
            : added
              ? "bg-green-500 text-white"
              : "kitchen-primary-btn"
        }`}
      >
        {product.stock === 0
          ? "Stok Habis"
          : added
            ? (
              <>
                <Check className="h-4 w-4" strokeWidth={2.4} />
                Ditambahkan
              </>
            )
            : (
              <>
                <ShoppingCart className="h-4 w-4" strokeWidth={2.4} />
                Tambah ke Keranjang
              </>
            )}
      </button>
      <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />
    </>
  );
}
