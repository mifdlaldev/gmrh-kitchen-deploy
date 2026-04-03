import Image from "next/image";
import { cn } from "@/lib/utils";

type BrandLogoProps = {
  className?: string;
  imageClassName?: string;
  size?: number;
  priority?: boolean;
  alt?: string;
};

export function BrandLogo({
  className,
  imageClassName,
  size = 48,
  priority = false,
  alt = "GMRH Kitchen logo",
}: BrandLogoProps) {
  return (
    <span
      className={cn(
        "relative inline-flex shrink-0 items-center justify-center overflow-hidden",
        className
      )}
      style={{
        width: size,
        height: size,
      }}
    >
      <Image
        src="/logo-gmrh-kitchen.svg"
        alt={alt}
        fill
        priority={priority}
        className={cn("object-contain", imageClassName)}
        sizes={`${size}px`}
      />
    </span>
  );
}
