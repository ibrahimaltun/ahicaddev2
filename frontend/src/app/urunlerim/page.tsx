"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Notice } from "@/components/ui/notice";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { useI18n } from "@/features/i18n/LocaleProvider";
import { getMyProductSubmissions } from "@/features/products/client-api";

import type { Product } from "@/features/products/types";

function StatusBadge({ status, label }: { status: string; label: string }) {
    if (status === "pending") {
        return (
            <span className="inline-flex items-center rounded-full border border-warning-border bg-warning-bg px-2.5 py-1 text-xs font-semibold text-warning-fg">
                {label}
            </span>
        );
    }

    if (status === "rejected") {
        return (
            <span className="inline-flex items-center rounded-full border border-danger-border bg-danger-bg px-2.5 py-1 text-xs font-semibold text-danger-fg">
                {label}
            </span>
        );
    }

    return (
        <span className="inline-flex items-center rounded-full border border-success-border bg-success-bg px-2.5 py-1 text-xs font-semibold text-success-fg">
            {label}
        </span>
    );
}

export default function UrunlerimPage() {
    const { t } = useI18n();
    const { user, loading, isAuthenticated } = useAuth();

    const [products, setProducts] = useState<Product[]>([]);
    const [loadingProducts, setLoadingProducts] = useState(true);
    const [loadError, setLoadError] = useState("");
    const [refreshing, setRefreshing] = useState(false);

    // Oturum acikken urun gecmisini ceker; setState cagrilari await
    // sonrasi yapilir (effect icinde senkron setState yok).
    useEffect(() => {
        if (!isAuthenticated) {
            return;
        }

        let cancelled = false;

        (async () => {
            try {
                const data = await getMyProductSubmissions();

                if (!cancelled) {
                    setProducts(data);
                    setLoadError("");
                }
            } catch {
                if (!cancelled) {
                    setLoadError(t("myProducts.loadError"));
                }
            } finally {
                if (!cancelled) {
                    setLoadingProducts(false);
                }
            }
        })();

        return () => {
            cancelled = true;
        };
    }, [isAuthenticated, t]);

    async function handleRefresh() {
        setRefreshing(true);

        try {
            const data = await getMyProductSubmissions();
            setProducts(data);
            setLoadError("");
        } catch {
            setLoadError(t("myProducts.loadError"));
        } finally {
            setRefreshing(false);
        }
    }

    // Oturum yukleniyor veya oturum acikken urunler bekleniyor.
    const isInitialLoading = loading || (isAuthenticated && loadingProducts);

    if (isInitialLoading) {
        return (
            <main className="mx-auto max-w-7xl px-6 py-20 lg:px-8">
                <p className="text-foreground-muted">
                    {t("myProducts.loading")}
                </p>
            </main>
        );
    }

    if (!isAuthenticated || !user) {
        return (
            <main className="mx-auto max-w-7xl px-6 py-20 lg:px-8">
                <h1 className="text-3xl font-semibold">
                    {t("myProducts.loginTitle")}
                </h1>

                <p className="mt-3 text-foreground-muted">
                    {t("myProducts.loginDescription")}
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
        <main className="mx-auto max-w-7xl px-6 py-16 lg:px-8 lg:py-20">
            <div className="flex flex-wrap items-end justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
                        {t("myProducts.title")}
                    </h1>

                    <p className="mt-3 max-w-2xl text-foreground-muted">
                        {t("myProducts.subtitle")}
                    </p>
                </div>

                <div className="flex flex-wrap gap-3">
                    <Button
                        type="button"
                        variant="secondary"
                        onClick={handleRefresh}
                        disabled={refreshing}
                    >
                        {t("myProducts.refresh")}
                    </Button>

                    <Link href="/urun-ekle">
                        <Button variant="primary">
                            {t("myProducts.emptyCta")}
                        </Button>
                    </Link>
                </div>
            </div>

            {loadError && (
                <Notice tone="error" role="alert" className="mt-8">
                    {loadError}
                </Notice>
            )}

            {loadingProducts ? (
                <p className="mt-12 text-foreground-muted">
                    {t("myProducts.loading")}
                </p>
            ) : products.length === 0 ? (
                <div className="mt-12 rounded-2xl border border-border bg-surface p-10 text-center">
                    <h2 className="text-xl font-semibold">
                        {t("myProducts.emptyTitle")}
                    </h2>

                    <p className="mx-auto mt-3 max-w-md text-foreground-muted">
                        {t("myProducts.emptyDescription")}
                    </p>

                    <Link href="/urun-ekle" className="mt-6 inline-block">
                        <Button variant="primary" size="lg">
                            {t("myProducts.emptyCta")}
                        </Button>
                    </Link>
                </div>
            ) : (
                <ul className="mt-10 space-y-4">
                    {products.map((product) => {
                        const image = product.images[0]?.image_url;
                        const isPending = product.status === "pending";

                        return (
                            <li
                                key={product.id}
                                className="flex flex-col gap-4 rounded-2xl border border-border bg-surface p-4 sm:flex-row sm:items-center"
                            >
                                <div className="h-20 w-20 shrink-0 overflow-hidden rounded-xl border border-border bg-surface-2">
                                    {image ? (
                                        // eslint-disable-next-line @next/next/no-img-element
                                        <img
                                            src={image}
                                            alt={product.name}
                                            loading="lazy"
                                            className="h-full w-full object-cover"
                                        />
                                    ) : (
                                        <div className="flex h-full items-center justify-center p-1 text-center text-xs text-foreground-subtle">
                                            {t("myProducts.noImage")}
                                        </div>
                                    )}
                                </div>

                                <div className="min-w-0 flex-1">
                                    <div className="flex flex-wrap items-center gap-2">
                                        <h2 className="font-semibold">
                                            {product.name}
                                        </h2>

                                        <StatusBadge
                                            status={product.status ?? "approved"}
                                            label={
                                                product.status === "pending"
                                                    ? t("myProducts.statusPending")
                                                    : product.status === "rejected"
                                                      ? t("myProducts.statusRejected")
                                                      : t("myProducts.statusApproved")
                                            }
                                        />
                                    </div>

                                    <p className="mt-1 text-sm text-foreground-muted">
                                        {product.price} ₺ ·{" "}
                                        {t("myProducts.submittedOn")}:{" "}
                                        {product.submitted_at
                                            ? new Date(
                                                  product.submitted_at,
                                              ).toLocaleString()
                                            : "—"}
                                    </p>

                                    {isPending && (
                                        <p className="mt-2 text-sm text-warning-fg">
                                            {t("myProducts.pendingNote")}
                                        </p>
                                    )}
                                </div>

                                {product.status === "approved" && (
                                    <Link
                                        href={`/products/${product.slug}`}
                                        className="shrink-0 text-sm font-semibold text-primary transition-colors hover:text-primary-hover"
                                    >
                                        {t("myProducts.viewProduct")} →
                                    </Link>
                                )}
                            </li>
                        );
                    })}
                </ul>
            )}
        </main>
    );
}
