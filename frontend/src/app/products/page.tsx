import Link from "next/link";

import { getProducts } from "@/features/products/api";

export default async function ProductsPage() {
    const products = await getProducts({
        page: 1,
        limit: 20,
    });

    return (
        <main className="mx-auto max-w-7xl px-6 py-16 lg:px-8">
            <div>
                <p className="text-sm font-medium text-neutral-500">
                    Products
                </p>

                <h1 className="mt-2 text-4xl font-semibold tracking-tight">
                    All Products
                </h1>

                <p className="mt-4 max-w-2xl text-neutral-600">
                    Discover products from Ahicadde sellers.
                </p>
            </div>

            {products.length === 0 ? (
                <div className="mt-12 rounded-2xl border border-neutral-200 p-8 text-center">
                    <p className="text-neutral-600">
                        No products found.
                    </p>
                </div>
            ) : (
                <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                    {products.map((product) => (
                        <Link
                            key={product.id}
                            href={`/products/${product.slug}`}
                            className="group rounded-2xl border border-neutral-200 p-4 transition hover:border-neutral-400"
                        >
                            <div className="aspect-square overflow-hidden rounded-xl bg-neutral-100">
                                {product.images.length > 0 ? (
                                    <img
                                        src={product.images[0].image_url}
                                        alt={product.name}
                                        className="h-full w-full object-cover transition group-hover:scale-105"
                                    />
                                ) : (
                                    <div className="flex h-full items-center justify-center text-sm text-neutral-400">
                                        No image
                                    </div>
                                )}
                            </div>

                            <h2 className="mt-4 font-medium">
                                {product.name}
                            </h2>

                            <p className="mt-2 text-lg font-semibold">
                                {product.price} ₺
                            </p>
                        </Link>
                    ))}
                </div>
            )}
        </main>
    );
}