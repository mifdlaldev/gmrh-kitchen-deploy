"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { Footer, Header } from "@/components/layout";
import { CartProvider } from "@/context/cart-context";

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  const isAuthPage =
    pathname.startsWith("/login") || pathname.startsWith("/register");
  const isAdminPage = pathname.startsWith("/admin");
  const hideLayout = isAuthPage || isAdminPage;

  return (
    <CartProvider>
      {!hideLayout && <Header />}
      {children}
      {!hideLayout && <Footer />}
    </CartProvider>
  );
}
