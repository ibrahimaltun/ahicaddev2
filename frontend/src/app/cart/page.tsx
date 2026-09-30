"use client";

import Link from "next/link";

import { useCartStore } from "@/features/cart/store";

export default function CartPage() {
    const {
        items,
        removeItem,
        updateQuantity,
        clearCart,
    } = useCartStore();

    const total = items.reduce(
        (sum, item) =>
            sum + Number(item.price) * item.quantity,
        0,
    );

    if (items.length === 0) {
        return (
            <main className="mx-auto max-w-7xl px-6 py-16 lg:px-8">
                <p className="text-sm font-medium text-neutral-500">
                    Sepet
                </p>

                <h1 className="mt-2 text-4xl font-semibold tracking-tight">
                    Sepetim
                </h1>

                <div className="mt-12 rounded-2xl border border-neutral-200 p-8 text-center">
                    <p className="text-neutral-600">
                        Sepetiniz boş.
                    </p>

                    <Link
                        href="/products"
                        className="mt-6 inline-flex rounded-xl bg-neutral-950 px-5 py-3 text-sm font-medium text-white"
                    >
                        Alışverişe Devam Et
                    </Link>
                </div>
            </main>
        );
    }

    return (
        <main className="mx-auto max-w-7xl px-6 py-16 lg:px-8">
            <div className="flex items-end justify-between">
                <div>
                    <p className="text-sm font-medium text-neutral-500">
                        Sepet
                    </p>

                    <h1 className="mt-2 text-4xl font-semibold tracking-tight">
                        Sepetim
                    </h1>
                </div>

                <button
                    type="button"
                    onClick={clearCart}
                    className="text-sm text-red-600 hover:text-red-700"
                >
                    Sepeti Temizle
                </button>
            </div>

            <div className="mt-12 grid gap-10 lg:grid-cols-[1fr_360px]">
                <div className="space-y-4">
                    {items.map((item) => (
                        <div
                            key={item.productId}
                            className="flex gap-5 rounded-2xl border border-neutral-200 p-5"
                        >
                            <div className="h-28 w-28 shrink-0 overflow-hidden rounded-xl bg-neutral-100">
                                {item.imageUrl ? (
                                    <img
                                        src={item.imageUrl}
                                        alt={item.name}
                                        className="h-full w-full object-cover"
                                    />
                                ) : (
                                    <div className="flex h-full items-center justify-center text-xs text-neutral-400">
                                        Görsel yok
                                    </div>
                                )}
                            </div>

                            <div className="flex flex-1 flex-col justify-between">
                                <div>
                                    <Link
                                        href={`/products/${item.slug}`}
                                        className="font-medium hover:underline"
                                    >
                                        {item.name}
                                    </Link>

                                    <p className="mt-2 text-sm text-neutral-500">
                                        {item.price} ₺
                                    </p>
                                </div>

                                <div className="flex items-center gap-4">
                                    <select
                                        value={item.quantity}
                                        onChange={(event) =>
                                            updateQuantity(
                                                item.productId,
                                                Number(
                                                    event.target.value,
                                                ),
                                            )
                                        }
                                        className="rounded-lg border border-neutral-300 px-3 py-2 text-sm"
                                        aria-label={`${item.name
                                            } ürün adedi`}
                                    >
                                        {[1, 2, 3, 4, 5].map(
                                            (quantity) => (
                                                <option
                                                    key={quantity}
                                                    value={quantity}
                                                >
                                                    {quantity}
                                                </option>
                                            ),
                                        )}
                                    </select>

                                    <button
                                        type="button"
                                        onClick={() =>
                                            removeItem(
                                                item.productId,
                                            )
                                        }
                                        className="text-sm text-red-600 hover:text-red-700"
                                    >
                                        Kaldır
                                    </button>
                                </div>
                            </div>

                            <p className="font-semibold">
                                {(
                                    Number(item.price) *
                                    item.quantity
                                ).toFixed(2)}{" "}
                                ₺
                            </p>
                        </div>
                    ))}
                </div>

                <aside className="h-fit rounded-2xl border border-neutral-200 p-6">
                    <h2 className="text-lg font-semibold">
                        Sipariş Özeti
                    </h2>

                    <div className="mt-6 flex justify-between text-sm">
                        <span className="text-neutral-500">
                            Ara Toplam
                        </span>

                        <span>
                            {total.toFixed(2)} ₺
                        </span>
                    </div>

                    <div className="mt-4 flex justify-between border-t border-neutral-200 pt-4 text-lg font-semibold">
                        <span>Toplam</span>

                        <span>
                            {total.toFixed(2)} ₺
                        </span>
                    </div>

                    <button
                        type="button"
                        className="mt-6 w-full rounded-xl bg-neutral-950 px-5 py-3 text-sm font-medium text-white hover:bg-neutral-800"
                    >
                        Ödeme Adımına Geç
                    </button>
                </aside>
            </div>
        </main>
    );
}