"use client";

import { useCallback, useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Notice } from "@/components/ui/notice";
import { useI18n } from "@/features/i18n/LocaleProvider";
import {
    approveSellerApplication,
    getSellerApplications,
    rejectSellerApplication,
} from "@/features/seller-applications/api";
import type {
    SellerApplication,
    SellerApplicationStatus,
} from "@/features/seller-applications/types";
import type { TranslationKey } from "@/lib/i18n/dictionary";

type Filter = SellerApplicationStatus | "all";

export function ApplicationsTab() {
    const { t } = useI18n();

    const [filter, setFilter] = useState<Filter>("pending");
    const [applications, setApplications] = useState<SellerApplication[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState("");
    const [actionError, setActionError] = useState("");
    const [processingId, setProcessingId] = useState<number | null>(null);
    const [noteDraft, setNoteDraft] = useState<Record<number, string>>({});
    const [reloadToken, setReloadToken] = useState(0);

    useEffect(() => {
        let cancelled = false;

        (async () => {
            setLoading(true);

            try {
                const data = await getSellerApplications(
                    filter === "all" ? undefined : filter,
                );

                if (!cancelled) {
                    setApplications(data);
                    setLoadError("");
                }
            } catch (loadError_) {
                if (!cancelled) {
                    setLoadError(
                        loadError_ instanceof Error
                            ? loadError_.message
                            : t("admin.applications.loadError"),
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
    }, [filter, reloadToken, t]);

    const reload = useCallback(() => {
        setReloadToken((token) => token + 1);
    }, []);

    async function handleDecision(
        applicationId: number,
        action: "approve" | "reject",
    ) {
        setProcessingId(applicationId);
        setActionError("");

        const note = noteDraft[applicationId]?.trim();

        try {
            if (action === "approve") {
                await approveSellerApplication(applicationId, { admin_note: note || null });
            } else {
                await rejectSellerApplication(applicationId, { admin_note: note || null });
            }

            reload();
        } catch (decisionError) {
            setActionError(
                decisionError instanceof Error
                    ? decisionError.message
                    : t("common.error"),
            );
        } finally {
            setProcessingId(null);
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-wrap gap-2">
                {(["pending", "approved", "rejected", "all"] as Filter[]).map(
                    (option) => (
                        <button
                            key={option}
                            type="button"
                            onClick={() => setFilter(option)}
                            className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                                filter === option
                                    ? "bg-primary text-primary-foreground"
                                    : "border border-border bg-surface text-foreground-muted hover:text-foreground"
                            }`}
                        >
                            {option === "all"
                                ? t("admin.applications.filterAll")
                                : t(`admin.applications.${option}`)}
                        </button>
                    ),
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
            ) : applications.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-border-strong bg-surface p-10 text-center text-foreground-muted">
                    {t("admin.applications.noApplications")}
                </div>
            ) : (
                <ul className="space-y-6">
                    {applications.map((application) => (
                        <li
                            key={application.id}
                            className="rounded-2xl border border-border bg-surface p-6"
                        >
                            <div className="flex flex-wrap items-center justify-between gap-4">
                                <div>
                                    <p className="font-semibold">
                                        {application.full_name}
                                    </p>

                                    <p className="mt-1 text-sm text-foreground-muted">
                                        {application.email} · {application.city} · {" "}
                                        {t(`seller.sellerTypes.${application.seller_type}` as TranslationKey)}
                                    </p>
                                </div>

                                <Badge
                                    tone={
                                        application.status === "approved"
                                            ? "success"
                                            : application.status === "rejected"
                                              ? "danger"
                                              : "warning"
                                    }
                                >
                                    {t(`admin.applications.${application.status}`)}
                                </Badge>
                            </div>

                            <dl className="mt-6 grid gap-4 text-sm sm:grid-cols-2">
                                <div>
                                    <dt className="text-foreground-muted">
                                        {t("admin.applications.contact")}
                                    </dt>

                                    <dd className="mt-1 font-medium">
                                        {application.phone} · {application.city}
                                    </dd>
                                </div>

                                <div>
                                    <dt className="text-foreground-muted">
                                        {t("admin.applications.business")}
                                    </dt>

                                    <dd className="mt-1 font-medium">
                                        {application.business_name ?? "—"}
                                        {application.tax_number
                                            ? ` · ${application.tax_number}`
                                            : ""}
                                    </dd>
                                </div>

                                <div>
                                    <dt className="text-foreground-muted">
                                        {t("admin.applications.products")}
                                    </dt>

                                    <dd className="mt-1 font-medium">
                                        {application.product_category} · {" "}
                                        {application.estimated_product_count}
                                    </dd>
                                </div>

                                {application.website_or_social && (
                                    <div>
                                        <dt className="text-foreground-muted">
                                            {t("seller.websiteOrSocial")}
                                        </dt>

                                        <dd className="mt-1 font-medium break-all">
                                            {application.website_or_social}
                                        </dd>
                                    </div>
                                )}

                                <div className="sm:col-span-2">
                                    <dt className="text-foreground-muted">
                                        {t("seller.productDescription")}
                                    </dt>

                                    <dd className="mt-1 leading-6">
                                        {application.product_description}
                                    </dd>
                                </div>
                            </dl>

                            {application.admin_note && (
                                <p className="mt-4 rounded-xl bg-surface-2 px-4 py-3 text-sm text-foreground-muted">
                                    <span className="font-medium">
                                        {t("seller.adminNote")}:
                                    </span>{" "}
                                    {application.admin_note}

                                    {application.decided_at && (
                                        <span className="block text-xs text-foreground-subtle">
                                            {t("admin.applications.decidedAt")}: {" "}
                                            {new Date(
                                                application.decided_at,
                                            ).toLocaleDateString("tr-TR")}
                                        </span>
                                    )}
                                </p>
                            )}

                            {application.status === "pending" && (
                                <div className="mt-6 space-y-3">
                                    <label
                                        className="block text-sm font-medium"
                                        htmlFor={`note-${application.id}`}
                                    >
                                        {t("admin.applications.noteLabel")}
                                    </label>

                                    <input
                                        id={`note-${application.id}`}
                                        type="text"
                                        value={noteDraft[application.id] ?? ""}
                                        onChange={(event) =>
                                            setNoteDraft((current) => ({
                                                ...current,
                                                [application.id]: event.target.value,
                                            }))
                                        }
                                        placeholder={t(
                                            "admin.applications.notePlaceholder",
                                        )}
                                        maxLength={1000}
                                        className="w-full"
                                    />

                                    <div className="flex flex-wrap gap-3">
                                        <Button
                                            variant="success"
                                            size="sm"
                                            disabled={
                                                processingId === application.id
                                            }
                                            onClick={() =>
                                                handleDecision(
                                                    application.id,
                                                    "approve",
                                                )
                                            }
                                        >
                                            {t("admin.applications.approve")}
                                        </Button>

                                        <Button
                                            variant="danger-outline"
                                            size="sm"
                                            disabled={
                                                processingId === application.id
                                            }
                                            onClick={() =>
                                                handleDecision(
                                                    application.id,
                                                    "reject",
                                                )
                                            }
                                        >
                                            {t("admin.applications.reject")}
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}
