import Link from "next/link";

import { ProductCard } from "@/components/product/ProductCard";
import { getProducts } from "@/features/products/api";
import { getServerI18n } from "@/lib/i18n/server";

export const dynamic = "force-dynamic";

interface ProductsPageProps {
    searchParams: Promise<{
        category?: string;
    }>;
}

export default async function ProductsPage({
    searchParams,
}: ProductsPageProps) {
    const { category } = await searchParams;
    const { t } = await getServerI18n();

    const products = await getProducts({
        page: 1,
        limit: 20,
        category,
    }).catch(() => []);

    return (
        <main className="mx-auto max-w-7xl px-6 py-16 lg:px-8">
            <div>
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">
                    {t("products.label")}
                </p>

                <h1 className="mt-2 text-4xl font-semibold tracking-tight">
                    {category
                        ? t("products.categoryTitle")
                        : t("products.allTitle")}
                </h1>

                <p className="mt-4 max-w-2xl text-foreground-muted">
                    {t("products.description")}
                </p>

                {category && (
                    <Link
                        href="/products"
                        className="mt-4 inline-flex rounded-full border border-border bg-surface px-4 py-2 text-sm font-medium text-foreground transition hover:bg-surface-2"
                    >
                        {t("products.clearFilter")}
                    </Link>
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
                        />
                    ))}
                </div>
            )}
        </main>
    );
}
