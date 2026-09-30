"use client";

import Link from "next/link";
import { useAuth } from "@/features/auth/hooks/useAuth";

export default function AccountPage() {
    const {
        user,
        loading,
        isAuthenticated,
    } = useAuth();

    if (loading) {
        return (
            <main className="mx-auto max-w-7xl px-6 py-20 lg:px-8">
                <p className="text-neutral-600">
                    Hesabınız yükleniyor...
                </p>
            </main>
        );
    }

    if (!isAuthenticated || !user) {
        return (
            <main className="mx-auto max-w-7xl px-6 py-20 lg:px-8">
                <h1 className="text-3xl font-semibold">
                    Hesabınıza giriş yapın
                </h1>

                <p className="mt-3 text-neutral-600">
                    Hesap bilgilerinizi görüntülemek için giriş
                    yapmanız gerekiyor.
                </p>

                <Link
                    href="/login"
                    className="mt-6 inline-flex rounded-xl bg-neutral-950 px-5 py-3 text-sm font-medium text-white"
                >
                    Giriş Yap
                </Link>
            </main>
        );
    }

    return (
        <main className="mx-auto max-w-7xl px-6 py-20 lg:px-8">
            <div className="max-w-2xl">
                <p className="text-sm font-medium text-neutral-500">
                    Hesabım
                </p>

                <h1 className="mt-2 text-4xl font-semibold tracking-tight">
                    Hoş geldiniz, {user.first_name}
                </h1>

                <div className="mt-10 rounded-2xl border border-neutral-200 p-6">
                    <h2 className="text-lg font-semibold">
                        Hesap Bilgileri
                    </h2>

                    <dl className="mt-6 space-y-4">
                        <div>
                            <dt className="text-sm text-neutral-500">
                                Ad Soyad
                            </dt>

                            <dd className="mt-1 font-medium">
                                {user.first_name} {user.last_name}
                            </dd>
                        </div>

                        <div>
                            <dt className="text-sm text-neutral-500">
                                E-posta
                            </dt>

                            <dd className="mt-1 font-medium">
                                {user.email}
                            </dd>
                        </div>

                        <div>
                            <dt className="text-sm text-neutral-500">
                                Hesap türü
                            </dt>

                            <dd className="mt-1 font-medium">
                                {user.role === "admin"
                                    ? "Yönetici"
                                    : "Müşteri"}
                            </dd>
                        </div>
                    </dl>
                </div>
            </div>
        </main>
    );
}