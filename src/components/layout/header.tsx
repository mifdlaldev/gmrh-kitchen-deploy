"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { getUserRole } from "@/lib/supabase/profile";
import { useCart } from "@/context/cart-context";
import { BrandLogo } from "@/components/brand/logo";
import { LogIn, ShoppingBag } from "lucide-react";
import type { User as AuthUser } from "@supabase/supabase-js";
import { useEffect, useState } from "react";

export function Header() {
  const pathname = usePathname();
  const isSupabaseReady = hasSupabaseEnv();
  const [authUser, setAuthUser] = useState<AuthUser | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const { cart, isHydrated } = useCart();

  const totalItems = cart.reduce((acc, item) => acc + item.quantity, 0);

  useEffect(() => {
    const supabase = createClient();

    if (!supabase) {
      return;
    }

    const syncHeaderUser = async (nextUser: AuthUser | null) => {
      setAuthUser(nextUser);

      if (!nextUser) {
        setIsAdmin(false);
        return;
      }

      const role = await getUserRole(supabase, nextUser.id);
      setIsAdmin(role === "admin");
    };

    supabase.auth.getUser().then(({ data }) => {
      void syncHeaderUser(data.user);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      void syncHeaderUser(session?.user ?? null);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const handleLogout = async () => {
    const supabase = createClient();

    if (!supabase) {
      return;
    }

    await supabase.auth.signOut();
    window.location.href = "/";
  };

  const navLink = (href: string, label: string) => (
    <Link
      href={href}
      className={`rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
        pathname === href
          ? "bg-white text-orange-600 shadow-sm"
          : "text-slate-600 hover:text-orange-500"
      }`}
    >
      {label}
    </Link>
  );

  return (
    <header className="sticky top-0 z-50 border-b border-white/40 bg-[#f7efe4]/85 backdrop-blur-xl">
      <div className="container mx-auto px-4 py-3">
        <div className="surface-panel flex items-center justify-between rounded-[1.75rem] px-4 py-3 md:px-6">
          <Link href="/" className="flex items-center gap-3">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white shadow-sm">
              <BrandLogo
                size={38}
                priority
                className="h-9 w-9"
              />
            </span>
            <div>
              <p className="font-display text-2xl font-bold leading-none text-slate-900">
                GMRH Kitchen
              </p>
              <p className="mt-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500">
                Warm delivery kitchen
              </p>
            </div>
          </Link>

          <nav className="hidden items-center gap-2 rounded-full bg-[#f3e7d8] p-1.5 md:flex">
            {navLink("/", "Beranda")}
            {navLink("/menu", "Menu")}
            {authUser && navLink("/orders", "Pesanan")}
            {navLink("/contact", "Kontak")}
            {isAdmin && navLink("/admin/dashboard", "Dashboard")}
          </nav>

          <div className="flex items-center gap-3">
            <Link
              href="/cart"
              className="relative flex h-12 w-12 items-center justify-center rounded-2xl border border-[#ead8c3] bg-white text-slate-700 transition hover:-translate-y-0.5 hover:text-orange-500"
            >
              <ShoppingBag className="h-5 w-5" strokeWidth={2.2} />

              {isHydrated && totalItems > 0 && (
                <span className="absolute -right-1.5 -top-1.5 flex h-6 min-w-6 items-center justify-center rounded-full bg-orange-500 px-1.5 text-[11px] font-bold text-white">
                  {totalItems}
                </span>
              )}
            </Link>

            {isSupabaseReady && authUser ? (
              <button
                onClick={handleLogout}
                className="kitchen-primary-btn px-5 py-3 text-sm font-semibold"
              >
                Logout
              </button>
            ) : (
              <Link
                href={isSupabaseReady ? "/login" : "#"}
                aria-disabled={!isSupabaseReady}
                className={`rounded-2xl px-5 py-3 text-sm font-semibold ${
                  isSupabaseReady
                    ? "kitchen-primary-btn"
                    : "cursor-not-allowed bg-gray-400 text-white"
                }`}
              >
                <span className="inline-flex items-center gap-2">
                  <LogIn className="h-4 w-4" strokeWidth={2.2} />
                  Masuk
                </span>
              </Link>
            )}
          </div>
        </div>

        <nav className="mt-3 flex items-center justify-center gap-2 rounded-full bg-white/55 p-1.5 shadow-sm md:hidden">
          {navLink("/", "Beranda")}
          {navLink("/menu", "Menu")}
          {authUser && navLink("/orders", "Pesanan")}
          {navLink("/contact", "Kontak")}
          {isAdmin && navLink("/admin/dashboard", "Dashboard")}
        </nav>
      </div>
    </header>
  );
}
