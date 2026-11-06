import type { Metadata } from "next";

import { getServerI18n } from "@/lib/i18n/server";

import ProductEntryForm from "./product-entry-form";

export const metadata: Metadata = {
    title: "Ürün Girişi | Ahicadde",
    robots: {
        index: false,
        follow: false,
    },
};

export default async function UrunEklePage() {
    const { t } = await getServerI18n();

    return (
        <main>
            <section className="mx-auto max-w-2xl px-6 py-16 lg:py-24">
                <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
                    {t("addProduct.title")}
                </h1>

                <p className="mt-4 mb-10 text-foreground-muted">
                    {t("addProduct.subtitle")}
                </p>

                <ProductEntryForm />
            </section>
        </main>
    );
}
