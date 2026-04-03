"use client";

import Sidebar from "@/components/admin/sidebar";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#f5ecdf] text-gray-900 lg:flex">
      <Sidebar />

      <div className="flex-1">
        <header className="border-b border-[#e5d7c8] bg-[#f7efe4]/85 px-6 py-5 backdrop-blur">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.26em] text-orange-700">
                Kitchen dashboard
              </p>
              <h1 className="font-display mt-2 text-4xl font-bold text-slate-900">
                GMRH Kitchen Admin
              </h1>
            </div>
          </div>
        </header>

        <main className="p-6 md:p-8">{children}</main>
      </div>
    </div>
  );
}
