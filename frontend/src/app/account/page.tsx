"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Notice } from "@/components/ui/notice";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { useI18n } from "@/features/i18n/LocaleProvider";
import { getMySellerApplications } from "@/features/seller-applications/api";
import type { SellerApplication } from "@/features/seller-applications/types";

export default function AccountPage() {
    const { t } = useI18n();
    const {
        user,
        loading,
        isAuthenticated,
    } = useAuth();

    const [application, setApplication] = useState<SellerApplication | null>(
        null,
    );

    useEffect(() => {
        if (!isAuthenticated) {
            return;
        }

        let cancelled = false;

        (async () => {
            try {
                const applications = await getMySellerApplications();

                if (!cancelled && applications.length > 0) {
                    setApplication(applications[0]);
                }
            } catch {
                // Basvuru goruntuleme hesap sayfasini bozmasin.
            }
        })();

        return () => {
            cancelled = true;
        };
    }, [isAuthenticated]);

    if (loading) {
        return (
            <main className="mx-auto max-w-7xl px-6 py-20 lg:px-8">
                <p className="text-foreground-muted">
                    {t("account.loading")}
                </p>
            </main>
        );
    }

    if (!isAuthenticated || !user) {
        return (
            <main className="mx-auto max-w-7xl px-6 py-20 lg:px-8">
                <h1 className="text-3xl font-semibold">
                    {t("account.loginTitle")}
                </h1>

                <p className="mt-3 text-foreground-muted">
                    {t("account.loginDescription")}
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
        <main className="mx-auto max-w-7xl px-6 py-20 lg:px-8">
            <div className="max-w-2xl">
                <p className="text-sm font-medium text-foreground-subtle">
                    {t("account.label")}
                </p>

                <h1 className="mt-2 text-4xl font-semibold tracking-tight">
                    {t("account.welcome", { name: user.first_name })}
                </h1>

                <div className="mt-10 grid gap-4 sm:grid-cols-2">
                    <Link
                        href="/orders"
                        className="rounded-2xl border border-border bg-surface p-6 transition hover:border-primary"
                    >
                        <span className="font-medium">
                            {t("account.ordersTitle")}
                        </span>

                        <span className="mt-2 block text-sm text-foreground-muted">
                            {t("account.ordersDescription")}
                        </span>
                    </Link>

                    <Link
                        href="/cart"
                        className="rounded-2xl border border-border bg-surface p-6 transition hover:border-primary"
                    >
                        <span className="font-medium">
                            {t("account.cartTitle")}
                        </span>

                        <span className="mt-2 block text-sm text-foreground-muted">
                            {t("account.cartDescription")}
                        </span>
                    </Link>
                </div>

                {application && (
                    <div className="mt-8 rounded-2xl border border-border bg-surface p-6">
                        <div className="flex items-center justify-between gap-4">
                            <h2 className="text-lg font-semibold">
                                {t("seller.statusTitle")}
                            </h2>

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

                        {application.status === "rejected" && (
                            <div className="mt-4">
                                <Notice tone="warning">
                                    <p className="font-semibold">
                                        {t("seller.statusRejectedTitle")}
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

                                <Link
                                    href="/satici-ol/basvuru"
                                    className="mt-4 inline-block text-sm font-semibold text-primary hover:underline"
                                >
                                    {t("seller.applyAgain")} →
                                </Link>
                            </div>
                        )}

                        {application.status === "approved" && (
                            <p className="mt-4 text-sm text-foreground-muted">
                                {t("seller.statusApprovedDescription")}
                            </p>
                        )}

                        {application.status === "pending" && (
                            <p className="mt-4 text-sm text-foreground-muted">
                                {t("seller.statusPendingDescription")}
                            </p>
                        )}
                    </div>
                )}

                <div className="mt-8 rounded-2xl border border-border bg-surface p-6">
                    <h2 className="text-lg font-semibold">
                        {t("account.infoTitle")}
                    </h2>

                    <dl className="mt-6 space-y-4">
                        <div>
                            <dt className="text-sm text-foreground-muted">
                                {t("account.fullName")}
                            </dt>

                            <dd className="mt-1 font-medium">
                                {user.first_name} {user.last_name}
                            </dd>
                        </div>

                        <div>
                            <dt className="text-sm text-foreground-muted">
                                {t("account.email")}
                            </dt>

                            <dd className="mt-1 font-medium">
                                {user.email}
                            </dd>
                        </div>

                        <div>
                            <dt className="text-sm text-foreground-muted">
                                {t("account.roleTitle")}
                            </dt>

                            <dd className="mt-1 font-medium">
                                {user.role === "admin"
                                    ? t("account.roleAdmin")
                                    : t("account.roleCustomer")}
                            </dd>
                        </div>
                    </dl>
                </div>
            </div>
        </main>
    );
}
