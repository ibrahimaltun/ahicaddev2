"use client";

import Link from "next/link";

import { useAuth } from "@/features/auth/hooks/useAuth";
import { useCartStore } from "@/features/cart/store";

const navigation = [
    { href: "/urunler", label: "Ürünler" },
    { href: "/kategoriler", label: "Kategoriler" },
    { href: "/ahilik", label: "Ahilik" },
    { href: "/satici-ol", label: "Satıcı Ol" },
];

export function Header() {
    const {
        user,
        loading,
        isAuthenticated,
        isAdmin,
        logout,
    } = useAuth();

    async function handleLogout() {
        await logout();
    }

    const cartItemCount = useCartStore(
        (state) =>
            state.items.reduce(
                (total, item) => total + item.quantity,
                0,
            ),
    );


    return (
        <header className="sticky top-0 z-50 border-b border-neutral-200/80 bg-white/95 backdrop-blur">
            <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6 lg:px-8">
                <Link
                    href="/"
                    className="text-xl font-bold tracking-tight"
                    aria-label="Ahicadde ana sayfa"
                >
                    Ahicadde
                </Link>

                <nav
                    aria-label="Ana navigasyon"
                    className="hidden items-center gap-7 md:flex"
                >
                    {navigation.map((item) => (
                        <Link
                            key={item.href}
                            href={item.href}
                            className="text-sm font-medium text-neutral-600 transition-colors hover:text-neutral-950"
                        >
                            {item.label}
                        </Link>
                    ))}
                </nav>

                <div className="flex items-center gap-2">
                    {!loading && !isAuthenticated && (
                        <>
                            <Link
                                href="/login"
                                className="hidden rounded-full px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-200 sm:inline-flex"
                            >
                                Giriş Yap
                            </Link>

                            <Link
                                href="/register"
                                className="hidden rounded-full px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-200 sm:inline-flex"
                            >
                                Kayıt Ol
                            </Link>
                        </>
                    )}

                    {!loading && isAuthenticated && (
                        <>
                            <Link
                                href="/account"
                                className="hidden rounded-full px-4 py-2 text-sm font-medium text-neutral-700 transition-colors hover:bg-neutral-100 hover:text-neutral-950 sm:inline-flex"
                            >
                                {user?.first_name || "Hesabım"}
                            </Link>

                            {isAdmin && (
                                <Link
                                    href="/admin"
                                    className="hidden rounded-full px-4 py-2 text-sm font-medium text-neutral-700 transition-colors hover:bg-neutral-100 hover:text-neutral-950 sm:inline-flex"
                                >
                                    Yönetim
                                </Link>
                            )}

                            <button
                                type="button"
                                onClick={handleLogout}
                                className="hidden rounded-full px-4 py-2 text-sm font-medium text-neutral-700 transition-colors hover:bg-neutral-100 hover:text-neutral-950 sm:inline-flex"
                            >
                                Çıkış
                            </button>
                        </>
                    )}

                    <Link
                        href="/cart"
                        className="relative rounded-full bg-neutral-750 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-neutral-200"
                    >
                        Sepet

                        {cartItemCount > 0 && (
                            <span className="ml-2 inline-flex min-w-5 items-center justify-center rounded-full bg-white px-1.5 py-0.5 text-xs font-semibold text-neutral-950">
                                {cartItemCount}
                            </span>
                        )}
                    </Link>
                </div>
            </div>
        </header>
    );
}