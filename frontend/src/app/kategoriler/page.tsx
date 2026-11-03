import type { Metadata } from "next";
import Link from "next/link";

import { getCategories } from "@/features/categories/api";

export const metadata: Metadata = {
    title: "Kategoriler | Ahicadde",
    description:
        "Ahicadde'deki tüm ürün kategorilerini keşfedin. Gıda, tekstil, el sanatları ve daha fazlası.",
    alternates: {
        canonical: "https://ahicadde.com/kategoriler",
    },
};

export const dynamic = "force-dynamic";

export default async function CategoriesPage() {
    const categories = await getCategories();

    return (
        <main className="mx-auto max-w-7xl px-6 py-16 lg:px-8">
            <div>
                <p className="text-sm font-medium text-neutral-500">
                    Kategoriler
                </p>

                <h1 className="mt-2 text-4xl font-semibold tracking-tight">
                    Tüm Kategoriler
                </h1>

                <p className="mt-4 max-w-2xl text-neutral-600">
                    Ahicadde satıcılarının ürünlerini kategorilere göz atarak
                    keşfedin.
                </p>
            </div>

            {categories.length === 0 ? (
                <div className="mt-12 rounded-2xl border border-neutral-200 p-8 text-center">
                    <p className="text-neutral-600">
                        Henüz bir kategori oluşturulmadı.
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
                                className="block rounded-2xl border border-neutral-200 p-6 transition hover:border-neutral-400"
                            >
                                <h2 className="text-lg font-semibold">
                                    {category.name}
                                </h2>

                                <p className="mt-2 text-sm text-neutral-500">
                                    Ürünleri görüntüle
                                </p>
                            </Link>
                        </li>
                    ))}
                </ul>
            )}
        </main>
    );
}
