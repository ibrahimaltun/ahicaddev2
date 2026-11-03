"use client";

import Link from "next/link";

import { useAuth } from "@/features/auth/hooks/useAuth";
import { useCart } from "@/features/cart/CartProvider";

export default function CartPage() {
    const {
        user,
        loading: authLoading,
        isAuthenticated,
    } = useAuth();

    const {
        items,
        isLoading,
        error,
        updateItem,
        removeItem,
        clear,
    } = useCart();

    if (authLoading || isLoading) {
        return (
            <main className="mx-auto max-w-7xl px-6 py-20 lg:px-8">
                <p className="text-neutral-600">
                    Sepetiniz yükleniyor...
                </p>
            </main>
        );
    }

    if (!isAuthenticated || !user) {
        return (
            <main className="mx-auto max-w-7xl px-6 py-20 lg:px-8">
                <h1 className="text-3xl font-semibold">
                    Sepetiniz için giriş yapın
                </h1>

                <p className="mt-3 text-neutral-600">
                    Sepetinizde ürün görebilmek ve alışverişe
                    devam edebilmek için giriş yapmanız gerekiyor.
                </p>

                <Link
                    href="/login"
                    className="mt-6 inline-flex rounded-full border border-neutral-200 px-4 py-2 text-sm font-medium text-neutral-700 transition hover:bg-neutral-100"
                >
                    Giriş Yap
                </Link>
            </main>
        );
    }

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
                        className="mt-6 inline-flex rounded-xl bg-neutral-950 px-5 py-3 text-sm font-medium text-white hover:bg-neutral-800"
                    >
                        Alışverişe Devam Et
                    </Link>
                </div>
            </main>
        );
    }

    const total = items.reduce(
        (sum, item) =>
            sum + Number(item.product.price) * item.quantity,
        0,
    );

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
                    onClick={() => {
                        clear().catch(() => {});
                    }}
                    className="text-sm text-red-600 hover:text-red-700"
                >
                    Sepeti Temizle
                </button>
            </div>

            {error && (
                <p
                    role="alert"
                    className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
                >
                    {error}
                </p>
            )}

            <div className="mt-12 grid gap-10 lg:grid-cols-[1fr_360px]">
                <div className="space-y-4">
                    {items.map((item) => {
                        const maxQuantity = Math.max(
                            1,
                            Math.min(5, item.product.stock),
                        );

                        return (
                            <div
                                key={item.id}
                                className="flex gap-5 rounded-2xl border border-neutral-200 p-5"
                            >
                                <div className="h-28 w-28 shrink-0 overflow-hidden rounded-xl bg-neutral-100">
                                    {item.product.image_url ? (
                                        <img
                                            src={item.product.image_url}
                                            alt={item.product.name}
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
                                            href={`/products/${item.product.slug}`}
                                            className="font-medium hover:text-neutral-600"
                                        >
                                            {item.product.name}
                                        </Link>

                                        <p className="mt-1 text-sm text-neutral-500">
                                            {item.product.price} ₺
                                        </p>
                                    </div>

                                    <div className="mt-3 flex items-center gap-4">
                                        <select
                                            value={item.quantity}
                                            onChange={(event) => {
                                                updateItem(
                                                    item.id,
                                                    Number(
                                                        event.target.value,
                                                    ),
                                                ).catch(() => {});
                                            }}
                                            className="rounded-lg border border-neutral-300 px-3 py-2 text-sm"
                                            aria-label={`${item.product.name} ürün adedi`}
                                        >
                                            {Array.from(
                                                { length: maxQuantity },
                                                (_, index) => index + 1,
                                            ).map((quantity) => (
                                                <option
                                                    key={quantity}
                                                    value={quantity}
                                                >
                                                    {quantity}
                                                </option>
                                            ))}
                                        </select>

                                        <button
                                            type="button"
                                            onClick={() => {
                                                removeItem(item.id).catch(
                                                    () => {},
                                                );
                                            }}
                                            className="text-sm text-red-600 hover:text-red-700"
                                        >
                                            Kaldır
                                        </button>
                                    </div>
                                </div>

                                <p className="font-semibold">
                                    {(
                                        Number(item.product.price) *
                                        item.quantity
                                    ).toFixed(2)}{" "}
                                    ₺
                                </p>
                            </div>
                        );
                    })}
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

                    <Link
                        href="/checkout"
                        className="mt-6 block w-full rounded-xl bg-neutral-950 px-5 py-3 text-center text-sm font-medium text-white hover:bg-neutral-800"
                    >
                        Ödeme Adımına Geç
                    </Link>
                </aside>
            </div>
        </main>
    );
}
