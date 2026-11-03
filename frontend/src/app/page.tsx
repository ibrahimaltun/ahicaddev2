import Link from "next/link";

import { ProductCard } from "@/components/product/ProductCard";
import { buttonClasses } from "@/components/ui/button";
import { getCategories } from "@/features/categories/api";
import { getProducts } from "@/features/products/api";
import { getServerI18n } from "@/lib/i18n/server";

import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
    alternates: {
        canonical: "/",
    },
    openGraph: {
        title: "Ahicadde | Ahilik Anlayışından İlham Alan E-Ticaret Pazaryeri",
        description:
            "Emeğin değerini koruyan, dayanışmayla büyüyen pazar yeri. Ahicadde'de güvenle alışveriş yapın.",
        url: "https://ahicadde.com",
    },
};

const SITE_JSON_LD = {
    "@context": "https://schema.org",
    "@graph": [
        {
            "@type": "WebSite",
            "@id": "https://ahicadde.com/#website",
            url: "https://ahicadde.com",
            name: "Ahicadde",
            description:
                "Ahilik anlayışından ilham alan dayanışmacı e-ticaret pazaryeri.",
            inLanguage: "tr-TR",
            potentialAction: {
                "@type": "SearchAction",
                target: {
                    "@type": "EntryPoint",
                    urlTemplate: "https://ahicadde.com/products?q={search_term_string}",
                },
                "query-input": "required name=search_term_string",
            },
        },
        {
            "@type": "Organization",
            "@id": "https://ahicadde.com/#organization",
            name: "Ahicadde",
            url: "https://ahicadde.com",
            description:
                "Ahicadde; ahilik kültürünün dayanışma, paylaşma, dürüstlük ve karşılıklı güven anlayışından ilham alan yeni nesil bir e-ticaret pazaryeridir.",
        },
    ],
};

