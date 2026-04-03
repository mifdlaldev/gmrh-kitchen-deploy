import { Hero } from "@/components/home/hero";
import { MenuPreview } from "@/components/home/menu-preview";
import { Features } from "@/components/home/features";

export default function HomePage() {
  return (
    <main className="bg-[#f6ecdf]">
      <Hero />
      <MenuPreview />
      <Features />
    </main>
  );
}
