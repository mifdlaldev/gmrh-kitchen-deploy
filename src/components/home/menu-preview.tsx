"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { MenuCard } from "@/components/menu/menu-card";
import { Product } from "@/types/product";
import { ArrowRight, FolderHeart, Sparkles } from "lucide-react";

export function MenuPreview() {
  const isSupabaseReady = hasSupabaseEnv();

  const [menus,setMenus] = useState<Product[]>([]);

  useEffect(()=>{

    const fetchMenus = async () => {
      const supabase = createClient();

      if (!supabase) {
        return;
      }

      const { data, error } = await supabase
        .from("products")
        .select("*")
        .limit(3);   // hanya 3 menu

      if(error){
        console.error(error);
        return;
      }

      setMenus(data || []);
    };

    fetchMenus();

  },[]);

  return (

    <section className="bg-[#f7f0e5] py-24">

      <div className="container mx-auto px-6">

        <div className="mb-14 grid gap-8 lg:grid-cols-[1fr_auto] lg:items-end">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-orange-200 bg-white px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-orange-700">
              <FolderHeart className="h-4 w-4" strokeWidth={2.2} />
              Pilihan Favorit
            </div>

            <h2 className="mt-5 max-w-3xl text-4xl font-black text-slate-900 md:text-5xl">
              Menu yang terasa seperti dapur favorit Anda sendiri.
            </h2>

            <p className="mt-4 max-w-2xl text-base leading-8 text-slate-600">
              Kami pilihkan beberapa menu yang paling sering dicari pelanggan:
              tampil rapi, menggugah, dan cocok untuk makan siang cepat maupun
              makan santai di rumah.
            </p>
          </div>

          <div className="rounded-[1.75rem] border border-orange-100 bg-white/80 p-5 shadow-sm">
            <div className="flex items-start gap-3">
              <div className="mt-1 flex h-10 w-10 items-center justify-center rounded-2xl bg-orange-100 text-orange-600">
                <Sparkles className="h-5 w-5" strokeWidth={2.2} />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-900">Kurasi harian</p>
                <p className="mt-1 text-sm leading-6 text-slate-500">
                  Menu yang tampil di beranda dibuat agar pelanggan langsung tahu apa yang paling menggoda hari ini.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-8 md:grid-cols-3">

          {menus.map((menu)=>(
            <MenuCard key={menu.id} menu={menu}/>
          ))}

          {!isSupabaseReady && (
            <div className="rounded-2xl border border-dashed border-amber-300 bg-amber-50 p-6 text-sm text-amber-800 md:col-span-3">
              Menu preview akan tampil setelah konfigurasi Supabase diisi.
            </div>
          )}

        </div>

        <div className="mt-14 flex justify-center">
          <Link
            href="/menu"
            className="inline-flex items-center gap-2 rounded-2xl bg-slate-900 px-8 py-4 text-sm font-semibold !text-white transition hover:bg-slate-800 hover:!text-white"
          >
            <span className="!text-white">Lihat Semua Menu</span>
            <ArrowRight className="h-4 w-4 !text-white" strokeWidth={2.2} />
          </Link>
        </div>

      </div>

    </section>
  );
}
