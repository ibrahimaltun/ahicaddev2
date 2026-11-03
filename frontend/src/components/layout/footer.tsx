"use client";

import Link from "next/link";

import { useI18n } from "@/features/i18n/LocaleProvider";

export function Footer() {
    const { t } = useI18n();

    return (
        <footer className="border-t border-footer-border bg-footer-bg text-footer-fg">
            <div className="mx-auto max-w-7xl px-6 py-16 lg:px-8">
                <div className="grid gap-12 md:grid-cols-4">
                    <div className="md:col-span-2">
                        <Link href="/" className="flex items-center gap-2 text-xl font-bold tracking-tight">
                            <span
                                aria-hidden="true"
                                className="inline-block h-7 w-7 rounded-lg bg-primary"
                            />
                            Ahicadde
                        </Link>

                        <p className="mt-4 max-w-md text-sm leading-6 text-footer-muted">
                            {t("footer.tagline")}
                        </p>
                    </div>

                    <div>
                        <h2 className="text-sm font-semibold text-footer-fg">
                            {t("footer.aboutTitle")}
                        </h2>

                        <nav className="mt-4 flex flex-col gap-3 text-sm text-footer-muted">
                            <Link href="/ahilik" className="transition-colors hover:text-footer-fg">
                                {t("footer.ahilik")}
                            </Link>

                            <Link
                                href="/dayanismaci-pazar-yeri"
                                className="transition-colors hover:text-footer-fg"
                            >
                                {t("footer.solidarityMarket")}
                            </Link>

                            <Link href="/hizmet-ucretleri" className="transition-colors hover:text-footer-fg">
                                {t("footer.fees")}
                            </Link>
                        </nav>
                    </div>

                    <div>
                        <h2 className="text-sm font-semibold text-footer-fg">
                            {t("footer.sellersTitle")}
                        </h2>

                        <nav className="mt-4 flex flex-col gap-3 text-sm text-footer-muted">
                            <Link href="/saticilar" className="transition-colors hover:text-footer-fg">
                                {t("footer.sellers")}
                            </Link>

                            <Link href="/satici-ol" className="transition-colors hover:text-footer-fg">
                                {t("footer.becomeSeller")}
                            </Link>
                        </nav>
                    </div>
                </div>

                <div className="mt-16 border-t border-footer-border pt-8 text-sm text-footer-muted">
                    © {new Date().getFullYear()} Ahicadde. {t("footer.rights")}
                </div>
            </div>
        </footer>
    );
}
