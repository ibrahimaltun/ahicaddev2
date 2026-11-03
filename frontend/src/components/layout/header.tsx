"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { useAuth } from "@/features/auth/hooks/useAuth";
import { useCart } from "@/features/cart/CartProvider";
import { useI18n } from "@/features/i18n/LocaleProvider";
import { useTheme } from "@/features/theme/ThemeProvider";

function SunIcon() {
    return (
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <circle cx="12" cy="12" r="4" />
            <path d="M12 2v2m0 16v2M4.93 4.93l1.41 1.41m11.32 11.32 1.41 1.41M2 12h2m16 0h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" strokeLinecap="round" />
        </svg>
    );
}

function MoonIcon() {
    return (
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79Z" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    );
}

function toggleClasses(active: boolean) {
    return active
        ? "bg-primary text-primary-foreground shadow-sm"
        : "text-foreground-muted hover:text-foreground";
}

export function Header() {
    const { t, locale, setLocale } = useI18n();
    const { theme, toggle: toggleTheme } = useTheme();
    const { user, loading, isAuthenticated, isAdmin, logout } = useAuth();
    const { totalCount: cartItemCount } = useCart();
    const router = useRouter();

    const [mobileOpen, setMobileOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");

    const closeMobileMenu = () => setMobileOpen(false);

    async function handleLogout() {
        await logout();
    }

    function handleSearch(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();

        const query = searchQuery.trim();

        if (query) {
            setMobileOpen(false);
            router.push(`/products?q=${encodeURIComponent(query)}`);
        }
    }

    const searchForm = (
        <form
            role="search"
            onSubmit={handleSearch}
            className="flex w-full items-center gap-2"
        >
            <label htmlFor="header-search" className="sr-only">
                {t("header.searchPlaceholder")}
            </label>

            <div className="relative flex-1">
                <svg
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                    className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground-subtle"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                >
                    <circle cx="11" cy="11" r="7" />
                    <path d="m20 20-3.5-3.5" strokeLinecap="round" />
                </svg>

                <input
                    id="header-search"
                    type="search"
                    value={searchQuery}
                    onChange={(event) => setSearchQuery(event.target.value)}
                    placeholder={t("header.searchPlaceholder")}
                    className="w-full rounded-full border border-border bg-surface py-2 pl-9 pr-4 text-sm text-foreground placeholder:text-foreground-subtle focus:border-primary focus:outline-none"
                />
            </div>

            <button
                type="submit"
                className="hidden rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary-hover sm:inline-flex"
            >
                {t("header.searchButton")}
            </button>
        </form>
    );

    return (
        <header className="sticky top-0 z-50 border-b border-border bg-header-bg backdrop-blur">
            <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-6 lg:px-8">
                <Link
                    href="/"
                    className="flex shrink-0 items-center gap-2 text-xl font-bold tracking-tight text-foreground"
                    aria-label="Ahicadde ana sayfa"
                >
                    <span
                        aria-hidden="true"
                        className="inline-block h-7 w-7 rounded-lg bg-primary text-primary-foreground"
                    />
                    Ahicadde
                </Link>

                <div className="hidden max-w-xl flex-1 md:block">
                    {searchForm}
                </div>

                <div className="flex items-center gap-1.5">
                    {/* Dil: TR/EN */}
                    <div
                        role="group"
                        aria-label={locale === "tr" ? "Dil seçimi" : "Language selection"}
                        className="hidden items-center rounded-full border border-border bg-surface p-0.5 sm:flex"
                    >
                        <button
                            type="button"
                            onClick={() => setLocale("tr")}
                            aria-pressed={locale === "tr"}
                            className={`rounded-full px-2.5 py-1 text-xs font-semibold transition-colors ${toggleClasses(locale === "tr")}`}
                        >
                            TR
                        </button>
                        <button
                            type="button"
                            onClick={() => setLocale("en")}
                            aria-pressed={locale === "en"}
                            className={`rounded-full px-2.5 py-1 text-xs font-semibold transition-colors ${toggleClasses(locale === "en")}`}
                        >
                            EN
                        </button>
                    </div>

                    {/* Tema: acik/koyu */}
                    <button
                        type="button"
                        onClick={toggleTheme}
                        aria-label={theme === "dark" ? t("header.switchToLight") : t("header.switchToDark")}
                        className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-border bg-surface text-foreground-muted transition-colors hover:text-foreground"
                    >
                        {theme === "dark" ? <SunIcon /> : <MoonIcon />}
                    </button>

                    {!loading && !isAuthenticated && (
                        <>
                            <Link
                                href="/login"
                                className="hidden rounded-full px-4 py-2 text-sm font-medium text-foreground-muted transition-colors hover:bg-surface-2 hover:text-foreground sm:inline-flex"
                            >
                                {t("common.login")}
                            </Link>

                            <Link
                                href="/register"
                                className="hidden rounded-full border border-border-strong px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-surface-2 sm:inline-flex"
                            >
                                {t("common.register")}
                            </Link>
                        </>
                    )}

                    {!loading && isAuthenticated && (
                        <>
                            <Link
                                href="/account"
                                className="hidden rounded-full px-4 py-2 text-sm font-medium text-foreground-muted transition-colors hover:bg-surface-2 hover:text-foreground sm:inline-flex"
                            >
                                {user?.first_name || t("header.myAccount")}
                            </Link>

                            {isAdmin && (
                                <Link
                                    href="/admin"
                                    className="hidden rounded-full px-4 py-2 text-sm font-medium text-primary transition-colors hover:bg-primary-soft sm:inline-flex"
                                >
                                    {t("header.admin")}
                                </Link>
                            )}

                            <button
                                type="button"
                                onClick={handleLogout}
                                className="hidden rounded-full px-4 py-2 text-sm font-medium text-foreground-muted transition-colors hover:bg-surface-2 hover:text-foreground sm:inline-flex"
                            >
                                {t("header.logout")}
                            </button>
                        </>
                    )}

                    <Link
                        href="/cart"
                        className="relative inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary-hover"
                    >
                        {t("header.cart")}

                        {cartItemCount > 0 && (
                            <span className="inline-flex min-w-5 items-center justify-center rounded-full bg-primary-foreground px-1.5 py-0.5 text-xs font-bold text-primary">
                                {cartItemCount}
                            </span>
                        )}
                    </Link>

                    <button
                        type="button"
                        aria-expanded={mobileOpen}
                        aria-label={t("header.menu")}
                        onClick={() => setMobileOpen((open) => !open)}
                        className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-border bg-surface text-foreground md:hidden"
                    >
                        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                            {mobileOpen ? (
                                <path d="M6 6l12 12M18 6 6 18" strokeLinecap="round" />
                            ) : (
                                <path d="M4 7h16M4 12h16M4 17h16" strokeLinecap="round" />
                            )}
                        </svg>
                    </button>
                </div>
            </div>

            {mobileOpen && (
                <div className="border-t border-border bg-surface px-6 py-4 md:hidden">
                    <div className="pb-3">{searchForm}</div>

                    <nav aria-label={t("header.navigation")} className="flex flex-col gap-1">
                        <div className="my-2 h-px bg-border" />

                        {!loading && !isAuthenticated && (
                            <>
                                <Link
                                    href="/login"
                                    onClick={closeMobileMenu}
                                    className="rounded-xl px-4 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-surface-2"
                                >
                                    {t("common.login")}
                                </Link>

                                <Link
                                    href="/register"
                                    onClick={closeMobileMenu}
                                    className="rounded-xl px-4 py-2.5 text-sm font-medium text-primary transition-colors hover:bg-primary-soft"
                                >
                                    {t("common.register")}
                                </Link>
                            </>
                        )}

                        {!loading && isAuthenticated && (
                            <>
                                <Link
                                    href="/account"
                                    onClick={closeMobileMenu}
                                    className="rounded-xl px-4 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-surface-2"
                                >
                                    {user?.first_name || t("header.myAccount")}
                                </Link>

                                {isAdmin && (
                                    <Link
                                        href="/admin"
                                        onClick={closeMobileMenu}
                                        className="rounded-xl px-4 py-2.5 text-sm font-medium text-primary transition-colors hover:bg-primary-soft"
                                    >
                                        {t("header.admin")}
                                    </Link>
                                )}

                                <button
                                    type="button"
                                    onClick={() => {
                                        closeMobileMenu();
                                        handleLogout();
                                    }}
                                    className="rounded-xl px-4 py-2.5 text-left text-sm font-medium text-foreground-muted transition-colors hover:bg-surface-2"
                                >
                                    {t("header.logout")}
                                </button>
                            </>
                        )}

                        <div className="my-2 h-px bg-border" />

                        <div className="flex items-center gap-2 px-4 pb-1">
                            <button
                                type="button"
                                onClick={() => setLocale("tr")}
                                aria-pressed={locale === "tr"}
                                className={`rounded-full border border-border px-3 py-1.5 text-xs font-semibold ${toggleClasses(locale === "tr")}`}
                            >
                                TR
                            </button>
                            <button
                                type="button"
                                onClick={() => setLocale("en")}
                                aria-pressed={locale === "en"}
                                className={`rounded-full border border-border px-3 py-1.5 text-xs font-semibold ${toggleClasses(locale === "en")}`}
                            >
                                EN
                            </button>
                        </div>
                    </nav>
                </div>
            )}
        </header>
    );
}
