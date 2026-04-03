import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Sparkles } from "lucide-react";
import { ProductDetailActions } from "@/components/menu/product-detail-actions";
import { missingSupabaseEnvMessage } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";

type Props = {
  params: Promise<{
    id: string;
  }>;
};

export default async function ProductDetailPage({ params }: Props) {
  const { id } = await params;
  const supabase = await createClient();

  if (!supabase) {
    return (
      <section className="min-h-screen bg-[#f6ecdf] py-16">
        <div className="container mx-auto max-w-4xl px-6">
          <div className="rounded-2xl border border-amber-200 bg-amber-50 px-6 py-5 text-amber-800">
            {missingSupabaseEnvMessage}
          </div>
        </div>
      </section>
    );
  }

  const { data: product, error } = await supabase
    .from("products")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error || !product) {
    notFound();
  }

  return (
    <section className="relative overflow-hidden bg-[#f6ecdf] py-16">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,214,153,0.32),transparent_24%),radial-gradient(circle_at_bottom_right,rgba(255,174,102,0.18),transparent_22%)]" />

      <div className="container relative mx-auto max-w-6xl px-6">
        <Link
          href="/menu"
          className="kitchen-secondary-btn mb-8 px-4 py-3 text-sm font-semibold text-slate-700"
        >
          <ArrowLeft className="h-4 w-4" strokeWidth={2.2} />
          Kembali ke Menu
        </Link>

        <div className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="surface-panel overflow-hidden rounded-[2.2rem] p-4">
            <div className="overflow-hidden rounded-[1.8rem] bg-[#f4ede3]">
              {product.image ? (
                <img
                  src={product.image}
                  alt={product.name}
                  className="aspect-[4/3] h-full w-full object-contain"
                />
              ) : (
                <div className="flex aspect-[4/3] items-center justify-center px-6 text-center text-gray-400">
                  Tidak ada foto produk
                </div>
              )}
            </div>
          </div>

          <div className="surface-panel rounded-[2.2rem] p-7 md:p-8">
            <div className="flex flex-wrap items-center gap-3">
              <span className="kitchen-badge">
                <Sparkles className="h-4 w-4" strokeWidth={2.2} />
                Detail produk
              </span>
              <span
                className={`rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] ${
                  product.stock > 0
                    ? "bg-green-100 text-green-700"
                    : "bg-gray-200 text-gray-600"
                }`}
              >
                {product.stock > 0 ? `Stok ${product.stock}` : "Stok Habis"}
              </span>
            </div>

            <h1 className="font-display mt-6 text-5xl font-bold leading-[0.95] text-slate-900">
              {product.name}
            </h1>

            <p className="mt-5 text-base leading-8 text-slate-600">
              {product.description || "Belum ada deskripsi untuk produk ini."}
            </p>

            <div className="mt-8 rounded-[1.8rem] bg-slate-900 p-6 text-white">
              <p className="text-xs uppercase tracking-[0.22em] text-orange-200">
                Harga produk
              </p>
              <p className="mt-3 text-4xl font-bold">
                Rp {product.price.toLocaleString("id-ID")}
              </p>
            </div>

            <div className="mt-8">
              <ProductDetailActions product={product} />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
