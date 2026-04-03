"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BrandLogo } from "@/components/brand/logo";
import {
  ArrowLeft,
  LayoutDashboard,
  MessageSquareText,
  Package2,
  ShoppingBasket,
  Users,
} from "lucide-react";

export default function Sidebar() {
  const pathname = usePathname();

  const menu = [
    {
      name: "Dashboard",
      path: "/admin/dashboard",
      icon: LayoutDashboard,
    },
    {
      name: "Products",
      path: "/admin/products",
      icon: Package2,
    },
    {
      name: "Orders",
      path: "/admin/orders",
      icon: ShoppingBasket,
    },
    {
      name: "Customers",
      path: "/admin/customers",
      icon: Users,
    },
    {
      name: "Messages",
      path: "/admin/messages",
      icon: MessageSquareText,
    },
  ];

  return (
    <aside className="w-full border-b border-white/10 bg-[#1f1712] text-white lg:min-h-screen lg:w-80 lg:border-b-0 lg:border-r">
      <div className="sticky top-0 p-6">
        <div className="rounded-[2rem] border border-white/10 bg-white/5 p-5 backdrop-blur">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white shadow-sm">
              <BrandLogo
                size={38}
                className="h-9 w-9"
              />
            </div>
            <div>
              <p className="font-display text-3xl font-bold">GMRH Admin</p>
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#d9b894]">
                Kitchen control room
              </p>
            </div>
          </div>

          <div className="mt-6 grid gap-2">
            {menu.map((item) => (
              <Link
                key={item.path}
                href={item.path}
                className={`flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold transition ${
                  pathname === item.path
                    ? "bg-orange-500 text-white shadow-lg"
                    : "text-[#f7ecdf] hover:bg-white/10"
                }`}
              >
                <item.icon className="h-4 w-4" strokeWidth={2.2} />
                {item.name}
              </Link>
            ))}
          </div>

          <div className="mt-5 border-t border-white/10 pt-5">
            <Link
              href="/"
              className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-[#f7ecdf] transition hover:bg-white/10"
            >
              <ArrowLeft className="h-4 w-4" strokeWidth={2.2} />
              Keluar ke Homepage
            </Link>
          </div>
        </div>
      </div>
    </aside>
  );
}
