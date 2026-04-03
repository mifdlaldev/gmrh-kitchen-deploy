import { Clock3, Mail, MapPin, Phone, Sparkles } from "lucide-react";
import { ContactForm } from "@/components/contact/contact-form";

export default function ContactPage() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[#f6ecdf] py-16">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,214,153,0.32),transparent_24%),radial-gradient(circle_at_bottom_right,rgba(255,174,102,0.18),transparent_22%)]" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6">
        <div className="mb-14 text-center">
          <div className="kitchen-badge">
            <Sparkles className="h-4 w-4" strokeWidth={2.2} />
            Contact kitchen
          </div>
          <h1 className="font-display mt-6 text-5xl font-bold leading-[0.95] text-slate-900 md:text-6xl">
            Hubungi dapur kami dengan cara yang terasa lebih hangat.
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-lg leading-8 text-slate-600">
            Untuk pertanyaan, pemesanan, atau kebutuhan khusus, kirimkan pesan
            Anda dan admin kami akan melihatnya langsung dari dashboard.
          </p>
        </div>

        <div className="grid gap-8 xl:grid-cols-[0.92fr_1.08fr]">
          <div className="space-y-6">
            <div className="surface-panel rounded-[2rem] p-8">
              <h2 className="font-display text-4xl font-bold text-slate-900">
                Informasi Kontak
              </h2>
              <p className="mt-3 max-w-lg text-sm leading-7 text-slate-600">
                Kami membuka jalur komunikasi yang sederhana dan cepat supaya
                kebutuhan pelanggan tidak tertahan.
              </p>

              <div className="mt-8 space-y-4">
                {[
                  {
                    icon: MapPin,
                    title: "Alamat kitchen",
                    value: "Sumedang, Jawa Barat",
                  },
                  {
                    icon: Phone,
                    title: "Nomor telepon",
                    value: "+62 812-3456-7890",
                  },
                  {
                    icon: Mail,
                    title: "Alamat email",
                    value: "support@gmrhkitchen.id",
                  },
                  {
                    icon: Clock3,
                    title: "Jam operasional",
                    value: "Senin - Minggu • 08:30 - 18:00 WIB",
                  },
                ].map((item) => (
                  <div
                    key={item.title}
                    className="rounded-[1.4rem] border border-[#ecdccc] bg-white/80 p-5"
                  >
                    <div className="flex items-start gap-4">
                      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-900 text-white">
                        <item.icon className="h-5 w-5" strokeWidth={2.2} />
                      </div>
                      <div>
                        <p className="text-xs font-bold uppercase tracking-[0.22em] text-slate-400">
                          {item.title}
                        </p>
                        <p className="mt-2 text-base font-semibold text-slate-900">
                          {item.value}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-[2rem] bg-slate-900 p-8 text-white shadow-xl">
              <p className="text-xs font-bold uppercase tracking-[0.24em] text-orange-200">
                Tentang kitchen
              </p>
              <p className="mt-5 text-lg leading-8 text-[#f4e5d7]">
                Marketplace food delivery rumahan dengan menu ringan hingga
                hidangan utama yang dibuat lebih rapi, lebih modern, dan tetap
                dekat dengan selera lokal.
              </p>
            </div>
          </div>

          <div className="surface-panel rounded-[2rem] p-6 md:p-8">
            <h2 className="font-display text-4xl font-bold text-slate-900">
              Kirim Pesan
            </h2>
            <p className="mt-3 text-sm leading-7 text-slate-600">
              Isi detail singkat Anda, lalu pesan akan langsung masuk ke panel
              admin.
            </p>
            <div className="mt-8">
              <ContactForm />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
