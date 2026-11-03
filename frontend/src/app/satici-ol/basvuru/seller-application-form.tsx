"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { FormEvent } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Field, Input, Select, Textarea } from "@/components/ui/form";
import { Notice } from "@/components/ui/notice";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { useI18n } from "@/features/i18n/LocaleProvider";
import {
    createSellerApplication,
    getMySellerApplications,
} from "@/features/seller-applications/api";
import type { SellerApplication } from "@/features/seller-applications/types";

const SELLER_TYPES = [
    "individual",
    "sole_proprietor",
    "company",
    "producer_coop",
] as const;

const PRODUCT_COUNT_RANGES = ["1-10", "11-50", "51-200", "200+"] as const;

const emptyForm = {
    full_name: "",
    phone: "",
    city: "",
    seller_type: "",
    business_name: "",
    tax_number: "",
    website_or_social: "",
    product_category: "",
    product_description: "",
    estimated_product_count: "",
    kvkk_consent: false,
    website_url_hp: "",
};

function formatDate(value: string, locale: string) {
    return new Date(value).toLocaleDateString(
        locale === "en" ? "en-US" : "tr-TR",
        {
            day: "numeric",
            month: "long",
            year: "numeric",
        },
    );
}

export default function SellerApplicationForm() {
    const { t } = useI18n();
    const {
        user,
        loading: authLoading,
        isAuthenticated,
    } = useAuth();

    const [form, setForm] = useState(emptyForm);
    const [application, setApplication] = useState<SellerApplication | null>(
        null,
    );
    const [applicationChecked, setApplicationChecked] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    const isCompanyType =
        form.seller_type === "sole_proprietor" ||
        form.seller_type === "company" ||
        form.seller_type === "producer_coop";

    useEffect(() => {
        if (authLoading || !isAuthenticated) {
            return;
        }

        let cancelled = false;

        (async () => {
            try {
                const applications = await getMySellerApplications();

                if (!cancelled) {
                    setApplication(applications[0] ?? null);
                }
            } catch {
                // Basvuru durumu alinamazsa form gosterilmeye devam eder.
            } finally {
                if (!cancelled) {
                    setApplicationChecked(true);
                }
            }
        })();

        return () => {
            cancelled = true;
        };
    }, [authLoading, isAuthenticated]);

    function updateField(field: keyof typeof emptyForm, value: string | boolean) {
        setForm((current) => ({
            ...current,
            [field]: value,
        }));
    }

    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();

        setError("");
        setSubmitting(true);

        try {
            const accountFullName = user
                ? `${user.first_name} ${user.last_name}`.trim()
                : "";

            await createSellerApplication({
                full_name: form.full_name.trim() || accountFullName,
                phone: form.phone.trim(),
                city: form.city.trim(),
                seller_type: form.seller_type,
                business_name: form.business_name.trim() || null,
                tax_number: form.tax_number.trim() || null,
                website_or_social: form.website_or_social.trim() || null,
                product_category: form.product_category.trim(),
                product_description: form.product_description.trim(),
                estimated_product_count: form.estimated_product_count,
                kvkk_consent: form.kvkk_consent,
                website_url_hp: form.website_url_hp || null,
            });

            const applications = await getMySellerApplications();

            setApplication(applications[0] ?? null);
            setSuccess(true);
            setForm(emptyForm);
        } catch (submitError) {
            setError(
                submitError instanceof Error
                    ? submitError.message
                    : t("seller.submitError"),
            );
        } finally {
            setSubmitting(false);
        }
    }

    if (authLoading) {
        return (
            <p className="text-foreground-muted">{t("common.loading")}</p>
        );
    }

    if (!isAuthenticated) {
        return (
            <div className="rounded-2xl border border-border bg-surface p-8">
                <h2 className="text-xl font-semibold">
                    {t("seller.applyLoginTitle")}
                </h2>

                <p className="mt-3 text-foreground-muted">
                    {t("seller.applyLoginDescription")}
                </p>

                <Link
                    href="/login"
                    className="mt-6 inline-flex rounded-full border border-border-strong bg-surface px-4 py-2 text-sm font-medium text-foreground transition hover:bg-surface-2"
                >
                    {t("common.login")}
                </Link>
            </div>
        );
    }

    if (!applicationChecked) {
        return (
            <p className="text-foreground-muted">{t("common.loading")}</p>
        );
    }

    const showStatusView = application !== null && application.status !== "rejected";

    if (showStatusView && application) {
        const statusTone =
            application.status === "approved"
                ? "success"
                : "warning";

        return (
            <div className="rounded-2xl border border-border bg-surface p-8">
                <div className="flex items-center justify-between gap-4">
                    <h2 className="text-xl font-semibold">
                        {t("seller.statusTitle")}
                    </h2>

                    <Badge tone={statusTone}>
                        {t(`admin.applications.${application.status}`)}
                    </Badge>
                </div>

                <p className="mt-2 text-sm text-foreground-muted">
                    {t("seller.statusDate")}: {" "}
                    {formatDate(application.created_at, "tr")}
                </p>

                {application.status === "approved" ? (
                    <div className="mt-6">
                        <p className="font-semibold text-success-fg">
                            {t("seller.statusApprovedTitle")}
                        </p>

                        <p className="mt-2 text-foreground-muted">
                            {t("seller.statusApprovedDescription")}
                        </p>
                    </div>
                ) : (
                    <div className="mt-6">
                        <Notice tone="info">
                            <p className="font-semibold">
                                {t("seller.statusPendingTitle")}
                            </p>

                            <p className="mt-1">
                                {t("seller.statusPendingDescription")}
                            </p>
                        </Notice>
                    </div>
                )}

                <Link
                    href="/account"
                    className="mt-6 inline-block text-sm font-semibold text-primary hover:underline"
                >
                    {t("account.label")} →
                </Link>
            </div>
        );
    }

    return (
        <form
            onSubmit={handleSubmit}
            className="space-y-8"
        >
            {success && (
                <Notice tone="success" role="status">
                    {t("seller.statusPendingTitle")} — {t("seller.statusPendingDescription")}
                </Notice>
            )}

            {error && (
                <Notice tone="error" role="alert">
                    {error}
                </Notice>
            )}

            {application?.status === "rejected" && (
                <Notice tone="warning">
                    <p className="font-semibold">
                        {t("seller.statusRejectedTitle")}
                    </p>

                    <p className="mt-1">
                        {t("seller.statusRejectedDescription")}
                    </p>

                    {application.admin_note && (
                        <p className="mt-2">
                            <span className="font-medium">
                                {t("seller.adminNote")}:
                            </span>{" "}
                            {application.admin_note}
                        </p>
                    )}
                </Notice>
            )}

            <section className="rounded-2xl border border-border bg-surface p-6">
                <h2 className="text-lg font-semibold">
                    {t("seller.contactTitle")}
                </h2>

                <div className="mt-6 space-y-5">
                    <Field
                        label={t("seller.fullName")}
                        htmlFor="full_name"
                    >
                        <Input
                            id="full_name"
                            value={form.full_name}
                            onChange={(event) =>
                                updateField("full_name", event.target.value)
                            }
                            placeholder={
                                user
                                    ? `${user.first_name} ${user.last_name}`.trim()
                                    : t("seller.fullNamePlaceholder")
                            }
                            required
                            maxLength={120}
                        />
                    </Field>

                    <div className="grid gap-5 sm:grid-cols-2">
                        <Field
                            label={t("seller.phone")}
                            htmlFor="phone"
                        >
                            <Input
                                id="phone"
                                type="tel"
                                value={form.phone}
                                onChange={(event) =>
                                    updateField("phone", event.target.value)
                                }
                                placeholder={t("seller.phonePlaceholder")}
                                required
                                minLength={10}
                                maxLength={32}
                            />
                        </Field>

                        <Field
                            label={t("seller.city")}
                            htmlFor="city"
                        >
                            <Input
                                id="city"
                                value={form.city}
                                onChange={(event) =>
                                    updateField("city", event.target.value)
                                }
                                placeholder={t("seller.cityPlaceholder")}
                                required
                                minLength={2}
                                maxLength={80}
                            />
                        </Field>
                    </div>

                    <p className="text-xs text-foreground-subtle">
                        {t("seller.email")}: {user?.email}
                    </p>
                </div>
            </section>

            <section className="rounded-2xl border border-border bg-surface p-6">
                <h2 className="text-lg font-semibold">
                    {t("seller.businessTitle")}
                </h2>

                <div className="mt-6 space-y-5">
                    <Field
                        label={t("seller.sellerType")}
                        htmlFor="seller_type"
                    >
                        <Select
                            id="seller_type"
                            value={form.seller_type}
                            onChange={(event) =>
                                updateField("seller_type", event.target.value)
                            }
                            required
                        >
                            <option value="" disabled>
                                {t("seller.sellerTypePlaceholder")}
                            </option>

                            {SELLER_TYPES.map((type) => (
                                <option key={type} value={type}>
                                    {t(`seller.sellerTypes.${type}`)}
                                </option>
                            ))}
                        </Select>
                    </Field>

                    <Field
                        label={t("seller.businessName")}
                        htmlFor="business_name"
                        hint={isCompanyType ? t("seller.businessNameRequired") : undefined}
                    >
                        <Input
                            id="business_name"
                            value={form.business_name}
                            onChange={(event) =>
                                updateField("business_name", event.target.value)
                            }
                            placeholder={t("seller.businessNamePlaceholder")}
                            required={isCompanyType}
                            maxLength={160}
                        />
                    </Field>

                    <div className="grid gap-5 sm:grid-cols-2">
                        <Field
                            label={t("seller.taxNumber")}
                            htmlFor="tax_number"
                            hint={t("seller.taxNumberHint")}
                        >
                            <Input
                                id="tax_number"
                                inputMode="numeric"
                                value={form.tax_number}
                                onChange={(event) =>
                                    updateField("tax_number", event.target.value)
                                }
                                maxLength={11}
                            />
                        </Field>

                        <Field
                            label={t("seller.websiteOrSocial")}
                            htmlFor="website_or_social"
                        >
                            <Input
                                id="website_or_social"
                                type="url"
                                value={form.website_or_social}
                                onChange={(event) =>
                                    updateField(
                                        "website_or_social",
                                        event.target.value,
                                    )
                                }
                                placeholder={t("seller.websiteOrSocialPlaceholder")}
                                maxLength={255}
                            />
                        </Field>
                    </div>
                </div>
            </section>

            <section className="rounded-2xl border border-border bg-surface p-6">
                <h2 className="text-lg font-semibold">
                    {t("seller.productsTitle")}
                </h2>

                <div className="mt-6 space-y-5">
                    <Field
                        label={t("seller.productCategory")}
                        htmlFor="product_category"
                    >
                        <Input
                            id="product_category"
                            value={form.product_category}
                            onChange={(event) =>
                                updateField(
                                    "product_category",
                                    event.target.value,
                                )
                            }
                            placeholder={t("seller.productCategoryPlaceholder")}
                            required
                            minLength={2}
                            maxLength={80}
                        />
                    </Field>

                    <Field
                        label={t("seller.productDescription")}
                        htmlFor="product_description"
                        hint={t("seller.productDescriptionHint")}
                    >
                        <Textarea
                            id="product_description"
                            value={form.product_description}
                            onChange={(event) =>
                                updateField(
                                    "product_description",
                                    event.target.value,
                                )
                            }
                            required
                            minLength={20}
                            maxLength={2000}
                        />
                    </Field>

                    <Field
                        label={t("seller.estimatedCount")}
                        htmlFor="estimated_product_count"
                    >
                        <Select
                            id="estimated_product_count"
                            value={form.estimated_product_count}
                            onChange={(event) =>
                                updateField(
                                    "estimated_product_count",
                                    event.target.value,
                                )
                            }
                            required
                        >
                            <option value="" disabled>
                                {t("seller.sellerTypePlaceholder")}
                            </option>

                            {PRODUCT_COUNT_RANGES.map((range) => (
                                <option key={range} value={range}>
                                    {range}
                                </option>
                            ))}
                        </Select>
                    </Field>
                </div>
            </section>

            {/* Honeypot: botlar doldurur, gercek kullanicilar goremez. */}
            <div className="hidden" aria-hidden="true">
                <label htmlFor="website_url_hp">{t("seller.honeypotWebsite")}</label>

                <input
                    id="website_url_hp"
                    type="text"
                    tabIndex={-1}
                    autoComplete="off"
                    value={form.website_url_hp}
                    onChange={(event) =>
                        updateField("website_url_hp", event.target.value)
                    }
                />
            </div>

            <label className="flex items-start gap-3 text-sm leading-6">
                <input
                    type="checkbox"
                    checked={form.kvkk_consent}
                    onChange={(event) =>
                        updateField("kvkk_consent", event.target.checked)
                    }
                    className="mt-1 h-4 w-4"
                    required
                />

                <span>{t("seller.kvkkConsent")}</span>
            </label>

            <Button
                type="submit"
                size="lg"
                disabled={submitting}
                className="w-full"
            >
                {submitting ? t("seller.submitting") : t("seller.submit")}
            </Button>
        </form>
    );
}
