"use client";

import { useAuth } from "@/features/auth/hooks/useAuth";
import Link from "next/link";

export default function AdminPage() {
    const {
        user,
        loading,
        isAdmin,
    } = useAuth();

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
                    className="hidden rounded-full px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-200 sm:inline-flex"
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
                Hoş geldiniz, {user?.first_name}.
            </p>
        </main>
    );
}