"use client";

import { useState } from "react";

import { useAuth } from "@/features/auth/hooks/useAuth";
import { useI18n } from "@/features/i18n/LocaleProvider";
import type { TranslationKey } from "@/lib/i18n/dictionary";

import { OverviewTab } from "./_components/overview-tab";
import { ApplicationsTab } from "./_components/applications-tab";
import { ProductsTab } from "./_components/products-tab";
import { OrdersTab } from "./_components/orders-tab";
import { UsersTab } from "./_components/users-tab";

type AdminTab = "overview" | "applications" | "products" | "orders" | "users";

const TABS: { id: AdminTab; key: TranslationKey }[] = [
    { id: "overview", key: "admin.tabs.overview" },
    { id: "applications", key: "admin.tabs.applications" },
    { id: "products", key: "admin.tabs.products" },
    { id: "orders", key: "admin.tabs.orders" },
    { id: "users", key: "admin.tabs.users" },
];

export default function AdminPage() {
    const { t } = useI18n();
    const { loading, isAdmin } = useAuth();

    const [activeTab, setActiveTab] = useState<AdminTab>("overview");

    if (loading) {
        return (
            <main className="mx-auto max-w-7xl px-6 py-20 lg:px-8">
                {t("admin.loading")}
            </main>
        );
    }

    if (!isAdmin) {
        return (
            <main className="mx-auto max-w-7xl px-6 py-20 lg:px-8">
                <h1 className="text-3xl font-semibold">
                    {t("admin.unauthorizedTitle")}
                </h1>

                <p className="mt-3 text-foreground-muted">
                    {t("admin.unauthorizedDescription")}
                </p>
            </main>
        );
    }

    return (
        <main className="mx-auto max-w-7xl px-6 py-12 lg:px-8">
            <h1 className="text-3xl font-semibold tracking-tight">
                {t("admin.title")}
            </h1>

            <div
                role="tablist"
                aria-label={t("admin.title")}
                className="mt-8 flex flex-wrap gap-2 border-b border-border pb-2"
            >
                {TABS.map((tab) => (
                    <button
                        key={tab.id}
                        type="button"
                        role="tab"
                        aria-selected={activeTab === tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                            activeTab === tab.id
                                ? "bg-primary text-primary-foreground shadow-sm"
                                : "text-foreground-muted hover:bg-surface-2 hover:text-foreground"
                        }`}
                    >
                        {t(tab.key)}
                    </button>
                ))}
            </div>

            <div className="mt-8">
                {activeTab === "overview" && <OverviewTab />}
                {activeTab === "applications" && <ApplicationsTab />}
                {activeTab === "products" && <ProductsTab />}
                {activeTab === "orders" && <OrdersTab />}
                {activeTab === "users" && <UsersTab />}
            </div>
        </main>
    );
}
