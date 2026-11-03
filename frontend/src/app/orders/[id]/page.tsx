"use client";

import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";

import { buttonClasses } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Notice } from "@/components/ui/notice";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { useI18n } from "@/features/i18n/LocaleProvider";
import {
    cancelOrder,
    getPaymentInfo,
    getOrder,
} from "@/features/orders/api";
import {
    ORDER_STATUS_TONES,
    type Order,
    type PaymentInfo,
} from "@/features/orders/types";

const CANCELLABLE_STATUSES = new Set([
    "pending_payment",
    "processing",
]);

function OrderDetailContent() {
    const params = useParams<{ id: string }>();
    const searchParams = useSearchParams();
    const { t, locale } = useI18n();

    const orderId = Number(params.id);
    const isJustCreated =
        searchParams.get("success") === "1";

    const {
        loading: authLoading,
        isAuthenticated,
    } = useAuth();

    const [order, setOrder] = useState<Order | null>(null);
    const [paymentInfo, setPaymentInfo] = useState<PaymentInfo | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isCancelling, setIsCancelling] = useState(false);
    const [cancelError, setCancelError] = useState<string | null>(null);

    const isValidOrderId = Number.isFinite(orderId);

    useEffect(() => {
        if (authLoading || !isAuthenticated || !isValidOrderId) {
            return;
        }

        let cancelled = false;

        (async () => {
            try {
                const data = await getOrder(orderId);

                if (!cancelled) {
                    setOrder(data);

                    if (data.status === "pending_payment") {
                        setPaymentInfo(await getPaymentInfo());
                    }
                }
            } catch {
                if (!cancelled) {
                    setError(t("orders.notFound"));
                }
            }
        })();

        return () => {
            cancelled = true;
        };
    }, [authLoading, isAuthenticated, orderId, isValidOrderId, t]);

    async function handleCancel() {
        if (!order) {
            return;
        }

        setCancelError(null);
        setIsCancelling(true);

        try {
            setOrder(await cancelOrder(order.id));
        } catch (cancelError_) {
            setCancelError(
                cancelError_ instanceof Error
                    ? cancelError_.message
                    : t("orders.cancelError"),
            );
        } finally {
            setIsCancelling(false);
        }
    }

    if (authLoading) {
        return (
            <main className="mx-auto max-w-7xl px-6 py-20 lg:px-8">
                <p className="text-foreground-muted">
                    {t("orders.detailLoading")}
                </p>
            </main>
        );
    }

    if (!isAuthenticated) {
        return (
            <main className="mx-auto max-w-7xl px-6 py-20 lg:px-8">
                <h1 className="text-3xl font-semibold">
                    {t("orders.detailLoginTitle")}
                </h1>

                <p className="mt-3 text-foreground-muted">
                    {t("orders.detailLoginDescription")}
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

    if (error) {
        return (
            <main className="mx-auto max-w-7xl px-6 py-20 lg:px-8">
                <Notice tone="error" role="alert" className="max-w-xl">
                    {error}
                </Notice>

                <Link
                    href="/orders"
                    className={buttonClasses("secondary", "md", "mt-6")}
                >
                    {t("orders.backToOrders")}
                </Link>
            </main>
        );
    }

    if (!order) {
        return (
            <main className="mx-auto max-w-7xl px-6 py-20 lg:px-8">
                <p className="text-foreground-muted">
                    {t("orders.detailLoading")}
                </p>
            </main>
        );
    }

    const total = order.items.reduce(
        (sum, item) => sum + Number(item.unit_price) * item.quantity,
        0,
    );

    return (
        <main className="mx-auto max-w-7xl px-6 py-16 lg:px-8">
            <p className="text-sm font-medium text-foreground-subtle">
                {t("orders.label")}
            </p>

            <div className="mt-2 flex flex-wrap items-center justify-between gap-4">
                <h1 className="text-4xl font-semibold tracking-tight">
                    {t("orders.orderNumber", { id: order.id })}
                </h1>

                <Badge tone={ORDER_STATUS_TONES[order.status]}>
                    {t(`orders.status.${order.status}`)}
                </Badge>
            </div>

            <p className="mt-2 text-sm text-foreground-muted">
                {new Date(order.created_at).toLocaleDateString(
                    locale === "en" ? "en-US" : "tr-TR",
                    {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                    },
                )}
            </p>

            {isJustCreated && order.status === "pending_payment" && (
                <Notice tone="success" className="mt-8">
                    <p className="font-semibold">
                        {t("orders.justCreatedTitle")}
                    </p>

                    <p className="mt-1">
                        {t("orders.justCreatedDescription")}
                    </p>
                </Notice>
            )}

            {order.status === "cancelled" && (
                <Notice tone="info" className="mt-8">
                    {t("orders.cancelledMessage")}
                </Notice>
            )}

            <div className="mt-10 grid gap-10 lg:grid-cols-[1fr_360px]">
                <div className="space-y-8">
                    <section className="rounded-2xl border border-border bg-surface p-6">
                        <h2 className="text-lg font-semibold">
                            {t("orders.items")}
                        </h2>

                        <ul className="mt-6 divide-y divide-border">
                            {order.items.map((item) => (
                                <li
                                    key={item.id}
                                    className="flex flex-wrap items-center justify-between gap-2 py-4"
                                >
                                    <div>
                                        <p className="font-medium">
                                            {item.product_name}
                                        </p>

                                        <p className="mt-1 text-sm text-foreground-muted">
                                            {Number(item.unit_price).toFixed(2)} ₺ × {item.quantity}
                                        </p>
                                    </div>

                                    <p className="font-semibold">
                                        {(
                                            Number(item.unit_price) *
                                            item.quantity
                                        ).toFixed(2)}{" "}
                                        ₺
                                    </p>
                                </li>
                            ))}
                        </ul>

                        <div className="mt-2 flex justify-between border-t border-border pt-4 text-lg font-semibold">
                            <span>{t("orders.total")}</span>

                            <span>
                                {total.toFixed(2)} ₺
                            </span>
                        </div>
                    </section>

                    {order.status === "pending_payment" && paymentInfo && (
                        <section className="rounded-2xl border border-border bg-surface p-6">
                            <h2 className="text-lg font-semibold">
                                {t("orders.paymentTitle")}
                            </h2>

                            <dl className="mt-6 space-y-4 text-sm">
                                <div>
                                    <dt className="text-foreground-muted">
                                        {t("orders.paymentIban")}
                                    </dt>

                                    <dd className="mt-1 font-mono text-base font-semibold">
                                        {paymentInfo.iban}
                                    </dd>
                                </div>

                                <div>
                                    <dt className="text-foreground-muted">
                                        {t("orders.paymentReceiver")}
                                    </dt>

                                    <dd className="mt-1 font-medium">
                                        {paymentInfo.receiver}
                                    </dd>
                                </div>

                                <div>
                                    <dt className="text-foreground-muted">
                                        {t("orders.paymentInstructions")}
                                    </dt>

                                    <dd className="mt-1 leading-6">
                                        {paymentInfo.instructions}
                                    </dd>
                                </div>
                            </dl>

                            <p className="mt-6 rounded-xl bg-surface-2 px-4 py-3 text-xs text-foreground-muted">
                                {t("orders.paymentNote")}
                            </p>
                        </section>
                    )}
                </div>

                <aside className="space-y-8">
                    <section className="rounded-2xl border border-border bg-surface p-6">
                        <h2 className="text-lg font-semibold">
                            {t("orders.shippingTitle")}
                        </h2>

                        <dl className="mt-6 space-y-4 text-sm">
                            <div>
                                <dt className="text-foreground-muted">
                                    {t("orders.shippingFullName")}
                                </dt>

                                <dd className="mt-1 font-medium">
                                    {order.shipping_full_name}
                                </dd>
                            </div>

                            <div>
                                <dt className="text-foreground-muted">
                                    {t("orders.shippingPhone")}
                                </dt>

                                <dd className="mt-1 font-medium">
                                    {order.shipping_phone}
                                </dd>
                            </div>

                            <div>
                                <dt className="text-foreground-muted">
                                    {t("orders.shippingAddress")}
                                </dt>

                                <dd className="mt-1 font-medium">
                                    {order.shipping_address}
                                    <br />
                                    {order.shipping_district} /{" "}
                                    {order.shipping_city}
                                    {order.shipping_postal_code
                                        ? ` ${order.shipping_postal_code}`
                                        : ""}
                                </dd>
                            </div>
                        </dl>
                    </section>

                    {CANCELLABLE_STATUSES.has(order.status) && (
                        <section className="rounded-2xl border border-border bg-surface p-6">
                            <h2 className="text-lg font-semibold">
                                {t("orders.actionsTitle")}
                            </h2>

                            <button
                                type="button"
                                onClick={handleCancel}
                                disabled={isCancelling}
                                className="mt-6 w-full rounded-xl border border-danger-border bg-danger-bg/40 px-5 py-3 text-sm font-semibold text-danger-fg transition hover:bg-danger-bg disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                {isCancelling
                                    ? t("orders.cancelling")
                                    : t("orders.cancelOrder")}
                            </button>

                            {cancelError && (
                                <p
                                    role="alert"
                                    className="mt-3 text-sm text-danger-fg"
                                >
                                    {cancelError}
                                </p>
                            )}
                        </section>
                    )}

                    <Link
                        href="/orders"
                        className={buttonClasses("secondary", "md", "w-full")}
                    >
                        {t("orders.backToOrders")}
                    </Link>
                </aside>
            </div>
        </main>
    );
}

export default function OrderDetailPage() {
    return (
        <Suspense
            fallback={
                <main className="mx-auto max-w-7xl px-6 py-20 lg:px-8">
                    <p className="text-foreground-muted">...</p>
                </main>
            }
        >
            <OrderDetailContent />
        </Suspense>
    );
}
