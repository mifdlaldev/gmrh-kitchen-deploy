"use client";

import { useEffect, useState } from "react";
import { MenuCard } from "@/components/menu/menu-card";
import { createClient } from "@/lib/supabase/client";
import {
  hasSupabaseEnv,
  missingSupabaseEnvMessage,
} from "@/lib/supabase/env";
import { Product } from "@/types/product";
import { FolderHeart, Soup, Sparkles } from "lucide-react";

export default function MenuPage() {
  const isSupabaseReady = hasSupabaseEnv();
  const [menus, setMenus] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMenus = async () => {
      const supabase = createClient();

      if (!supabase) {
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("products")
        .select("*")
        .order("created_at", { ascending: false });

      if (!error && data) {
        setMenus(data);
      }

      setLoading(false);
    };

    fetchMenus();
  }, []);

  return (
    <section className="relative overflow-hidden bg-[#f6ecdf] py-16 md:py-20">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,214,153,0.32),transparent_24%),radial-gradient(circle_at_bottom_right,rgba(255,174,102,0.18),transparent_22%)]" />

      <div className="container relative mx-auto px-6">
        <div className="grid gap-10 lg:grid-cols-[1fr_auto] lg:items-end">
          <div>
            <div className="kitchen-badge">
              <FolderHeart className="h-4 w-4" strokeWidth={2.2} />
              Kitchen catalogue
            </div>

            <h1 className="font-display mt-6 max-w-4xl text-5xl font-bold leading-[0.92] text-slate-900 md:text-6xl">
              Daftar menu yang disusun untuk rasa nyaman dan tampilan yang menggoda.
            </h1>

            <p className="mt-5 max-w-2xl text-base leading-8 text-slate-600">
              Jelajahi seluruh pilihan GMRH Kitchen, mulai dari menu harian yang
              praktis sampai hidangan yang pas untuk momen lebih istimewa.
            </p>
          </div>

          <div className="surface-panel max-w-sm rounded-[2rem] p-5">
            <div className="flex items-start gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-orange-100 text-orange-600">
                <Sparkles className="h-5 w-5" strokeWidth={2.2} />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-900">Kurasi rapi</p>
                <p className="mt-1 text-sm leading-6 text-slate-500">
                  Setiap kartu menu dibuat agar pelanggan langsung tahu apa yang paling menarik untuk dipesan.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-12 grid gap-4 md:grid-cols-3">
          {[
            {
              icon: Soup,
              title: "Menu hangat harian",
              text: "Cocok untuk makan siang praktis dengan rasa yang tetap rumahan.",
            },
            {
              icon: Sparkles,
              title: "Presentasi lebih bersih",
              text: "Foto, kartu, dan detail dibuat lebih mudah dipindai saat memilih.",
            },
            {
              icon: FolderHeart,
              title: "Pilihan cepat",
              text: "Langsung klik detail produk atau tambah ke keranjang tanpa langkah berlebih.",
            },
          ].map((item) => (
            <div key={item.title} className="surface-panel rounded-[1.75rem] p-5">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-900 text-white">
                <item.icon className="h-5 w-5" strokeWidth={2.2} />
              </div>
              <h2 className="mt-5 text-lg font-semibold text-slate-900">{item.title}</h2>
              <p className="mt-2 text-sm leading-7 text-slate-600">{item.text}</p>
            </div>
          ))}
        </div>

        {!isSupabaseReady && (
          <div className="mt-10 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            {missingSupabaseEnvMessage}
          </div>
        )}

        {loading && (
          <div className="mt-12 rounded-[2rem] bg-white/70 px-6 py-12 text-center text-slate-500 shadow-sm">
            Memuat katalog menu...
          </div>
        )}

        {!loading && menus.length === 0 && (
          <div className="mt-12 rounded-[2rem] bg-white/70 px-6 py-12 text-center text-slate-500 shadow-sm">
            Menu belum tersedia
          </div>
        )}

        <div className="mt-12 grid gap-8 sm:grid-cols-2 xl:grid-cols-3">
          {menus.map((menu: Product) => (
            <MenuCard key={menu.id} menu={menu} />
          ))}
        </div>
      </div>
    </section>
  );
}
