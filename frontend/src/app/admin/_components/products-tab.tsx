"use client";

import { useCallback, useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Notice } from "@/components/ui/notice";
import { useI18n } from "@/features/i18n/LocaleProvider";
import {
    deleteAdminProduct,
    getAdminProducts,
    importExternalCatalog,
    updateAdminProduct,
} from "@/features/admin/api";
import type { AdminProduct } from "@/features/admin/types";

export function ProductsTab() {
    const { t } = useI18n();

    const [search, setSearch] = useState("");
    const [products, setProducts] = useState<AdminProduct[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState("");
    const [actionError, setActionError] = useState("");
    const [savedId, setSavedId] = useState<number | null>(null);
    const [stockDraft, setStockDraft] = useState<Record<number, string>>({});
    const [priceDraft, setPriceDraft] = useState<Record<number, string>>({});

    const [importing, setImporting] = useState(false);
    const [importMessage, setImportMessage] = useState("");

    const loadProducts = useCallback(async () => {
        setLoading(true);
        setLoadError("");

        try {
            const data = await getAdminProducts(search || undefined);

            setProducts(data);
            setStockDraft(
                Object.fromEntries(data.map((p) => [p.id, String(p.stock)])),
            );
            setPriceDraft(
                Object.fromEntries(data.map((p) => [p.id, p.price])),
            );
        } catch (loadError_) {
            setLoadError(
                loadError_ instanceof Error
                    ? loadError_.message
                    : t("admin.products.loadError"),
            );
        } finally {
            setLoading(false);
        }
    }, [search, t]);

    useEffect(() => {
        const timeout = setTimeout(() => {
            loadProducts();
        }, 300);

        return () => clearTimeout(timeout);
    }, [loadProducts]);

    async function handleSave(product: AdminProduct) {
        setActionError("");

        try {
            await updateAdminProduct(product.id, {
                stock: Number(stockDraft[product.id] ?? product.stock),
                price: priceDraft[product.id] ?? product.price,
            });

            setSavedId(product.id);
            await loadProducts();

            setTimeout(() => setSavedId(null), 2000);
        } catch (saveError) {
            setActionError(
                saveError instanceof Error
                    ? saveError.message
                    : t("common.error"),
            );
        }
    }

    async function handleToggleActive(product: AdminProduct) {
        setActionError("");

        try {
            await updateAdminProduct(product.id, {
                is_active: !product.is_active,
            });

            await loadProducts();
        } catch (toggleError) {
            setActionError(
                toggleError instanceof Error
                    ? toggleError.message
                    : t("common.error"),
            );
        }
    }

    async function handleDelete(product: AdminProduct) {
        if (!window.confirm(t("admin.products.deleteConfirm"))) {
            return;
        }

        setActionError("");

        try {
            await deleteAdminProduct(product.id);
            await loadProducts();
        } catch (deleteError) {
            setActionError(
                deleteError instanceof Error
                    ? deleteError.message
                    : t("common.error"),
            );
        }
    }

    async function handleImport() {
        setImporting(true);
        setImportMessage("");
        setActionError("");

        try {
            const result = await importExternalCatalog(30);

            setImportMessage(
                t("admin.products.importResult", {
                    created: result.created_products,
                    skipped: result.skipped_products,
                }),
            );

            await loadProducts();
        } catch (importError) {
            setActionError(
                importError instanceof Error
                    ? importError.message
                    : t("admin.products.importError"),
            );
        } finally {
            setImporting(false);
        }
    }

    return (
        <div className="space-y-6">
            <section className="rounded-2xl border border-border bg-surface p-6">
                <h2 className="text-lg font-semibold">
                    {t("admin.products.importTitle")}
                </h2>

                <p className="mt-2 text-sm leading-6 text-foreground-muted">
                    {t("admin.products.importDescription")}
                </p>

                <div className="mt-4 flex flex-wrap items-center gap-4">
                    <Button
                        variant="primary"
                        size="sm"
                        disabled={importing}
                        onClick={handleImport}
                    >
                        {importing
                            ? t("admin.products.importing")
                            : t("admin.products.importButton")}
                    </Button>

                    {importMessage && (
                        <p className="text-sm font-medium text-success-fg">
                            {importMessage}
                        </p>
                    )}
                </div>
            </section>

            <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder={t("admin.products.searchPlaceholder")}
                className="w-full max-w-md"
            />

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
            ) : products.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-border-strong bg-surface p-10 text-center text-foreground-muted">
                    {t("admin.products.noProducts")}
                </div>
            ) : (
                <ul className="space-y-4">
                    {products.map((product) => (
                        <li
                            key={product.id}
                            className="flex flex-wrap items-center gap-4 rounded-2xl border border-border bg-surface p-4"
                        >
                            <div className="h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-surface-2">
                                {product.primary_image_url ? (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img
                                        src={product.primary_image_url}
                                        alt={product.name}
                                        className="h-full w-full object-cover"
                                    />
                                ) : null}
                            </div>

                            <div className="min-w-48 flex-1">
                                <p className="font-medium">{product.name}</p>

                                <p className="mt-1 text-sm text-foreground-muted">
                                    {product.category_name ?? "—"} · {product.slug}
                                </p>
                            </div>

                            <Badge
                                tone={product.is_active ? "success" : "neutral"}
                            >
                                {product.is_active
                                    ? t("admin.products.active")
                                    : t("admin.products.inactive")}
                            </Badge>

                            <label className="text-xs text-foreground-muted">
                                <span className="mb-1 block">
                                    {t("admin.products.stockValue")}
                                </span>

                                <input
                                    type="number"
                                    min={0}
                                    value={stockDraft[product.id] ?? ""}
                                    onChange={(event) =>
                                        setStockDraft((current) => ({
                                            ...current,
                                            [product.id]: event.target.value,
                                        }))
                                    }
                                    className="w-20"
                                />
                            </label>

                            <label className="text-xs text-foreground-muted">
                                <span className="mb-1 block">
                                    {t("admin.products.price")}
                                </span>

                                <input
                                    type="number"
                                    min={0}
                                    step="0.01"
                                    value={priceDraft[product.id] ?? ""}
                                    onChange={(event) =>
                                        setPriceDraft((current) => ({
                                            ...current,
                                            [product.id]: event.target.value,
                                        }))
                                    }
                                    className="w-28"
                                />
                            </label>

                            <div className="flex flex-wrap items-center gap-2">
                                <Button
                                    variant="secondary"
                                    size="sm"
                                    onClick={() => handleSave(product)}
                                >
                                    {savedId === product.id
                                        ? t("admin.products.saved")
                                        : t("common.save")}
                                </Button>

                                <Button
                                    variant="soft"
                                    size="sm"
                                    onClick={() => handleToggleActive(product)}
                                >
                                    {product.is_active
                                        ? t("admin.products.deactivate")
                                        : t("admin.products.activate")}
                                </Button>

                                <Button
                                    variant="danger-outline"
                                    size="sm"
                                    onClick={() => handleDelete(product)}
                                >
                                    {t("common.delete")}
                                </Button>
                            </div>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}
