import Link from "next/link";
import { BrandLogo } from "@/components/brand/logo";
import { ArrowUpRight, Mail, MapPin, Phone } from "lucide-react";

export function Footer() {
  return (
    <footer className="relative overflow-hidden border-t border-[#e3d4c2] bg-[#221912] text-[#f7ecdf]">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_0%_0%,rgba(255,170,92,0.18),transparent_24%),radial-gradient(circle_at_100%_100%,rgba(255,255,255,0.08),transparent_18%)]" />

      <div className="container relative mx-auto px-6 py-16">
        <div className="grid gap-10 lg:grid-cols-[1.2fr_0.7fr_0.9fr]">
          <div>
            <div className="flex items-center gap-3">
              <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10">
                <BrandLogo
                  size={44}
                  className="h-11 w-11"
                />
              </span>
              <div>
                <p className="font-display text-3xl font-bold">GMRH Kitchen</p>
                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#d9b894]">
                  Tasteful everyday delivery
                </p>
              </div>
            </div>

            <p className="mt-6 max-w-xl text-sm leading-8 text-[#e7d7c7]">
              Dapur modern dengan rasa rumahan yang akrab. Kami merancang
              pengalaman pesan makanan yang terasa hangat sejak pertama melihat
              menu sampai paket tiba di depan pintu.
            </p>

            <div className="mt-8 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-orange-200">
              Fresh cooked daily
            </div>
          </div>

          <div>
            <h3 className="text-sm font-bold uppercase tracking-[0.22em] text-[#d9b894]">
              Navigasi
            </h3>
            <div className="mt-5 space-y-3">
              {[
                { href: "/", label: "Beranda" },
                { href: "/menu", label: "Menu" },
                { href: "/contact", label: "Kontak" },
              ].map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-[#f7ecdf] transition hover:bg-white/10"
                >
                  <span>{item.label}</span>
                  <ArrowUpRight className="h-4 w-4 text-orange-300" strokeWidth={2.2} />
                </Link>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-sm font-bold uppercase tracking-[0.22em] text-[#d9b894]">
              Kontak
            </h3>
            <div className="mt-5 space-y-3">
              {[
                {
                  icon: Mail,
                  label: "Email",
                  value: "support@gmrhkitchen.id",
                },
                {
                  icon: Phone,
                  label: "Telepon",
                  value: "+62 812-3456-7890",
                },
                {
                  icon: MapPin,
                  label: "Lokasi",
                  value: "Sumedang, Jawa Barat",
                },
              ].map((item) => (
                <div
                  key={item.label}
                  className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4"
                >
                  <div className="flex items-center gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/10 text-orange-300">
                      <item.icon className="h-4 w-4" strokeWidth={2.2} />
                    </span>
                    <div>
                      <p className="text-xs uppercase tracking-[0.2em] text-[#cdb39a]">
                        {item.label}
                      </p>
                      <p className="mt-1 text-sm text-[#f7ecdf]">{item.value}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-14 border-t border-white/10 pt-6 text-center text-sm text-[#d9c7b4]">
          © {new Date().getFullYear()} GMRH Kitchen. Crafted for warm meals and calm cravings.
        </div>
      </div>
    </footer>
  );
}
