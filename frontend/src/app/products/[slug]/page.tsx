import { notFound } from "next/navigation";

import { AddToCartButton } from "@/components/product/AddToCartButton";
import { ProductCard } from "@/components/product/ProductCard";
import { getProduct, getRelatedProducts } from "@/features/products/api";
import { getServerI18n } from "@/lib/i18n/server";

import type { Metadata } from "next";

export const dynamic = "force-dynamic";

interface ProductPageProps {
    params: Promise<{
        slug: string;
    }>;
}

export async function generateMetadata({
    params,
}: ProductPageProps): Promise<Metadata> {
    const { slug } = await params;

    let product;

    try {
        product = await getProduct(slug);
    } catch {
        return {
            title: "Ürün bulunamadı",
            robots: { index: false, follow: false },
        };
    }

    const description =
        product.description?.slice(0, 300) ||
        "Ahicadde'de güvenle alışveriş yapın.";

    const imageUrl = product.images[0]?.image_url;

    return {
        title: product.name,
        description,
        alternates: {
            canonical: `/products/${product.slug}`,
        },
        openGraph: {
            type: "website",
            title: product.name,
            description,
            url: `https://ahicadde.com/products/${product.slug}`,
            ...(imageUrl ? { images: [{ url: imageUrl }] } : {}),
        },
        twitter: {
            card: "summary_large_image",
            title: product.name,
            description,
        },
        other: {
            "product:price:amount": String(product.price),
            "product:price:currency": "TRY",
        },
    };
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

    const relatedProducts = await getRelatedProducts(slug, 4).catch(() => []);

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
            itemCondition: "https://schema.org/NewCondition",
            availability:
                product.stock > 0
                    ? "https://schema.org/InStock"
                    : "https://schema.org/OutOfStock",
            url: `https://ahicadde.com/products/${product.slug}`,
            seller: {
                "@type": "Organization",
                name: "Ahicadde",
                url: "https://ahicadde.com",
            },
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
                        <div className="relative aspect-square overflow-hidden rounded-2xl border border-border bg-surface-2">
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

                    {product.is_sample && (
                        <div
                            role="note"
                            className="mt-8 rounded-xl border border-warning-border bg-warning-bg px-4 py-3 text-sm text-warning-fg"
                        >
                            ⚠ {t("products.sampleWarning")}
                        </div>
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

            {relatedProducts.length > 0 && (
                <section className="mt-20 border-t border-border pt-14">
                    <div>
                        <h2 className="text-3xl font-semibold tracking-tight">
                            {t("products.relatedTitle")}
                        </h2>

                        <p className="mt-2 text-foreground-muted">
                            {t("products.relatedDescription")}
                        </p>
                    </div>

                    <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                        {relatedProducts.map((related) => (
                            <ProductCard
                                key={related.id}
                                product={related}
                                viewDetailsText={t("home.shopNow")}
                                outOfStockText={t("products.outOfStock")}
                                noImageText={t("products.noImage")}
                                sampleBadgeText={t("products.sampleBadge")}
                            />
                        ))}
                    </div>
                </section>
            )}
        </main>
    );
}
