"use client";

import { useCallback, useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Notice } from "@/components/ui/notice";
import { useI18n } from "@/features/i18n/LocaleProvider";
import {
    getAdminOrders,
    updateOrderStatus,
} from "@/features/admin/api";
import type { AdminOrder } from "@/features/admin/types";
import {
    allowedStatusesFor,
    type OrderStatus,
} from "@/features/orders/types";

const STATUS_FILTERS: (OrderStatus | "all")[] = [
    "all",
    "pending_payment",
    "processing",
    "shipped",
    "delivered",
    "cancelled",
];

const PAGE_SIZE = 20;

export function OrdersTab() {
    const { t } = useI18n();

    const [statusFilter, setStatusFilter] = useState<OrderStatus | "all">("all");
    const [page, setPage] = useState(1);
    const [total, setTotal] = useState(0);
    const [orders, setOrders] = useState<AdminOrder[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState("");
    const [actionError, setActionError] = useState("");
    const [processingId, setProcessingId] = useState<number | null>(null);
    const [statusDraft, setStatusDraft] = useState<Record<number, string>>({});
    const [reloadToken, setReloadToken] = useState(0);

    useEffect(() => {
        let cancelled = false;

        (async () => {
            setLoading(true);

            try {
                const data = await getAdminOrders(
                    statusFilter === "all" ? undefined : statusFilter,
                    page,
                );

                if (!cancelled) {
                    setOrders(data.items);
                    setTotal(data.total);
                    setStatusDraft(
                        Object.fromEntries(
                            data.items.map((order) => [order.id, order.status]),
                        ),
                    );
                    setLoadError("");
                }
            } catch (loadError_) {
                if (!cancelled) {
                    setLoadError(
                        loadError_ instanceof Error
                            ? loadError_.message
                            : t("admin.orders.loadError"),
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
    }, [statusFilter, page, reloadToken, t]);

    const reload = useCallback(() => {
        setReloadToken((token) => token + 1);
    }, []);

    function handleFilterChange(option: OrderStatus | "all") {
        setStatusFilter(option);
        setPage(1);
    }

    const totalPages = Math.max(Math.ceil(total / PAGE_SIZE), 1);

    async function handleUpdate(orderId: number) {
        setProcessingId(orderId);
        setActionError("");

        const status = statusDraft[orderId];

        if (!status || status === "pending_payment") {
            setProcessingId(null);

            return;
        }

        try {
            await updateOrderStatus(
                orderId,
                status as "processing" | "shipped" | "delivered" | "cancelled",
            );

            reload();
        } catch (updateError) {
            setActionError(
                updateError instanceof Error
                    ? updateError.message
                    : t("common.error"),
            );
        } finally {
            setProcessingId(null);
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-wrap items-center gap-2">
                {STATUS_FILTERS.map((option) => (
                    <button
                        key={option}
                        type="button"
                        onClick={() => handleFilterChange(option)}
                        className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                            statusFilter === option
                                ? "bg-primary text-primary-foreground"
                                : "border border-border bg-surface text-foreground-muted hover:text-foreground"
                        }`}
                    >
                        {option === "all"
                            ? t("admin.orders.filterAll")
                            : t(`orders.status.${option}`)}
                    </button>
                ))}

                {!loading && (
                    <span className="ml-auto text-sm text-foreground-muted">
                        {t("admin.orders.totalCount", { count: total })}
                    </span>
                )}
            </div>

            {actionError && (
                <Notice tone="error" role="alert">
                    {actionError}
                </Notice>
            )}

            {loadError && (
                <Notice tone="error" role="alert">
                    {loadError}
                </Notice>
            )}

            {loading ? (
                <p className="text-foreground-muted">{t("common.loading")}</p>
            ) : orders.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-border-strong bg-surface p-10 text-center text-foreground-muted">
                    {t("admin.orders.noOrders")}
                </div>
            ) : (
                <ul className="space-y-4">
                    {orders.map((order) => (
                        <li
                            key={order.id}
                            className="rounded-2xl border border-border bg-surface p-6"
                        >
                            <div className="flex flex-wrap items-center justify-between gap-4">
                                <div>
                                    <p className="font-semibold">
                                        #{order.id} · {order.user_email}
                                    </p>

                                    <p className="mt-1 text-sm text-foreground-muted">
                                        {order.shipping_full_name} · {order.shipping_city} · {" "}
                                        {new Date(order.created_at).toLocaleDateString("tr-TR")} · {" "}
                                        {t("admin.orders.items")}: {order.items.length}
                                    </p>
                                </div>

                                <div className="flex flex-wrap items-center gap-3">
                                    <Badge
                                        tone={
                                            order.status === "cancelled"
                                                ? "danger"
                                                : order.status === "delivered"
                                                  ? "success"
                                                  : order.status === "shipped"
                                                    ? "primary"
                                                    : order.status === "processing"
                                                      ? "info"
                                                      : "warning"
                                        }
                                    >
                                        {t(`orders.status.${order.status}`)}
                                    </Badge>

                                    <p className="font-semibold">
                                        {Number(order.total_price).toFixed(2)} ₺
                                    </p>
                                </div>
                            </div>

                            <div className="mt-4 flex flex-wrap items-center gap-3">
                                <select
                                    value={statusDraft[order.id] ?? order.status}
                                    onChange={(event) =>
                                        setStatusDraft((current) => ({
                                            ...current,
                                            [order.id]: event.target.value,
                                        }))
                                    }
                                    className="rounded-lg border border-border-strong bg-surface px-3 py-2 text-sm"
                                    aria-label={t("admin.orders.changeStatus")}
                                >
                                    {allowedStatusesFor(order.status).map(
                                        (status) => (
                                            <option key={status} value={status}>
                                                {t(`orders.status.${status}`)}
                                            </option>
                                        ),
                                    )}
                                </select>

                                <Button
                                    variant="secondary"
                                    size="sm"
                                    disabled={
                                        processingId === order.id ||
                                        (statusDraft[order.id] ?? order.status) ===
                                            order.status
                                    }
                                    onClick={() => handleUpdate(order.id)}
                                >
                                    {processingId === order.id
                                        ? t("admin.orders.updating")
                                        : t("admin.orders.update")}
                                </Button>
                            </div>
                        </li>
                    ))}
                </ul>
            )}

            {!loading && totalPages > 1 && (
                <div className="flex items-center justify-center gap-4">
                    <Button
                        variant="secondary"
                        size="sm"
                        disabled={page <= 1}
                        onClick={() => setPage((current) => current - 1)}
                    >
                        ‹ {t("products.prevPage")}
                    </Button>

                    <span className="text-sm text-foreground-muted">
                        {t("products.pageInfo", {
                            page,
                            total: totalPages,
                        })}
                    </span>

                    <Button
                        size="sm"
                        disabled={page >= totalPages}
                        onClick={() => setPage((current) => current + 1)}
                    >
                        {t("products.nextPage")} ›
                    </Button>
                </div>
            )}
        </div>
    );
}
