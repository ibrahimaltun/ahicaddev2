import Link from "next/link";

import { buttonClasses } from "@/components/ui/button";

import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Sayfa bulunamadı",
    robots: { index: false, follow: true },
};

export default function NotFound() {
    return (
        <main className="mx-auto flex min-h-[60vh] max-w-2xl flex-col items-center justify-center px-6 py-24 text-center lg:px-8">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">
                404
            </p>

            <h1 className="mt-4 text-4xl font-semibold tracking-tight sm:text-5xl">
                Sayfa bulunamadı
            </h1>

            <p className="mt-6 text-lg leading-8 text-foreground-muted">
                Aradığınız sayfa taşınmış veya hiç var olmamış olabilir.
                Ana sayfadan alışverişe devam edebilirsiniz.
            </p>

            <div className="mt-10 flex flex-wrap justify-center gap-4">
                <Link href="/" className={buttonClasses("primary", "lg")}>
                    Ana Sayfaya Dön
                </Link>

                <Link href="/products" className={buttonClasses("secondary", "lg")}>
                    Ürünleri Keşfet
                </Link>
            </div>
        </main>
    );
}
