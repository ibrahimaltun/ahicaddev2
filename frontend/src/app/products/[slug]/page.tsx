import { notFound } from "next/navigation";

import { AddToCartButton } from "@/components/product/AddToCartButton";
import { getProduct } from "@/features/products/api";
import { getServerI18n } from "@/lib/i18n/server";

export const dynamic = "force-dynamic";

interface ProductPageProps {
    params: Promise<{
        slug: string;
    }>;
}

export default async function ProductPage({
    params,
}: ProductPageProps) {
    const { slug } = await params;
    const { t } = await getServerI18n();

    let product;

    try {
        product = await getProduct(slug);
    } catch {
        notFound();
    }

    const productJsonLd = {
        "@context": "https://schema.org",
        "@type": "Product",
        name: product.name,
        description: product.description || undefined,
        image: product.images.map((image) => image.image_url),
        sku: String(product.id),
        offers: {
            "@type": "Offer",
            price: product.price,
            priceCurrency: "TRY",
            availability:
                product.stock > 0
                    ? "https://schema.org/InStock"
                    : "https://schema.org/OutOfStock",
            url: `https://ahicadde.com/products/${product.slug}`,
        },
    };

    return (
        <main className="mx-auto max-w-7xl px-6 py-16 lg:px-8">
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{
                    __html: JSON.stringify(productJsonLd),
                }}
            />

            <div className="grid gap-12 lg:grid-cols-2">
                <div>
                    {product.images.length > 0 ? (
                        <div className="aspect-square overflow-hidden rounded-2xl border border-border bg-surface-2">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                                src={product.images[0].image_url}
                                alt={product.name}
                                className="h-full w-full object-cover"
                            />
                        </div>
                    ) : (
                        <div className="flex aspect-square items-center justify-center rounded-2xl border border-dashed border-border-strong bg-surface-2 text-foreground-subtle">
                            {t("products.noImage")}
                        </div>
                    )}
                </div>

                <div className="flex flex-col justify-center">
                    <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">
                        {t("products.eyebrow")}
                    </p>

                    <h1 className="mt-2 text-4xl font-semibold tracking-tight">
                        {product.name}
                    </h1>

                    <p className="mt-6 text-2xl font-semibold">
                        {product.price} ₺
                    </p>

                    {product.description && (
                        <p className="mt-6 leading-7 text-foreground-muted">
                            {product.description}
                        </p>
                    )}

                    <div className="mt-8">
                        {product.stock > 0 ? (
                            <p className="text-sm font-medium text-success-fg">
                                ✓ {t("products.inStock")}
                            </p>
                        ) : (
                            <p className="text-sm font-medium text-danger-fg">
                                ✕ {t("products.outOfStock")}
                            </p>
                        )}
                    </div>

                    <AddToCartButton
                        productId={product.id}
                        productName={product.name}
                        disabled={product.stock === 0}
                    />
                </div>
            </div>
        </main>
    );
}
