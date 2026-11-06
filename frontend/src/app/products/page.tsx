import Link from "next/link";

import { ProductCard } from "@/components/product/ProductCard";
import { getProducts } from "@/features/products/api";
import { jsonLdHtml } from "@/lib/json-ld";
import { getServerI18n } from "@/lib/i18n/server";

import type { Metadata } from "next";

export const dynamic = "force-dynamic";

interface ProductsPageProps {
    searchParams: Promise<{
        category?: string;
        q?: string;
    }>;
}

export async function generateMetadata({
    searchParams,
}: ProductsPageProps): Promise<Metadata> {
    const { category, q } = await searchParams;

    if (q) {
        return {
            title: `"${q}" için arama sonuçları`,
            robots: { index: false, follow: true },
        };
    }

    return {
        title: category ? "Kategori Ürünleri" : "Tüm Ürünler",
        description:
            "Ahicadde satıcılarının ürünlerini keşfedin; kategorilere göz atın, güvenle alışveriş yapın.",
        alternates: {
            canonical: category
                ? `/products?category=${encodeURIComponent(category)}`
                : "/products",
        },
    };
}

export default async function ProductsPage({
    searchParams,
}: ProductsPageProps) {
    const { category, q } = await searchParams;
    const { t } = await getServerI18n();

    const products = await getProducts({
        page: 1,
        limit: 20,
        category,
        q,
    }).catch(() => []);

    const itemListJsonLd = {
        "@context": "https://schema.org",
        "@type": "ItemList",
        name: category
            ? `Ahicadde ${category} ürünleri`
            : q
                ? `"${q}" arama sonuçları`
                : "Ahicadde tüm ürünler",
        numberOfItems: products.length,
        itemListElement: products.map((product, index) => ({
            "@type": "ListItem",
            position: index + 1,
            url: `https://ahicadde.com/products/${product.slug}`,
            name: product.name,
        })),
    };

    return (
        <main className="mx-auto max-w-7xl px-6 py-16 lg:px-8">
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: jsonLdHtml(itemListJsonLd) }}
            />

            <div>
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">
                    {t("products.label")}
                </p>

                <h1 className="mt-2 text-4xl font-semibold tracking-tight">
                    {q
                        ? t("products.searchTitle", { query: q })
                        : category
                            ? t("products.categoryTitle")
                            : t("products.allTitle")}
                </h1>

                <p className="mt-4 max-w-2xl text-foreground-muted">
                    {t("products.description")}
                </p>

                {(category || q) && (
                    <div className="mt-4 flex flex-wrap gap-3">
                        {category && (
                            <Link
                                href="/products"
                                className="inline-flex rounded-full border border-border bg-surface px-4 py-2 text-sm font-medium text-foreground transition hover:bg-surface-2"
                            >
                                {t("products.clearFilter")}
                            </Link>
                        )}

                        {q && (
                            <Link
                                href="/products"
                                className="inline-flex rounded-full border border-border bg-surface px-4 py-2 text-sm font-medium text-foreground transition hover:bg-surface-2"
                            >
                                ✕ {q}
                            </Link>
                        )}
                    </div>
                )}
            </div>

            {products.length === 0 ? (
                <div className="mt-12 rounded-2xl border border-dashed border-border-strong bg-surface p-10 text-center">
                    <p className="text-foreground-muted">
                        {t("products.noProducts")}
                    </p>
                </div>
            ) : (
                <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                    {products.map((product) => (
                        <ProductCard
                            key={product.id}
                            product={product}
                            viewDetailsText={t("home.shopNow")}
                            outOfStockText={t("products.outOfStock")}
                            noImageText={t("products.noImage")}
                            sampleBadgeText={t("products.sampleBadge")}
                        />
                    ))}
                </div>
            )}
        </main>
    );
}
