import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Sparkles } from "lucide-react";

const highlights = [
  "Masakan fresh setiap hari",
  "Rasa rumahan yang hangat",
  "Siap antar dengan cepat",
];

const stats = [
  { value: "120+", label: "Pesanan mingguan" },
  { value: "4.9", label: "Rating pelanggan" },
  { value: "30m", label: "Rata-rata antar" },
];

export function Hero() {
  return (
    <section className="relative overflow-hidden min-h-[calc(100vh-5rem)] flex items-center py-10 lg:py-0">
      {/* Background Image */}
      <div className="absolute inset-0 z-0">
        <Image
          src="/home-bg.jpeg"
          alt="GMRH Kitchen"
          fill
          priority
          className="object-cover object-right md:object-center"
        />
        {/* Gradient Overlay for Text Readability */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#fff8ef] via-[#fff8ef]/90 to-[#fff8ef]/40 md:to-transparent backdrop-blur-[2px] md:backdrop-blur-[1px]" />
        <div className="absolute inset-0 bg-black/5" />
      </div>

      <div className="relative z-10 container mx-auto px-6 mt-12 mb-12">
        <div className="grid items-center gap-8 lg:grid-cols-2">
          <div className="max-w-xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-orange-200/80 bg-white/80 px-3 py-1.5 text-[10px] sm:text-xs font-semibold uppercase tracking-[0.28em] text-orange-700 shadow-sm backdrop-blur-md">
              <Sparkles className="h-3.5 w-3.5" strokeWidth={2.2} />
              Fresh From GMRH Kitchen
            </div>

            <h1 className="mt-5 text-4xl font-black leading-[1.05] text-slate-900 md:text-5xl lg:text-[3.5rem] drop-shadow-sm">
              Menu rumahan yang
              <span className="block text-orange-600"> terasa hangat, modern, dan siap antar.</span>
            </h1>

            <p className="mt-4 text-base leading-relaxed text-slate-700 md:text-lg font-medium drop-shadow-sm">
              GMRH Kitchen menghadirkan pengalaman pesan makanan yang lebih segar:
              visual yang bersih, menu yang menggoda, dan cita rasa dapur rumahan
              yang dibuat untuk momen santai maupun acara istimewa.
            </p>

            <div className="mt-6 flex flex-wrap gap-2 sm:gap-3">
              {highlights.map((item) => (
                <div
                  key={item}
                  className="rounded-full border border-orange-200/60 bg-white/80 px-3.5 py-1.5 text-xs sm:text-sm font-medium text-slate-800 shadow-sm backdrop-blur-md"
                >
                  {item}
                </div>
              ))}
            </div>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:gap-4">
              <Link
                href="/menu"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-orange-500 px-6 py-3.5 text-sm font-semibold !text-white shadow-[0_12px_30px_rgba(247,115,22,0.25)] transition hover:-translate-y-0.5 hover:bg-orange-600 hover:!text-white"
              >
                <span className="!text-white">Jelajahi Menu</span>
                <ArrowRight className="h-4 w-4 !text-white" strokeWidth={2.4} />
              </Link>

              <Link
                href="/contact"
                className="inline-flex items-center justify-center rounded-xl border border-slate-200/80 bg-white/80 px-6 py-3.5 text-sm font-semibold text-slate-800 shadow-sm backdrop-blur-md transition hover:bg-white"
              >
                Hubungi Dapur Kami
              </Link>
            </div>

            <div className="mt-8 grid gap-3 sm:grid-cols-3 sm:gap-4">
              {stats.map((stat) => (
                <div
                  key={stat.label}
                  className="rounded-2xl border border-white/60 bg-white/80 px-4 py-4 shadow-sm backdrop-blur-md"
                >
                  <p className="text-2xl font-black text-slate-900">{stat.value}</p>
                  <p className="mt-0.5 text-xs font-medium text-slate-600">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
