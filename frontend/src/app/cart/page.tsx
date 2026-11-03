"use client";

import Link from "next/link";

import { buttonClasses } from "@/components/ui/button";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { useCart } from "@/features/cart/CartProvider";
import { useI18n } from "@/features/i18n/LocaleProvider";

export default function CartPage() {
    const { t } = useI18n();
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
                <p className="text-foreground-muted">
                    {t("cart.loading")}
                </p>
            </main>
        );
    }

    if (!isAuthenticated || !user) {
        return (
            <main className="mx-auto max-w-7xl px-6 py-20 lg:px-8">
                <h1 className="text-3xl font-semibold">
                    {t("cart.loginTitle")}
                </h1>

                <p className="mt-3 text-foreground-muted">
                    {t("cart.loginDescription")}
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

    if (items.length === 0) {
        return (
            <main className="mx-auto max-w-7xl px-6 py-16 lg:px-8">
                <p className="text-sm font-medium text-foreground-subtle">
                    {t("cart.label")}
                </p>

                <h1 className="mt-2 text-4xl font-semibold tracking-tight">
                    {t("cart.title")}
                </h1>

                <div className="mt-12 rounded-2xl border border-border bg-surface p-8 text-center">
                    <p className="text-foreground-muted">
                        {t("cart.empty")}
                    </p>

                    <Link
                        href="/products"
                        className={buttonClasses("primary", "md", "mt-6")}
                    >
                        {t("cart.continueShopping")}
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
                    <p className="text-sm font-medium text-foreground-subtle">
                        {t("cart.label")}
                    </p>

                    <h1 className="mt-2 text-4xl font-semibold tracking-tight">
                        {t("cart.title")}
                    </h1>
                </div>

                <button
                    type="button"
                    onClick={() => {
                        clear().catch(() => {});
                    }}
                    className="text-sm font-medium text-danger-fg transition-colors hover:text-danger-solid"
                >
                    {t("cart.clearCart")}
                </button>
            </div>

            {error && (
                <p
                    role="alert"
                    className="mt-6 rounded-xl border border-danger-border bg-danger-bg px-4 py-3 text-sm text-danger-fg"
                >
                    {error}
                </p>
            )}

            <div className="mt-10 grid gap-10 lg:grid-cols-[1fr_320px]">
                <div className="space-y-4">
                    {items.map((item) => (
                        <div
                            key={item.id}
                            className="flex items-center gap-4 rounded-2xl border border-border bg-surface p-4"
                        >
                            <div className="h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-surface-2">
                                {item.product.image_url ? (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img
                                        src={item.product.image_url}
                                        alt={item.product.name}
                                        className="h-full w-full object-cover"
                                    />
                                ) : null}
                            </div>

                            <div className="min-w-0 flex-1">
                                <Link
                                    href={`/products/${item.product.slug}`}
                                    className="font-medium text-foreground transition-colors hover:text-primary"
                                >
                                    {item.product.name}
                                </Link>

                                <p className="mt-1 text-sm text-foreground-muted">
                                    {item.product.price} ₺
                                </p>

                                <div className="mt-2 flex items-center gap-3">
                                    <label
                                        className="sr-only"
                                        htmlFor={`quantity-${item.id}`}
                                    >
                                        {t("cart.quantity")}
                                    </label>

                                    <select
                                        id={`quantity-${item.id}`}
                                        value={item.quantity}
                                        onChange={(event) => {
                                            updateItem(
                                                item.id,
                                                Number(event.target.value),
                                            ).catch(() => {});
                                        }}
                                        className="rounded-lg border border-border-strong bg-surface px-3 py-2 text-sm"
                                        aria-label={`${item.product.name} ürün adedi`}
                                    >
                                        {Array.from(
                                            { length: Math.max(item.product.stock, item.quantity) },
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
                                        className="text-sm font-medium text-danger-fg transition-colors hover:text-danger-solid"
                                    >
                                        {t("cart.remove")}
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
                    ))}
                </div>

                <aside className="h-fit rounded-2xl border border-border bg-surface p-6">
                    <h2 className="text-lg font-semibold">
                        {t("cart.summary")}
                    </h2>

                    <div className="mt-6 flex justify-between text-sm">
                        <span className="text-foreground-muted">
                            {t("cart.subtotal")}
                        </span>

                        <span>
                            {total.toFixed(2)} ₺
                        </span>
                    </div>

                    <div className="mt-4 flex justify-between border-t border-border pt-4 text-lg font-semibold">
                        <span>{t("cart.total")}</span>

                        <span>
                            {total.toFixed(2)} ₺
                        </span>
                    </div>

                    <Link
                        href="/checkout"
                        className={buttonClasses("primary", "lg", "mt-6 w-full")}
                    >
                        {t("cart.checkout")}
                    </Link>
                </aside>
            </div>
        </main>
    );
}
