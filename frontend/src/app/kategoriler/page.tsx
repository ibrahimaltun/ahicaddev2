import type { Metadata } from "next";
import Link from "next/link";

import { getCategories } from "@/features/categories/api";
import { getServerI18n } from "@/lib/i18n/server";

export const metadata: Metadata = {
    title: "Kategoriler | Ahicadde",
    alternates: {
        canonical: "https://ahicadde.com/kategoriler",
    },
};

export const dynamic = "force-dynamic";

export default async function CategoriesPage() {
    const { t } = await getServerI18n();
    const categories = await getCategories().catch(() => []);

    return (
        <main className="mx-auto max-w-7xl px-6 py-16 lg:px-8">
            <div>
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">
                    {t("categories.label")}
                </p>

                <h1 className="mt-2 text-4xl font-semibold tracking-tight">
                    {t("categories.title")}
                </h1>

                <p className="mt-4 max-w-2xl text-foreground-muted">
                    {t("categories.description")}
                </p>
            </div>

            {categories.length === 0 ? (
                <div className="mt-12 rounded-2xl border border-dashed border-border-strong bg-surface p-10 text-center">
                    <p className="text-foreground-muted">
                        {t("categories.empty")}
                    </p>
                </div>
            ) : (
                <ul className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {categories.map((category) => (
                        <li key={category.id}>
                            <Link
                                href={`/products?category=${encodeURIComponent(
                                    category.slug,
                                )}`}
                                className="block rounded-2xl border border-border bg-surface p-6 transition hover:border-primary"
                            >
                                <h2 className="text-lg font-semibold">
                                    {category.name}
                                </h2>

                                <p className="mt-2 text-sm text-primary">
                                    {t("categories.viewProducts")} →
                                </p>
                            </Link>
                        </li>
                    ))}
                </ul>
            )}
        </main>
    );
}
