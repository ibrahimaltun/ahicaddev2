"use client";

import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";

import { useAuth } from "@/features/auth/hooks/useAuth";
import {
    cancelOrder,
    getPaymentInfo,
    getOrder,
} from "@/features/orders/api";
import {
    ORDER_STATUS_CLASSES,
    ORDER_STATUS_LABELS,
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

    const orderId = Number(params.id);
    const isJustCreated =
        searchParams.get("success") === "1";

    const {
        loading: authLoading,
        isAuthenticated,
    } = useAuth();

    const [order, setOrder] = useState<Order | null>(
        null,
    );
    const [paymentInfo, setPaymentInfo] =
        useState<PaymentInfo | null>(null);
    const [error, setError] = useState<string | null>(
        null,
    );
    const [isCancelling, setIsCancelling] =
        useState(false);
    const [cancelError, setCancelError] = useState<
        string | null
    >(null);

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
                    setError(
                        "Sipariş bulunamadı veya görüntüleme yetkiniz yok.",
                    );
                }
            }
        })();

        return () => {
            cancelled = true;
        };
    }, [authLoading, isAuthenticated, orderId, isValidOrderId]);

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
                    : "Sipariş iptal edilemedi.",
            );
        } finally {
            setIsCancelling(false);
        }
    }

    if (authLoading) {
        return (
            <main className="mx-auto max-w-7xl px-6 py-20 lg:px-8">
                <p className="text-neutral-600">
                    Siparişiniz yükleniyor...
                </p>
            </main>
        );
    }

    if (!isAuthenticated) {
        return (
            <main className="mx-auto max-w-7xl px-6 py-20 lg:px-8">
                <h1 className="text-3xl font-semibold">
                    Siparişiniz için giriş yapın
                </h1>

                <p className="mt-3 text-neutral-600">
                    Sipariş detayınızı görüntülemek için giriş
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

    if (isValidOrderId && !error && order === null) {
        return (
            <main className="mx-auto max-w-7xl px-6 py-20 lg:px-8">
                <p className="text-neutral-600">
                    Siparişiniz yükleniyor...
                </p>
            </main>
        );
    }

    if (!isValidOrderId || error || !order) {
        return (
            <main className="mx-auto max-w-7xl px-6 py-20 lg:px-8">
                <h1 className="text-3xl font-semibold">
                    Sipariş bulunamadı
                </h1>

                <p className="mt-3 text-neutral-600">
                    {!isValidOrderId
                        ? "Geçersiz sipariş numarası."
                        : error ||
                          "Bu siparişi görüntüleme yetkiniz yok."}
                </p>

                <Link
                    href="/orders"
                    className="mt-6 inline-flex rounded-full border border-neutral-200 px-4 py-2 text-sm font-medium text-neutral-700 transition hover:bg-neutral-100"
                >
                    Siparişlerim
                </Link>
            </main>
        );
    }

    const total = order.items.reduce(
        (sum, item) =>
            sum + Number(item.unit_price) * item.quantity,
        0,
    );

    return (
        <main className="mx-auto max-w-7xl px-6 py-16 lg:px-8">
            <div className="flex flex-wrap items-end justify-between gap-4">
                <div>
                    <p className="text-sm font-medium text-neutral-500">
                        Siparişlerim
                    </p>

                    <h1 className="mt-2 text-4xl font-semibold tracking-tight">
                        Sipariş #{order.id}
                    </h1>

                    <p className="mt-3 text-sm text-neutral-500">
                        {new Date(order.created_at).toLocaleDateString(
                            "tr-TR",
                            {
                                day: "numeric",
                                month: "long",
                                year: "numeric",
                            },
                        )}
                    </p>
                </div>

                <span
                    className={`inline-flex rounded-full px-4 py-1.5 text-sm font-semibold ${ORDER_STATUS_CLASSES[order.status]}`}
                >
                    {ORDER_STATUS_LABELS[order.status]}
                </span>
            </div>

            {isJustCreated && order.status === "pending_payment" && (
                <div className="mt-8 rounded-2xl border border-green-200 bg-green-50 p-6">
                    <p className="font-semibold text-green-800">
                        Siparişiniz alındı. Teşekkür ederiz!
                    </p>

                    <p className="mt-2 text-sm text-green-700">
                        Aşağıdaki IBAN numarasına ödemenizi
                        yapabilirsiniz. Ödemeniz onaylandığında
                        siparişiniz hazırlanacaktır.
                    </p>
                </div>
            )}

            {order.status === "pending_payment" && (
                <section className="mt-8 rounded-2xl border border-amber-200 bg-amber-50 p-6">
                    <h2 className="text-lg font-semibold text-amber-900">
                        Ödeme Bilgileri (Havale / EFT)
                    </h2>

                    {paymentInfo ? (
                        <dl className="mt-4 space-y-3 text-sm">
                            <div>
                                <dt className="text-amber-800">
                                    Alıcı
                                </dt>

                                <dd className="mt-1 font-medium text-amber-950">
                                    {paymentInfo.receiver}
                                </dd>
                            </div>

                            <div>
                                <dt className="text-amber-800">
                                    IBAN
                                </dt>

                                <dd className="mt-1 font-medium tracking-wide text-amber-950">
                                    {paymentInfo.iban}
                                </dd>
                            </div>

                            <div>
                                <dt className="text-amber-800">
                                    Ödeme Açıklaması
                                </dt>

                                <dd className="mt-1 font-medium text-amber-950">
                                    Sipariş #{order.id}
                                </dd>
                            </div>

                            <p className="text-amber-800">
                                {paymentInfo.instructions}
                            </p>
                        </dl>
                    ) : (
                        <p className="mt-3 text-sm text-amber-800">
                            Ödeme bilgileri yükleniyor...
                        </p>
                    )}
                </section>
            )}

            <div className="mt-12 grid gap-10 lg:grid-cols-[1fr_360px]">
                <section className="rounded-2xl border border-neutral-200 p-6">
                    <h2 className="text-lg font-semibold">
                        Ürünler
                    </h2>

                    <ul className="mt-6 divide-y divide-neutral-200">
                        {order.items.map((item) => (
                            <li
                                key={item.id}
                                className="flex justify-between gap-4 py-4"
                            >
                                <div>
                                    <span className="font-medium">
                                        {item.product_name}
                                    </span>

                                    <p className="mt-1 text-sm text-neutral-500">
                                        {Number(item.unit_price).toFixed(2)} ₺
                                        {" × "}
                                        {item.quantity}
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

                    <div className="mt-4 flex justify-between border-t border-neutral-200 pt-4 text-lg font-semibold">
                        <span>Toplam</span>

                        <span>
                            {total.toFixed(2)} ₺
                        </span>
                    </div>
                </section>

                <aside className="space-y-6">
                    <section className="rounded-2xl border border-neutral-200 p-6">
                        <h2 className="text-lg font-semibold">
                            Teslimat Bilgileri
                        </h2>

                        <dl className="mt-6 space-y-4 text-sm">
                            <div>
                                <dt className="text-neutral-500">
                                    Ad Soyad
                                </dt>

                                <dd className="mt-1 font-medium">
                                    {order.shipping_full_name}
                                </dd>
                            </div>

                            <div>
                                <dt className="text-neutral-500">
                                    Telefon
                                </dt>

                                <dd className="mt-1 font-medium">
                                    {order.shipping_phone}
                                </dd>
                            </div>

                            <div>
                                <dt className="text-neutral-500">
                                    Adres
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
                        <section className="rounded-2xl border border-neutral-200 p-6">
                            <h2 className="text-lg font-semibold">
                                Sipariş İşlemleri
                            </h2>

                            <button
                                type="button"
                                onClick={handleCancel}
                                disabled={isCancelling}
                                className="mt-6 w-full rounded-xl border border-red-200 px-5 py-3 text-sm font-medium text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:text-neutral-400"
                            >
                                {isCancelling
                                    ? "İptal ediliyor..."
                                    : "Siparişi İptal Et"}
                            </button>

                            {cancelError && (
                                <p
                                    role="alert"
                                    className="mt-3 text-sm text-red-600"
                                >
                                    {cancelError}
                                </p>
                            )}
                        </section>
                    )}
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
                    <p className="text-neutral-600">
                        Siparişiniz yükleniyor...
                    </p>
                </main>
            }
        >
            <OrderDetailContent />
        </Suspense>
    );
}
