import type { Metadata } from "next";
import "./globals.css";
import { AppShell } from "@/components/layout/app-shell";

export const metadata: Metadata = {
  title: {
    default: "GMRH Kitchen | Warm Delivery Kitchen",
    template: "%s | GMRH Kitchen",
  },
  description:
    "GMRH Kitchen menghadirkan menu rumahan hangat dengan layanan delivery yang cepat, rapi, dan nyaman untuk setiap momen makan Anda.",
  applicationName: "GMRH Kitchen",
  keywords: [
    "GMRH Kitchen",
    "food delivery",
    "kitchen delivery",
    "makanan rumahan",
    "delivery makanan",
  ],
  icons: {
    icon: "/logo-gmrh-kitchen.svg",
    shortcut: "/logo-gmrh-kitchen.svg",
    apple: "/logo-gmrh-kitchen.svg",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id">
      <body>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
