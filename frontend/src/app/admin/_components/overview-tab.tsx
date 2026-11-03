"use client";

import { useCallback, useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Notice } from "@/components/ui/notice";
import { useI18n } from "@/features/i18n/LocaleProvider";
import { getAdminStats } from "@/features/admin/api";
import type { AdminStats } from "@/features/admin/types";
import type { OrderStatus } from "@/features/orders/types";

const ORDER_STATUSES: OrderStatus[] = [
    "pending_payment",
    "processing",
    "shipped",
    "delivered",
    "cancelled",
];

export function OverviewTab() {
    const { t } = useI18n();

    const [stats, setStats] = useState<AdminStats | null>(null);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(true);
    const [reloadToken, setReloadToken] = useState(0);

    const refresh = useCallback(() => {
        setReloadToken((token) => token + 1);
    }, []);

    useEffect(() => {
        let cancelled = false;

        (async () => {
            setLoading(true);

            try {
                const nextStats = await getAdminStats();

                if (!cancelled) {
                    setStats(nextStats);
                    setError("");
                }
            } catch (loadError) {
                if (!cancelled) {
                    setError(
                        loadError instanceof Error
                            ? loadError.message
                            : t("admin.overview.statsError"),
                    );
                }
            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        })();

        return () => {
            cancelled = true;
        };
    }, [reloadToken, t]);

    if (error) {
        return <Notice tone="error" role="alert">{error}</Notice>;
    }

    if (loading || !stats) {
        return <p className="text-foreground-muted">{t("common.loading")}</p>;
    }

    const cards: { label: string; value: string }[] = [
        { label: t("admin.overview.users"), value: String(stats.users_total) },
        { label: t("admin.overview.products"), value: String(stats.products_total) },
        { label: t("admin.overview.activeProducts"), value: String(stats.products_active) },
        { label: t("admin.overview.categories"), value: String(stats.categories_total) },
        { label: t("admin.overview.orders"), value: String(stats.orders_total) },
        {
            label: t("admin.overview.revenue"),
            value: `${Number(stats.revenue_total).toFixed(2)} ₺`,
        },
        {
            label: t("admin.overview.pendingApplications"),
            value: String(stats.seller_applications_by_status.pending ?? 0),
        },
    ];

    return (
        <div className="space-y-10">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {cards.map((card) => (
                    <div
                        key={card.label}
                        className="rounded-2xl border border-border bg-surface p-6"
                    >
                        <p className="text-sm text-foreground-muted">
                            {card.label}
                        </p>

                        <p className="mt-2 text-2xl font-semibold">
                            {card.value}
                        </p>
                    </div>
                ))}
            </div>

            <div className="flex justify-end">
                <Button variant="secondary" size="sm" onClick={refresh}>
                    {t("admin.overview.refresh")}
                </Button>
            </div>

            <div className="grid gap-8 lg:grid-cols-2">
                <section className="rounded-2xl border border-border bg-surface p-6">
                    <h2 className="text-lg font-semibold">
                        {t("admin.overview.ordersByStatus")}
                    </h2>

                    <ul className="mt-6 space-y-3">
                        {ORDER_STATUSES.map((status) => (
                            <li
                                key={status}
                                className="flex items-center justify-between gap-4"
                            >
                                <Badge
                                    tone={
                                        status === "cancelled"
                                            ? "danger"
                                            : status === "delivered"
                                              ? "success"
                                              : status === "shipped"
                                                ? "primary"
                                                : status === "processing"
                                                  ? "info"
                                                  : "warning"
                                    }
                                >
                                    {t(`orders.status.${status}`)}
                                </Badge>

                                <span className="font-semibold">
                                    {stats.orders_by_status[status] ?? 0}
                                </span>
                            </li>
                        ))}
                    </ul>
                </section>

                <section className="rounded-2xl border border-border bg-surface p-6">
                    <h2 className="text-lg font-semibold">
                        {t("admin.overview.applicationsByStatus")}
                    </h2>

                    <ul className="mt-6 space-y-3">
                        {(["pending", "approved", "rejected"] as const).map(
                            (status) => (
                                <li
                                    key={status}
                                    className="flex items-center justify-between gap-4"
                                >
                                    <Badge
                                        tone={
                                            status === "approved"
                                                ? "success"
                                                : status === "rejected"
                                                  ? "danger"
                                                  : "warning"
                                        }
                                    >
                                        {t(`admin.applications.${status}`)}
                                    </Badge>

                                    <span className="font-semibold">
                                        {
                                            stats
                                                .seller_applications_by_status[
                                                status
                                            ] ?? 0
                                        }
                                    </span>
                                </li>
                            ),
                        )}
                    </ul>
                </section>
            </div>
        </div>
    );
}
