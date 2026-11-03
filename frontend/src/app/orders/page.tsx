"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { useAuth } from "@/features/auth/hooks/useAuth";
import { getOrders } from "@/features/orders/api";
import {
    ORDER_STATUS_CLASSES,
    ORDER_STATUS_LABELS,
    type Order,
} from "@/features/orders/types";

export default function OrdersPage() {
    const {
        loading: authLoading,
        isAuthenticated,
    } = useAuth();

    const [orders, setOrders] = useState<Order[] | null>(
        null,
    );
    const [error, setError] = useState<string | null>(
        null,
    );

    useEffect(() => {
        if (authLoading || !isAuthenticated) {
            return;
        }

        let cancelled = false;

        (async () => {
            try {
                const data = await getOrders();

                if (!cancelled) {
                    setOrders(data);
                }
            } catch {
                if (!cancelled) {
                    setError(
                        "Siparişleriniz yüklenirken bir hata oluştu.",
                    );
                }
            }
        })();

        return () => {
            cancelled = true;
        };
    }, [authLoading, isAuthenticated]);

    if (authLoading || (!error && orders === null)) {
        return (
            <main className="mx-auto max-w-7xl px-6 py-20 lg:px-8">
                <p className="text-neutral-600">
                    Siparişleriniz yükleniyor...
                </p>
            </main>
        );
    }

    if (!isAuthenticated) {
        return (
            <main className="mx-auto max-w-7xl px-6 py-20 lg:px-8">
                <h1 className="text-3xl font-semibold">
                    Siparişleriniz için giriş yapın
                </h1>

                <p className="mt-3 text-neutral-600">
                    Sipariş geçmişinizi görüntülemek için giriş
                    yapmanız gerekiyor.
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

    return (
        <main className="mx-auto max-w-7xl px-6 py-16 lg:px-8">
            <p className="text-sm font-medium text-neutral-500">
                Hesabım
            </p>

            <h1 className="mt-2 text-4xl font-semibold tracking-tight">
                Siparişlerim
            </h1>

            {error && (
                <p
                    role="alert"
                    className="mt-8 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
                >
                    {error}
                </p>
            )}

            {!error && orders !== null && orders.length === 0 && (
                <div className="mt-12 rounded-2xl border border-neutral-200 p-8 text-center">
                    <p className="text-neutral-600">
                        Henüz siparişiniz yok.
                    </p>

                    <Link
                        href="/products"
                        className="mt-6 inline-flex rounded-xl bg-neutral-950 px-5 py-3 text-sm font-medium text-white hover:bg-neutral-800"
                    >
                        Alışverişe Başla
                    </Link>
                </div>
            )}

            {!error && orders !== null && orders.length > 0 && (
                <div className="mt-12 space-y-4">
                    {orders.map((order) => {
                        const itemCount = order.items.reduce(
                            (total, item) => total + item.quantity,
                            0,
                        );

                        return (
                            <Link
                                key={order.id}
                                href={`/orders/${order.id}`}
                                className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-neutral-200 p-6 transition hover:border-neutral-400"
                            >
                                <div>
                                    <p className="font-medium">
                                        Sipariş #{order.id}
                                    </p>

                                    <p className="mt-1 text-sm text-neutral-500">
                                        {new Date(
                                            order.created_at,
                                        ).toLocaleDateString("tr-TR", {
                                            day: "numeric",
                                            month: "long",
                                            year: "numeric",
                                        })}
                                        {" · "}
                                        {itemCount} ürün
                                    </p>
                                </div>

                                <div className="flex items-center gap-6">
                                    <span
                                        className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${ORDER_STATUS_CLASSES[order.status]}`}
                                    >
                                        {ORDER_STATUS_LABELS[order.status]}
                                    </span>

                                    <p className="font-semibold">
                                        {Number(order.total_price).toFixed(2)}{" "}
                                        ₺
                                    </p>
                                </div>
                            </Link>
                        );
                    })}
                </div>
            )}
        </main>
    );
}

