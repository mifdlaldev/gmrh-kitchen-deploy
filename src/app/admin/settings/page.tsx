"use client";

export default function AdminSettingsPage() {
  return (
    <section className="space-y-6">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.24em] text-orange-700">
          Settings
        </p>
        <h1 className="font-display mt-2 text-4xl font-bold text-slate-900">
          Pengaturan admin
        </h1>
      </div>

      <div className="surface-panel rounded-[2rem] p-8">
        <p className="text-lg font-semibold text-slate-900">
          Halaman pengaturan masih dalam proses pengembangan.
        </p>
        <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600">
          Shell dan tampilannya sudah saya samakan dengan area admin lainnya supaya saat fitur pengaturan ditambahkan, tampilannya tetap konsisten.
        </p>
      </div>
    </section>
  );
}
