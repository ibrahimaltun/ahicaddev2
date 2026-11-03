"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";

import { useAuth } from "@/features/auth/hooks/useAuth";
import {
    approveSellerApplication,
    getSellerApplications,
    rejectSellerApplication,
} from "@/features/seller-applications/api";
import type { SellerApplication } from "@/features/seller-applications/types";

type StatusFilter = "pending" | "approved" | "rejected";

const statusFilterLabels: Record<StatusFilter, string> = {
    pending: "Bekleyen",
    approved: "Onaylanan",
    rejected: "Reddedilen",
};

const sellerTypeLabels: Record<string, string> = {
    individual: "Bireysel",
    sole_proprietor: "Şahıs şirketi",
    company: "Şirket",
    producer_coop: "Üretici kooperatifi",
};

export default function AdminPage() {
    const {
        user,
        loading,
        isAdmin,
    } = useAuth();

    const [statusFilter, setStatusFilter] = useState<StatusFilter>("pending");
    const [applications, setApplications] = useState<SellerApplication[]>([]);
    const [applicationsLoading, setApplicationsLoading] = useState(false);
    const [loadError, setLoadError] = useState("");
    const [actionError, setActionError] = useState("");
    const [processingId, setProcessingId] = useState<number | null>(null);

    const loadApplications = useCallback(async () => {
        setApplicationsLoading(true);
        setLoadError("");

        try {
            const data = await getSellerApplications(statusFilter);
            setApplications(data);
        } catch (err) {
            setLoadError(
                err instanceof Error
                    ? err.message
                    : "Başvurular yüklenemedi.",
            );
        } finally {
            setApplicationsLoading(false);
        }
    }, [statusFilter]);

    useEffect(() => {
        let cancelled = false;

        (async () => {
            if (!cancelled) {
                await loadApplications();
            }
        })();

        return () => {
            cancelled = true;
        };
    }, [isAdmin, loadApplications]);

    async function handleDecision(
        applicationId: number,
        action: "approve" | "reject",
    ) {
        setProcessingId(applicationId);
        setActionError("");

        try {
            if (action === "approve") {
                await approveSellerApplication(applicationId);
            } else {
                await rejectSellerApplication(applicationId);
            }

            await loadApplications();
        } catch (err) {
            setActionError(
                err instanceof Error
                    ? err.message
                    : "İşlem tamamlanamadı.",
            );
        } finally {
            setProcessingId(null);
        }
    }

    if (loading) {
        return (
            <main className="mx-auto max-w-7xl px-6 py-20 lg:px-8">
                Yönetim paneli yükleniyor...
            </main>
        );
    }

    if (!isAdmin) {
        return (
            <main className="mx-auto max-w-7xl px-6 py-20 lg:px-8">
                <h1 className="text-3xl font-semibold">
                    Yetkisiz erişim
                </h1>

                <p className="mt-3 text-neutral-600">
                    Bu sayfaya erişmek için yönetici yetkisi
                    gerekiyor.
                </p>

                <Link
                    href="/"
                    className="mt-6 inline-flex rounded-full border border-neutral-200 px-4 py-2 text-sm font-medium text-neutral-700 transition hover:bg-neutral-100"
                >
                    Ana Sayfaya Dön
                </Link>
            </main>
        );
    }

    return (
        <main className="mx-auto max-w-7xl px-6 py-20 lg:px-8">
            <p className="text-sm text-neutral-500">
                Yönetim
            </p>

            <h1 className="mt-2 text-4xl font-semibold">
                Yönetim Paneli
            </h1>

            <p className="mt-4 text-neutral-600">
                Hoş geldiniz, {user?.first_name}. Satıcı başvurularını buradan
                yönetebilirsiniz.
            </p>

            <section className="mt-12">
                <div className="flex flex-wrap items-center justify-between gap-4">
                    <h2 className="text-2xl font-semibold tracking-tight">
                        Satıcı Başvuruları
                    </h2>

                    <div
                        className="flex gap-2 rounded-full border border-neutral-200 p-1"
                        role="group"
                        aria-label="Başvuru durumu filtresi"
                    >
                        {(Object.keys(statusFilterLabels) as StatusFilter[]).map(
                            (status) => (
                                <button
                                    key={status}
                                    type="button"
                                    onClick={() => setStatusFilter(status)}
                                    aria-pressed={statusFilter === status}
                                    className={
                                        statusFilter === status
                                            ? "rounded-full bg-neutral-950 px-4 py-1.5 text-sm font-medium text-white"
                                            : "rounded-full px-4 py-1.5 text-sm font-medium text-neutral-600 transition hover:bg-neutral-100"
                                    }
                                >
                                    {statusFilterLabels[status]}
                                </button>
                            ),
                        )}
                    </div>
                </div>

                {loadError && (
                    <div className="mt-6 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
                        {loadError}
                    </div>
                )}

                {actionError && (
                    <div className="mt-6 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
                        {actionError}
                    </div>
                )}

                {applicationsLoading ? (
                    <p className="mt-8 text-neutral-600">
                        Başvurular yükleniyor...
                    </p>
                ) : applications.length === 0 ? (
                    <div className="mt-8 rounded-2xl border border-neutral-200 p-8 text-center">
                        <p className="text-neutral-600">
                            Bu durumda görüntülenecek başvuru bulunmuyor.
                        </p>
                    </div>
                ) : (
                    <ul className="mt-8 space-y-4">
                        {applications.map((application) => (
                            <li
                                key={application.id}
                                className="rounded-2xl border border-neutral-200 p-6"
                            >
                                <div className="flex flex-wrap items-start justify-between gap-4">
                                    <div>
                                        <h3 className="text-lg font-semibold">
                                            {application.business_name ||
                                                application.full_name}
                                        </h3>

                                        <p className="mt-1 text-sm text-neutral-500">
                                            {application.full_name} ·{" "}
                                            {application.email} ·{" "}
                                            {application.city}
                                        </p>
                                    </div>

                                    <span
                                        className={
                                            application.status === "pending"
                                                ? "rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-800"
                                                : application.status ===
                                                      "approved"
                                                ? "rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-800"
                                                : "rounded-full bg-red-100 px-3 py-1 text-xs font-medium text-red-800"
                                        }
                                    >
                                        {
                                            statusFilterLabels[
                                                application.status as StatusFilter
                                            ]
                                        }
                                    </span>
                                </div>

                                <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
                                    <div>
                                        <dt className="text-neutral-500">
                                            Başvuru türü
                                        </dt>

                                        <dd className="font-medium">
                                            {sellerTypeLabels[
                                                application.seller_type
                                            ] || application.seller_type}
                                        </dd>
                                    </div>

                                    <div>
                                        <dt className="text-neutral-500">
                                            Ürün kategorisi
                                        </dt>

                                        <dd className="font-medium">
                                            {application.product_category}
                                        </dd>
                                    </div>

                                    <div>
                                        <dt className="text-neutral-500">
                                            Tahmini ürün adedi
                                        </dt>

                                        <dd className="font-medium">
                                            {application.estimated_product_count}
                                        </dd>
                                    </div>

                                    <div>
                                        <dt className="text-neutral-500">
                                            Telefon
                                        </dt>

                                        <dd className="font-medium">
                                            {application.phone}
                                        </dd>
                                    </div>

                                    <div className="sm:col-span-2">
                                        <dt className="text-neutral-500">
                                            Ürün açıklaması
                                        </dt>

                                        <dd className="mt-1 leading-6">
                                            {application.product_description}
                                        </dd>
                                    </div>
                                </dl>

                                {application.status === "pending" && (
                                    <div className="mt-6 flex gap-3">
                                        <button
                                            type="button"
                                            disabled={
                                                processingId === application.id
                                            }
                                            onClick={() =>
                                                handleDecision(
                                                    application.id,
                                                    "approve",
                                                )
                                            }
                                            className="rounded-xl bg-green-700 px-4 py-2 text-sm font-medium text-white transition hover:bg-green-800 disabled:cursor-not-allowed disabled:opacity-50"
                                        >
                                            Onayla
                                        </button>

                                        <button
                                            type="button"
                                            disabled={
                                                processingId === application.id
                                            }
                                            onClick={() =>
                                                handleDecision(
                                                    application.id,
                                                    "reject",
                                                )
                                            }
                                            className="rounded-xl border border-red-200 px-4 py-2 text-sm font-medium text-red-700 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                                        >
                                            Reddet
                                        </button>
                                    </div>
                                )}
                            </li>
                        ))}
                    </ul>
                )}
            </section>
        </main>
    );
}
