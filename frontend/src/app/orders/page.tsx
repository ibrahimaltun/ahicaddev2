"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { buttonClasses } from "@/components/ui/button";
import { Badge, type BadgeTone } from "@/components/ui/badge";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { useI18n } from "@/features/i18n/LocaleProvider";
import { getOrders } from "@/features/orders/api";
import { ORDER_STATUS_TONES, type Order } from "@/features/orders/types";

export default function OrdersPage() {
    const { t, locale } = useI18n();
    const {
        loading: authLoading,
        isAuthenticated,
    } = useAuth();

    const [orders, setOrders] = useState<Order[] | null>(null);
    const [error, setError] = useState<string | null>(null);

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
                    setError(t("orders.loadError"));
                }
            }
        })();

        return () => {
            cancelled = true;
        };
    }, [authLoading, isAuthenticated, t]);

    if (authLoading || (!error && orders === null)) {
        return (
            <main className="mx-auto max-w-7xl px-6 py-20 lg:px-8">
                <p className="text-foreground-muted">
                    {t("orders.loading")}
                </p>
            </main>
        );
    }

    if (!isAuthenticated) {
        return (
            <main className="mx-auto max-w-7xl px-6 py-20 lg:px-8">
                <h1 className="text-3xl font-semibold">
                    {t("orders.loginTitle")}
                </h1>

                <p className="mt-3 text-foreground-muted">
                    {t("orders.loginDescription")}
                </p>

                <Link
                    href="/login"
                    className="mt-6 inline-flex rounded-full border border-border-strong bg-surface px-4 py-2 text-sm font-medium text-foreground transition hover:bg-surface-2"
                >
                    {t("common.login")}
                </Link>
            </main>
        );
    }

    return (
        <main className="mx-auto max-w-7xl px-6 py-16 lg:px-8">
            <p className="text-sm font-medium text-foreground-subtle">
                {t("orders.label")}
            </p>

            <h1 className="mt-2 text-4xl font-semibold tracking-tight">
                {t("orders.title")}
            </h1>

            {error && (
                <p
                    role="alert"
                    className="mt-8 rounded-xl border border-danger-border bg-danger-bg px-4 py-3 text-sm text-danger-fg"
                >
                    {error}
                </p>
            )}

            {!error && orders !== null && orders.length === 0 && (
                <div className="mt-12 rounded-2xl border border-border bg-surface p-8 text-center">
                    <p className="text-foreground-muted">
                        {t("orders.empty")}
                    </p>

                    <Link
                        href="/products"
                        className={buttonClasses("primary", "md", "mt-6")}
                    >
                        {t("orders.continueShopping")}
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
                                className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-border bg-surface p-6 transition hover:border-primary"
                            >
                                <div>
                                    <p className="font-medium">
                                        {t("orders.orderNumber", { id: order.id })}
                                    </p>

                                    <p className="mt-1 text-sm text-foreground-muted">
                                        {new Date(
                                            order.created_at,
                                        ).toLocaleDateString(
                                            locale === "en" ? "en-US" : "tr-TR",
                                            {
                                                day: "numeric",
                                                month: "long",
                                                year: "numeric",
                                            },
                                        )}
                                        {" · "}
                                        {t("orders.itemsCount", { count: itemCount })}
                                    </p>
                                </div>

                                <div className="flex items-center gap-6">
                                    <Badge
                                        tone={
                                            ORDER_STATUS_TONES[order.status] as BadgeTone
                                        }
                                    >
                                        {t(`orders.status.${order.status}`)}
                                    </Badge>

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
