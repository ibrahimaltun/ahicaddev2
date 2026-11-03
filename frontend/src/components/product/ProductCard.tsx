import Link from "next/link";

import type { Product } from "@/features/products/types";

interface ProductCardProps {
    product: Product;
    viewDetailsText: string;
    outOfStockText: string;
    noImageText: string;
}

export function ProductCard({
    product,
    viewDetailsText,
    outOfStockText,
    noImageText,
}: ProductCardProps) {
    const image = product.images[0]?.image_url;

    return (
        <Link
            href={`/products/${product.slug}`}
            className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-surface transition hover:border-primary hover:shadow-md"
        >
            <div className="aspect-square overflow-hidden bg-surface-2">
                {image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                        src={image}
                        alt={product.name}
                        loading="lazy"
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                ) : (
                    <div className="flex h-full items-center justify-center text-sm text-foreground-subtle">
                        {noImageText}
                    </div>
                )}
            </div>

            <div className="flex flex-1 flex-col p-4">
                <h2 className="font-medium leading-6 text-foreground">
                    {product.name}
                </h2>

                <p className="mt-2 text-lg font-semibold text-foreground">
                    {product.price} ₺
                </p>

                <span
                    className={`mt-4 w-fit rounded-full px-3 py-1.5 text-xs font-semibold ${
                        product.stock > 0
                            ? "bg-primary-soft text-primary-soft-foreground"
                            : "bg-surface-2 text-foreground-subtle"
                    }`}
                >
                    {product.stock > 0 ? viewDetailsText : outOfStockText}
                </span>
            </div>
        </Link>
    );
}
