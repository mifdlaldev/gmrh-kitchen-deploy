import * as React from "react";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { BrandLogo } from "@/components/brand/logo";

type CardProps = React.HTMLAttributes<HTMLDivElement>; 

const Card = React.forwardRef<HTMLDivElement, CardProps>(
    ({ className, ...props }, ref) => (
        <div
            ref={ref}
            className={cn(
                "rounded-xl border border-gray-200 bg-white shadow-sm transition-shadow hover:shadow-md",
                className
            )}
            {...props}
        />
    )
);
Card.displayName = "Card";

const CardHeader = React.forwardRef<
    HTMLDivElement,
    React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
    <div ref={ref} className={cn("p-4", className)} {...props} />
));
CardHeader.displayName = "CardHeader";

const CardContent = React.forwardRef<
    HTMLDivElement,
    React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
    <div ref={ref} className={cn("p-4 pt-0", className)} {...props} />
));
CardContent.displayName = "CardContent";

const CardFooter = React.forwardRef<
    HTMLDivElement,
    React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
    <div
        ref={ref}
        className={cn("flex items-center p-4 pt-0", className)}
        {...props}
    />
));
CardFooter.displayName = "CardFooter";

// Product Card specific component
interface ProductCardProps {
    name: string;
    description?: string | null;
    price: number;
    imageUrl?: string | null;
    storeName?: string;
    isAvailable?: boolean;
    onClick?: () => void;
}

const ProductCard: React.FC<ProductCardProps> = ({
    name,
    description,
    price,
    imageUrl,
    storeName,
    isAvailable = true,
    onClick,
}) => {
    const formatPrice = (amount: number) => {
        return new Intl.NumberFormat("id-ID", {
            style: "currency",
            currency: "IDR",
            minimumFractionDigits: 0,
        }).format(amount);
    };

    return (
        <Card
            className={cn(
                "cursor-pointer overflow-hidden",
                !isAvailable && "opacity-60"
            )}
            onClick={onClick}
        >
            <div className="relative aspect-square w-full overflow-hidden">
                {imageUrl ? (
                    <Image
                        src={imageUrl}
                        alt={name}
                        fill
                        className="object-cover transition-transform hover:scale-105"
                    />
                ) : (
                    <div className="flex h-full w-full items-center justify-center bg-gray-100">
                        <BrandLogo
                            size={40}
                            className="h-10 w-10"
                        />
                    </div>
                )}
                {!isAvailable && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                        <span className="rounded-full bg-white px-3 py-1 text-sm font-medium text-gray-900">
                            Stok Habis
                        </span>
                    </div>
                )}
            </div>
            <CardContent className="p-3">
                {storeName && (
                    <p className="mb-1 text-xs text-gray-500">{storeName}</p>
                )}
                <h3 className="font-medium text-gray-900 line-clamp-1">{name}</h3>
                {description && (
                    <p className="mt-1 text-sm text-gray-500 line-clamp-2">
                        {description}
                    </p>
                )}
                <p className="mt-2 font-semibold text-orange-500">
                    {formatPrice(price)}
                </p>
            </CardContent>
        </Card>
    );
};

export { Card, CardHeader, CardContent, CardFooter, ProductCard };
