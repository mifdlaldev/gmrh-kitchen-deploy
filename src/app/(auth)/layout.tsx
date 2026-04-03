export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[#f4eadc]">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,210,144,0.45),transparent_24%),radial-gradient(circle_at_bottom_right,rgba(255,153,89,0.25),transparent_18%),linear-gradient(180deg,rgba(255,255,255,0.5),transparent_35%)]" />
      <div className="absolute inset-0 soft-grid opacity-30" />

      <div className="relative mx-auto grid min-h-screen max-w-7xl items-center gap-10 px-4 py-8 lg:grid-cols-[1fr_0.9fr] lg:px-8">
        <div className="hidden lg:block">
          <div className="max-w-2xl">
            <div className="kitchen-badge">Kitchen account access</div>
            <h1 className="font-display mt-8 text-6xl font-bold leading-[0.9] text-slate-900">
              Satu akun untuk
              <span className="block text-orange-600"> dapur, pesanan, dan momen hangat.</span>
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-8 text-slate-600">
              Masuk atau buat akun untuk menikmati pengalaman pesan makanan yang
              lebih rapi, cepat, dan terasa dekat dengan kitchen Anda sendiri.
            </p>

            <div className="mt-10 grid gap-4 sm:grid-cols-2">
              <div className="surface-panel rounded-[2rem] p-6">
                <p className="text-xs font-bold uppercase tracking-[0.24em] text-orange-700">
                  Warm service
                </p>
                <p className="mt-4 text-xl font-semibold text-slate-900">
                  Didesain untuk pelanggan yang ingin cepat pesan tanpa ribet.
                </p>
              </div>

              <div className="rounded-[2rem] bg-slate-900 p-6 text-white shadow-xl">
                <p className="text-xs font-bold uppercase tracking-[0.24em] text-orange-200">
                  GMRH promise
                </p>
                <p className="mt-4 text-xl font-semibold">
                  Rasa rumahan, visual rapi, dan akses akun yang terasa premium.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-center lg:justify-end">{children}</div>
      </div>
    </div>
  );
}
