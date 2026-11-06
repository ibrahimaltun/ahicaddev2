"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { buttonClasses } from "@/components/ui/button";
import { Field, Input, Textarea } from "@/components/ui/form";
import { Notice } from "@/components/ui/notice";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { useCart } from "@/features/cart/CartProvider";
import { hasCartProblem } from "@/features/cart/types";
import { useI18n } from "@/features/i18n/LocaleProvider";
import { createOrder } from "@/features/orders/api";

const emptyForm = {
    shipping_full_name: "",
    shipping_phone: "",
    shipping_city: "",
    shipping_district: "",
    shipping_address: "",
    shipping_postal_code: "",
};

export default function CheckoutPage() {
    const router = useRouter();
    const { t } = useI18n();

    const {
        user,
        loading: authLoading,
        isAuthenticated,
    } = useAuth();

    const { items, isLoading: cartLoading, refresh } = useCart();

    const [form, setForm] = useState(emptyForm);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const accountFullName = user
        ? `${user.first_name} ${user.last_name}`.trim()
        : "";

    function updateField(field: keyof typeof emptyForm) {
        return (
            event: React.ChangeEvent<
                HTMLInputElement | HTMLTextAreaElement
            >,
        ) => {
            setForm((current) => ({
                ...current,
                [field]: event.target.value,
            }));
        };
    }

    async function handleSubmit(
        event: React.FormEvent<HTMLFormElement>,
    ) {
        event.preventDefault();
        setError(null);

        if (hasCartProblem(items)) {
            setError(t("checkout.blockedUnavailable"));

            return;
        }

        const shippingFullName =
            form.shipping_full_name.trim() || accountFullName;

        if (shippingFullName.length < 3) {
            setError(t("checkout.fullNameRequired"));

            return;
        }

        setIsSubmitting(true);

        try {
            const order = await createOrder({
                shipping_full_name: shippingFullName,
                shipping_phone: form.shipping_phone,
                shipping_city: form.shipping_city,
                shipping_district: form.shipping_district,
                shipping_address: form.shipping_address,
                shipping_postal_code:
                    form.shipping_postal_code || null,
            });

            await refresh();

            router.push(`/orders/${order.id}?success=1`);
        } catch (submitError) {
            setError(
                submitError instanceof Error
                    ? submitError.message
                    : t("checkout.createError"),
            );
            setIsSubmitting(false);
        }
    }

    if (authLoading || cartLoading) {
        return (
            <main className="mx-auto max-w-7xl px-6 py-20 lg:px-8">
                <p className="text-foreground-muted">
                    {t("checkout.loading")}
                </p>
            </main>
        );
    }

    if (!isAuthenticated || !user) {
        return (
            <main className="mx-auto max-w-7xl px-6 py-20 lg:px-8">
                <h1 className="text-3xl font-semibold">
                    {t("checkout.loginTitle")}
                </h1>

                <p className="mt-3 text-foreground-muted">
                    {t("checkout.loginDescription")}
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
            <main className="mx-auto max-w-7xl px-6 py-20 lg:px-8">
                <h1 className="text-3xl font-semibold">
                    {t("checkout.title")}
                </h1>

                <p className="mt-3 text-foreground-muted">
                    {t("checkout.emptyCart")}
                </p>

                <Link
                    href="/products"
                    className={buttonClasses("primary", "md", "mt-6")}
                >
                    {t("cart.continueShopping")}
                </Link>
            </main>
        );
    }

    const total = items.reduce(
        (sum, item) =>
            sum + Number(item.product.price) * item.quantity,
        0,
    );

    // Proaktif sepet uyarisi: pasif/onay geri alinmis ya da stokta
    // olmayan urunlerle siparis olusturma denemesi 400/409 ile reddedilir;
    // burada on cagri uyarisi gosterip siparisi engelliyoruz.
    const cartHasProblem = hasCartProblem(items);

    return (
        <main className="mx-auto max-w-7xl px-6 py-16 lg:px-8">
            <p className="text-sm font-medium text-foreground-subtle">
                {t("checkout.label")}
            </p>

            <h1 className="mt-2 text-4xl font-semibold tracking-tight">
                {t("checkout.title")}
            </h1>

            {cartHasProblem && (
                <div className="mt-6">
                    <Notice tone="warning" role="alert">
                        {t("checkout.blockedUnavailable")}{" "}
                        <Link
                            href="/cart"
                            className="font-semibold underline underline-offset-4"
                        >
                            {t("checkout.backToCart")}
                        </Link>
                    </Notice>
                </div>
            )}

            <div className="mt-10 grid gap-10 lg:grid-cols-[1fr_360px]">
                <form onSubmit={handleSubmit} className="space-y-10">
                    <section className="rounded-2xl border border-border bg-surface p-6">
                        <h2 className="text-lg font-semibold">
                            {t("checkout.shippingTitle")}
                        </h2>

                        <p className="mt-1 text-sm text-foreground-muted">
                            {t("checkout.shippingDescription")}
                        </p>

                        <div className="mt-6 space-y-5">
                            <Field
                                label={t("checkout.fullName")}
                                htmlFor="shipping_full_name"
                            >
                                <Input
                                    id="shipping_full_name"
                                    value={form.shipping_full_name}
                                    onChange={updateField("shipping_full_name")}
                                    placeholder={
                                        accountFullName ||
                                        t("checkout.fullNamePlaceholder")
                                    }
                                    required
                                />
                            </Field>

                            <div className="grid gap-5 sm:grid-cols-2">
                                <Field
                                    label={t("checkout.phone")}
                                    htmlFor="shipping_phone"
                                >
                                    <Input
                                        id="shipping_phone"
                                        type="tel"
                                        value={form.shipping_phone}
                                        onChange={updateField("shipping_phone")}
                                        placeholder={t("checkout.phonePlaceholder")}
                                        required
                                    />
                                </Field>

                                <Field
                                    label={t("checkout.city")}
                                    htmlFor="shipping_city"
                                >
                                    <Input
                                        id="shipping_city"
                                        value={form.shipping_city}
                                        onChange={updateField("shipping_city")}
                                        placeholder={t("checkout.cityPlaceholder")}
                                        required
                                    />
                                </Field>
                            </div>

                            <div className="grid gap-5 sm:grid-cols-2">
                                <Field
                                    label={t("checkout.district")}
                                    htmlFor="shipping_district"
                                >
                                    <Input
                                        id="shipping_district"
                                        value={form.shipping_district}
                                        onChange={updateField("shipping_district")}
                                        placeholder={t("checkout.districtPlaceholder")}
                                        required
                                    />
                                </Field>

                                <Field
                                    label={t("checkout.postalCode")}
                                    htmlFor="shipping_postal_code"
                                >
                                    <Input
                                        id="shipping_postal_code"
                                        value={form.shipping_postal_code}
                                        onChange={updateField("shipping_postal_code")}
                                        placeholder={t("checkout.postalCodePlaceholder")}
                                    />
                                </Field>
                            </div>

                            <Field
                                label={t("checkout.address")}
                                htmlFor="shipping_address"
                            >
                                <Textarea
                                    id="shipping_address"
                                    value={form.shipping_address}
                                    onChange={updateField("shipping_address")}
                                    placeholder={t("checkout.addressPlaceholder")}
                                    required
                                />
                            </Field>
                        </div>
                    </section>

                    {items.some((item) => item.product.is_sample) && (
                        <Notice tone="warning" role="note">
                            ⚠ {t("checkout.sampleWarning")}
                        </Notice>
                    )}

                    <section className="rounded-2xl border border-border bg-surface p-6">
                        <h2 className="text-lg font-semibold">
                            {t("checkout.paymentTitle")}
                        </h2>

                        <div className="mt-6 flex items-start gap-3 rounded-xl border border-border bg-surface-2 p-4">
                            <input
                                id="iban_transfer"
                                name="payment_method"
                                type="radio"
                                value="iban_transfer"
                                defaultChecked
                                readOnly
                                className="mt-1"
                            />

                            <label htmlFor="iban_transfer">
                                <span className="block font-medium">
                                    {t("checkout.paymentIbanTitle")}
                                </span>

                                <span className="mt-1 block text-sm text-foreground-muted">
                                    {t("checkout.paymentIbanDescription")}
                                </span>
                            </label>
                        </div>
                    </section>

                    {error && (
                        <Notice tone="error" role="alert">
                            {error}
                        </Notice>
                    )}

                    <button
                        type="submit"
                        disabled={isSubmitting || cartHasProblem}
                        className={buttonClasses("primary", "lg", "w-full")}
                    >
                        {isSubmitting
                            ? t("checkout.creating")
                            : t("checkout.confirmOrder")}
                    </button>
                </form>

                <aside className="h-fit rounded-2xl border border-border bg-surface p-6">
                    <h2 className="text-lg font-semibold">
                        {t("checkout.summary")}
                    </h2>

                    <ul className="mt-6 space-y-4">
                        {items.map((item) => (
                            <li
                                key={item.id}
                                className="flex justify-between gap-4 text-sm"
                            >
                                <span className="text-foreground-muted">
                                    {item.product.name}
                                    {" × "}
                                    {item.quantity}
                                </span>

                                <span>
                                    {(
                                        Number(item.product.price) *
                                        item.quantity
                                    ).toFixed(2)}{" "}
                                    ₺
                                </span>
                            </li>
                        ))}
                    </ul>

                    <div className="mt-6 flex justify-between border-t border-border pt-4 text-lg font-semibold">
                        <span>{t("checkout.total")}</span>

                        <span>
                            {total.toFixed(2)} ₺
                        </span>
                    </div>

                    <Link
                        href="/cart"
                        className="mt-6 block text-center text-sm text-foreground-muted transition-colors hover:text-foreground"
                    >
                        {t("checkout.backToCart")}
                    </Link>
                </aside>
            </div>
        </main>
    );
}