export default async function Home() {
    const { t } = await getServerI18n();

    const [featured, newArrivals, categories] = await Promise.all([
        getProducts({ page: 1, limit: 8, revalidate: 0 }).catch(() => []),
        getProducts({ page: 1, limit: 4, revalidate: 0 }).catch(() => []),
        getCategories(0).catch(() => []),
    ]);

    const cultureParagraphs = t("home.cultureParagraphs").split("|");

    return (
        <main className="min-h-screen bg-background text-foreground">
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(SITE_JSON_LD) }}
            />

            {/* Ahilik kimligi: ana mesaj ve aciklama */}
            <section className="relative overflow-hidden">
                <div
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(60%_60%_at_20%_0%,var(--primary-soft),transparent_70%)] opacity-70"
                />

                <section className="mx-auto max-w-7xl px-6 py-20 lg:px-8 lg:py-28">
                    <div className="max-w-4xl">
                        <p className="mb-6 text-sm font-semibold uppercase tracking-[0.2em] text-primary">
                            {t("home.eyebrow")}
                        </p>

                        <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl lg:text-6xl">
                            {t("home.heroTitleLine1")}
                            <br />
                            {t("home.heroTitleLine2")}
                        </h1>

                        <p className="mt-8 max-w-3xl text-lg leading-8 text-foreground-muted sm:text-xl">
                            {t("home.heroDescription")}
                        </p>

                        <div className="mt-10 flex flex-wrap gap-4">
                            <Link href="/products" className={buttonClasses("primary", "lg")}>
                                {t("home.ctaExplore")}
                            </Link>

                            <Link href="/satici-ol" className={buttonClasses("secondary", "lg")}>
                                {t("home.ctaSeller")}
                            </Link>
                        </div>
                    </div>
                </section>
            </section>

            {/* Guven seridi: e-ticaret standartlari */}
            <section className="border-y border-border bg-surface-2/60">
                <div className="mx-auto grid max-w-7xl gap-8 px-6 py-10 sm:grid-cols-3 lg:px-8">
                    {[1, 2, 3].map((index) => (
                        <div key={index} className="flex items-start gap-4">
                            <span
                                aria-hidden="true"
                                className="mt-1 inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-soft text-lg text-primary-soft-foreground"
                            >
                                {index === 1 ? "✓" : index === 2 ? "₺" : "◎"}
                            </span>

                            <div>
                                <h2 className="font-semibold">
                                    {t(`home.trust${index}Title` as "home.trust1Title")}
                                </h2>

                                <p className="mt-1 text-sm leading-6 text-foreground-muted">
                                    {t(`home.trust${index}Description` as "home.trust1Description")}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* Kategoriler */}
            {categories.length > 0 && (
                <section className="mx-auto max-w-7xl px-6 py-14 lg:px-8">
                    <div className="flex flex-wrap items-end justify-between gap-4">
                        <div>
                            <h2 className="text-2xl font-semibold tracking-tight">
                                {t("home.categoriesTitle")}
                            </h2>

                            <p className="mt-2 max-w-2xl text-foreground-muted">
                                {t("home.categoriesDescription")}
                            </p>
                        </div>
                    </div>

                    <ul className="mt-8 flex flex-wrap gap-3">
                        {categories.map((category) => (
                            <li key={category.id}>
                                <Link
                                    href={`/products?category=${encodeURIComponent(category.slug)}`}
                                    className="inline-flex rounded-full border border-border bg-surface px-5 py-2.5 text-sm font-medium text-foreground transition hover:border-primary hover:text-primary"
                                >
                                    {category.name}
                                </Link>
                            </li>
                        ))}
                    </ul>
                </section>
            )}

            {/* One cikan urunler */}
            <section className="border-y border-border bg-surface-2/60">
                <div className="mx-auto max-w-7xl px-6 py-16 lg:px-8">
                    <div className="flex flex-wrap items-end justify-between gap-4">
                        <div>
                            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">
                                {t("home.featuredLabel")}
                            </p>

                            <h2 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
                                {t("home.featuredTitle")}
                            </h2>

                            <p className="mt-3 max-w-2xl text-foreground-muted">
                                {t("home.featuredDescription")}
                            </p>
                        </div>

                        <Link
                            href="/products"
                            className="text-sm font-semibold text-primary transition-colors hover:text-primary-hover"
                        >
                            {t("home.viewAll")} →
                        </Link>
                    </div>

                    {featured.length === 0 ? (
                        <div className="mt-10 rounded-2xl border border-dashed border-border-strong bg-surface p-10 text-center">
                            <p className="text-foreground-muted">{t("home.noProducts")}</p>
                        </div>
                    ) : (
                        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                            {featured.map((product) => (
                                <ProductCard
                                    key={product.id}
                                    product={product}
                                    viewDetailsText={t("home.shopNow")}
                                    outOfStockText={t("products.outOfStock")}
                                    noImageText={t("home.noImage")}
                                    sampleBadgeText={t("products.sampleBadge")}
                                />
                            ))}
                        </div>
                    )}

                    {featured.length > 0 && (
                        <p className="mt-6 text-xs text-foreground-subtle">
                            {t("home.sampleNote")}
                        </p>
                    )}
                </div>
            </section>

            {/* Yeni eklenenler */}
            {newArrivals.length > 0 && (
                <section className="mx-auto max-w-7xl px-6 py-16 lg:px-8">
                    <div className="flex flex-wrap items-end justify-between gap-4">
                        <div>
                            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">
                                {t("home.newArrivalsLabel")}
                            </p>

                            <h2 className="mt-2 text-3xl font-semibold tracking-tight">
                                {t("home.newArrivalsTitle")}
                            </h2>

                            <p className="mt-3 max-w-2xl text-foreground-muted">
                                {t("home.newArrivalsDescription")}
                            </p>
                        </div>

                        <Link
                            href="/products"
                            className="text-sm font-semibold text-primary transition-colors hover:text-primary-hover"
                        >
                            {t("home.viewAll")} →
                        </Link>
                    </div>

                    <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                        {newArrivals.map((product) => (
                            <ProductCard
                                key={product.id}
                                product={product}
                                viewDetailsText={t("home.shopNow")}
                                outOfStockText={t("products.outOfStock")}
                                noImageText={t("home.noImage")}
                                sampleBadgeText={t("products.sampleBadge")}
                            />
                        ))}
                    </div>
                </section>
            )}

            {/* Degerler */}
            <section className="border-t border-border bg-surface-2/60">
                <div className="mx-auto grid max-w-7xl gap-12 px-6 py-20 md:grid-cols-3 lg:px-8">
                    <article>
                        <h2 className="text-xl font-semibold">{t("home.value1Title")}</h2>
                        <p className="mt-3 leading-7 text-foreground-muted">
                            {t("home.value1Description")}
                        </p>
                    </article>

                    <article>
                        <h2 className="text-xl font-semibold">{t("home.value2Title")}</h2>
                        <p className="mt-3 leading-7 text-foreground-muted">
                            {t("home.value2Description")}
                        </p>
                    </article>

                    <article>
                        <h2 className="text-xl font-semibold">{t("home.value3Title")}</h2>
                        <p className="mt-3 leading-7 text-foreground-muted">
                            {t("home.value3Description")}
                        </p>
                    </article>
                </div>
            </section>

            {/* Ahilik Kultur metni */}
            <section className="mx-auto max-w-4xl px-6 py-24 lg:px-8">
                <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
                    {t("home.cultureTitle")}
                </h2>

                <div className="mt-8 space-y-6 text-lg leading-8 text-foreground-muted">
                    {cultureParagraphs.map((paragraph, index) => (
                        <p key={index}>{paragraph}</p>
                    ))}
                </div>
            </section>
        </main>
    );
}