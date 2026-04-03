import type { LucideIcon } from "lucide-react";
import { Banknote, Bike, ShieldCheck, Soup } from "lucide-react";

export function Features() {
  const features: {
    id: number;
    icon: LucideIcon;
    title: string;
    description: string;
  }[] = [
    {
      id: 1,
      icon: Soup,
      title: "Menu Berkualitas",
      description:
        "Masakan rumahan dengan bahan segar dan kualitas terbaik untuk kepuasan pelanggan.",
    },
    {
      id: 2,
      icon: Bike,
      title: "Pengiriman Cepat",
      description:
        "Pesanan Anda akan kami antar dengan cepat dan aman langsung ke lokasi tujuan.",
    },
    {
      id: 3,
      icon: Banknote,
      title: "Harga Terjangkau",
      description:
        "Nikmati makanan lezat dengan harga bersahabat untuk semua kalangan.",
    },
    {
      id: 4,
      icon: ShieldCheck,
      title: "Pengemasan Rapi",
      description:
        "Setiap pesanan dikemas dengan aman agar tetap bersih, hangat, dan nyaman sampai tujuan.",
    },
  ];

  return (
    <section className="relative overflow-hidden bg-[#efe2cf] py-24">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_10%_10%,rgba(255,255,255,0.45),transparent_25%),radial-gradient(circle_at_90%_85%,rgba(255,179,102,0.25),transparent_22%)]" />
      <div className="container mx-auto px-6">
        <div className="mb-14 max-w-3xl">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-orange-700">
            Kenapa GMRH Kitchen
          </p>
          <h2 className="mt-4 text-4xl font-black text-slate-900 md:text-5xl">
            Dibuat untuk pengalaman makan yang lebih tenang, hangat, dan meyakinkan.
          </h2>
        </div>

        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          {features.map((item) => (
            <div
              key={item.id}
              className="group relative overflow-hidden rounded-[2rem] border border-white/70 bg-white/75 p-8 shadow-sm backdrop-blur transition duration-300 hover:-translate-y-1 hover:shadow-xl"
            >
              <div className="absolute right-0 top-0 h-24 w-24 rounded-full bg-orange-100/60 blur-2xl transition group-hover:bg-orange-200/80" />

              <div className="relative mb-8 flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-900 text-2xl shadow-sm transition group-hover:scale-105">
                <item.icon className="h-7 w-7 text-white" strokeWidth={2.2} />
              </div>

              <h3 className="relative text-xl font-semibold text-gray-900">
                {item.title}
              </h3>

              <p className="relative mt-4 text-sm leading-7 text-gray-600">
                {item.description}
              </p>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}
