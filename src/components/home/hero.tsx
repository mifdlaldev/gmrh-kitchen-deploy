import Link from "next/link";
import { BrandLogo } from "@/components/brand/logo";
import { ArrowRight, Clock3, ShieldCheck, Sparkles } from "lucide-react";

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
    <section className="relative overflow-hidden bg-[#efe2cf] pb-20 pt-14 md:pb-24 md:pt-20">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(255,211,138,0.45),_transparent_32%),radial-gradient(circle_at_85%_18%,_rgba(255,165,96,0.35),_transparent_26%),linear-gradient(180deg,_rgba(255,255,255,0.38),_transparent_45%)]" />
      <div className="absolute inset-y-0 right-0 hidden w-[36rem] bg-[linear-gradient(135deg,rgba(255,255,255,0.24),transparent_55%)] md:block" />

      <div className="relative container mx-auto px-6">
        <div className="grid items-center gap-14 lg:grid-cols-[1.1fr_0.9fr]">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-orange-200/80 bg-white/70 px-4 py-2 text-xs font-semibold uppercase tracking-[0.28em] text-orange-700 shadow-sm backdrop-blur">
              <Sparkles className="h-4 w-4" strokeWidth={2.2} />
              Fresh From GMRH Kitchen
            </div>

            <h1 className="mt-8 max-w-4xl text-5xl font-black leading-[0.95] text-slate-900 md:text-6xl xl:text-7xl">
              Menu rumahan yang
              <span className="block text-orange-600"> terasa hangat, modern, dan siap antar.</span>
            </h1>

            <p className="mt-7 max-w-2xl text-lg leading-8 text-slate-600 md:text-xl">
              GMRH Kitchen menghadirkan pengalaman pesan makanan yang lebih segar:
              visual yang bersih, menu yang menggoda, dan cita rasa dapur rumahan
              yang dibuat untuk momen santai maupun acara istimewa.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              {highlights.map((item) => (
                <div
                  key={item}
                  className="rounded-full border border-[#e8c9a8] bg-white/75 px-4 py-2 text-sm font-medium text-slate-700 shadow-sm"
                >
                  {item}
                </div>
              ))}
            </div>

            <div className="mt-10 flex flex-col gap-4 sm:flex-row">
              <Link
                href="/menu"
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-orange-500 px-7 py-4 text-sm font-semibold !text-white shadow-[0_18px_40px_rgba(247,115,22,0.28)] transition hover:-translate-y-0.5 hover:bg-orange-600 hover:!text-white"
              >
                <span className="!text-white">Jelajahi Menu</span>
                <ArrowRight className="h-4 w-4 !text-white" strokeWidth={2.4} />
              </Link>

              <Link
                href="/contact"
                className="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white/80 px-7 py-4 text-sm font-semibold text-slate-700 transition hover:bg-white"
              >
                Hubungi Dapur Kami
              </Link>
            </div>

            <div className="mt-12 grid gap-4 sm:grid-cols-3">
              {stats.map((stat) => (
                <div
                  key={stat.label}
                  className="rounded-2xl border border-white/65 bg-white/70 px-5 py-5 shadow-sm backdrop-blur"
                >
                  <p className="text-2xl font-black text-slate-900">{stat.value}</p>
                  <p className="mt-1 text-sm text-slate-500">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="relative">
            <div className="absolute -left-4 top-14 hidden h-24 w-24 rounded-[2rem] border border-white/60 bg-white/30 blur-[2px] lg:block" />
            <div className="absolute -right-6 bottom-8 hidden h-40 w-40 rounded-full bg-orange-200/60 blur-3xl lg:block" />

            <div className="relative rounded-[2.5rem] border border-white/70 bg-[#fff8ef] p-5 shadow-[0_30px_80px_rgba(145,94,36,0.14)]">
              <div className="rounded-[2rem] bg-[linear-gradient(160deg,#fff7ea_0%,#ffe5c3_100%)] p-6">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.28em] text-orange-700">
                      Today&apos;s Kitchen Mood
                    </p>
                    <h2 className="mt-3 text-3xl font-black leading-tight text-slate-900">
                      Piring hangat,
                      <span className="block"> plating bersih, rasa berani.</span>
                    </h2>
                  </div>

                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white shadow-sm">
                    <BrandLogo
                      size={42}
                      className="h-10 w-10"
                    />
                  </div>
                </div>

                <div className="mt-8 grid gap-4">
                  <div className="grid gap-4 sm:grid-cols-[1.2fr_0.8fr]">
                    <div className="rounded-[1.75rem] bg-slate-900 px-6 py-6 text-white">
                      <p className="text-xs uppercase tracking-[0.24em] text-orange-200">
                        Signature Experience
                      </p>
                      <p className="mt-4 text-lg font-semibold leading-8">
                        Perpaduan menu harian, pengemasan rapi, dan layanan antar
                        yang membuat kitchen Anda terasa dekat.
                      </p>
                    </div>

                    <div className="rounded-[1.75rem] bg-white/80 p-5 shadow-sm">
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-100 text-orange-600">
                        <Clock3 className="h-5 w-5" strokeWidth={2.2} />
                      </div>
                      <p className="mt-5 text-sm font-semibold text-slate-900">
                        Estimasi cepat
                      </p>
                      <p className="mt-2 text-sm leading-6 text-slate-500">
                        Pesanan diproses efisien agar makanan sampai hangat dan tetap cantik.
                      </p>
                    </div>
                  </div>

                  <div className="rounded-[1.75rem] border border-white/70 bg-white/70 p-5 shadow-sm backdrop-blur">
                    <div className="flex items-start gap-4">
                      <div className="mt-1 flex h-11 w-11 items-center justify-center rounded-2xl bg-green-100 text-green-700">
                        <ShieldCheck className="h-5 w-5" strokeWidth={2.2} />
                      </div>

                      <div>
                        <p className="text-sm font-semibold text-slate-900">
                          Dimasak dengan standar rasa yang konsisten
                        </p>
                        <p className="mt-2 text-sm leading-6 text-slate-500">
                          Setiap menu dipersiapkan dengan fokus pada bahan segar,
                          tampilan rapi, dan rasa yang tetap akrab di lidah.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
