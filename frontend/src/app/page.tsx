import Link from "next/link";

import { ProductCard } from "@/components/product/ProductCard";
import { buttonClasses } from "@/components/ui/button";
import { getCategories } from "@/features/categories/api";
import { getProducts } from "@/features/products/api";
import { getServerI18n } from "@/lib/i18n/server";

import type { Metadata } from "next";
import type { Product } from "@/features/products/types";

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

const SITE_BASE = "https://ahicadde.com";

// Kategori kartlari icin token tabanli renk ciftleri (tum sayfalarda
// ayni palet: kiremit primary, bilgi mavi, basari yesili, uyari amber).
const CATEGORY_TINTS = [
    "bg-primary-soft text-primary-soft-foreground border-primary-soft",
    "bg-info-bg text-info-fg border-info-border",
    "bg-success-bg text-success-fg border-success-border",
    "bg-warning-bg text-warning-fg border-warning-border",
];

function TrustIcon() {
    return (
        <svg
            viewBox="0 0 24 24"
            aria-hidden="true"
            className="h-5 w-5 shrink-0 text-primary"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
        >
            <path d="m5 13 4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    );
}

function SectionHeader({
    label,
    title,
    description,
    viewAllText,
    viewAllHref,
}: {
    label: string;
    title: string;
    description: string;
    viewAllText: string;
    viewAllHref: string;
}) {
    return (
        <div className="flex flex-wrap items-end justify-between gap-4">
            <div className="max-w-2xl">
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">
                    {label}
                </p>

                <h2 className="mt-2 text-3xl font-semibold tracking-tight">
                    {title}
                </h2>

                <p className="mt-3 text-foreground-muted">{description}</p>
            </div>

            <Link
                href={viewAllHref}
                className="text-sm font-semibold text-primary transition-colors hover:text-primary-hover"
            >
                {viewAllText} →
            </Link>
        </div>
    );
}

function ProductGridSection({
    label,
    title,
    description,
    products,
    cardTexts,
}: {
    label: string;
    title: string;
    description: string;
    products: Product[];
    cardTexts: {
        viewDetails: string;
        outOfStock: string;
        noImage: string;
        sampleBadge: string;
        viewAll: string;
    };
}) {
    if (products.length === 0) {
        return null;
    }

    return (
        <section className="mx-auto max-w-7xl px-6 py-12 lg:px-8">
            <SectionHeader
                label={label}
                title={title}
                description={description}
                viewAllText={cardTexts.viewAll}
                viewAllHref="/products"
            />

            <div className="mt-8 grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">
                {products.map((product) => (
                    <ProductCard
                        key={product.id}
                        product={product}
                        viewDetailsText={cardTexts.viewDetails}
                        outOfStockText={cardTexts.outOfStock}
                        noImageText={cardTexts.noImage}
                        sampleBadgeText={cardTexts.sampleBadge}
                    />
                ))}
            </div>
        </section>
    );
}

export default async function Home() {
    const { t } = await getServerI18n();

    const [featured, moreProducts, categories] = await Promise.all([
        getProducts({ page: 1, limit: 8, revalidate: 0 }).catch(() => [] as Product[]),
        getProducts({ page: 2, limit: 8, revalidate: 0 }).catch(() => [] as Product[]),
        getCategories(0).catch(() => []),
    ]);

    const cultureParagraphs = t("home.cultureParagraphs").split("|");

    const deals = featured.slice(0, 8);
    const newArrivals = moreProducts.slice(0, 4);
    const popular = moreProducts.slice(4, 8);

    const featuredItemsJsonLd =
        featured.length > 0
            ? {
                  "@type": "ItemList",
                  name: t("home.featuredTitle"),
                  numberOfItems: featured.length,
                  itemListElement: featured.map((product, index) => ({
                      "@type": "ListItem",
                      position: index + 1,
                      item: {
                          "@type": "Product",
                          name: product.name,
                          url: `${SITE_BASE}/products/${product.slug}`,
                          ...(product.images[0]?.image_url
                              ? { image: product.images[0].image_url }
                              : {}),
                          offers: {
                              "@type": "Offer",
                              price: product.price,
                              priceCurrency: "TRY",
                          },
                      },
                  })),
              }
            : null;

    const SITE_JSON_LD = {
        "@context": "https://schema.org",
        "@graph": [
            {
                "@type": "WebSite",
                "@id": `${SITE_BASE}/#website`,
                url: SITE_BASE,
                name: "Ahicadde",
                description:
                    "Ahilik anlayışından ilham alan dayanışmacı e-ticaret pazaryeri.",
                inLanguage: "tr-TR",
                potentialAction: {
                    "@type": "SearchAction",
                    target: {
                        "@type": "EntryPoint",
                        urlTemplate: `${SITE_BASE}/products?q={search_term_string}`,
                    },
                    "query-input": "required name=search_term_string",
                },
            },
            {
                "@type": "Organization",
                "@id": `${SITE_BASE}/#organization`,
                name: "Ahicadde",
                url: SITE_BASE,
                description:
                    "Ahicadde; ahilik kültürünün dayanışma, paylaşma, dürüstlük ve karşılıklı güven anlayışından ilham alan yeni nesil bir e-ticaret pazaryeridir.",
            },
            ...(featuredItemsJsonLd ? [featuredItemsJsonLd] : []),
        ],
    };

    const cardTexts = {
        viewDetails: t("home.shopNow"),
        outOfStock: t("products.outOfStock"),
        noImage: t("home.noImage"),
        sampleBadge: t("products.sampleBadge"),
        viewAll: t("home.viewAll"),
    };

    const heroCollage = featured.slice(0, 4);

    return (
        <main className="min-h-screen bg-background text-foreground">
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(SITE_JSON_LD) }}
            />

            {/* ---------------------------------------------------------------------------
                Hero: Ahilik kimligi (mesaj korunur) + urun koleji
                --------------------------------------------------------------------------- */}
            <section className="relative overflow-hidden border-b border-border">
                <div
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(60%_70%_at_18%_0%,var(--primary-soft),transparent_65%)]"
                />

                <div className="mx-auto grid max-w-7xl items-center gap-12 px-6 pb-14 pt-12 lg:grid-cols-[1.05fr_0.95fr] lg:px-8 lg:pb-20 lg:pt-16">
                    <div className="max-w-2xl">
                        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">
                            {t("home.eyebrow")}
                        </p>

                        <h1 className="mt-5 text-3xl font-semibold leading-tight tracking-tight sm:text-4xl lg:text-5xl">
                            {t("home.heroTitleLine1")}
                            <br />
                            {t("home.heroTitleLine2")}
                        </h1>

                        <p className="mt-5 text-lg leading-8 text-foreground-muted">
                            {t("home.heroDescription")}
                        </p>

                        <div className="mt-8 flex flex-wrap items-center gap-3">
                            <Link
                                href="/products"
                                className={buttonClasses("primary", "lg")}
                            >
                                {t("home.ctaExplore")}
                            </Link>

                            <Link
                                href="/satici-ol"
                                className={buttonClasses("secondary", "lg")}
                            >
                                {t("home.ctaSeller")}
                            </Link>
                        </div>

                        {/* Guven maddeleri: kahraman bolumunde ozet */}
                        <ul className="mt-8 grid gap-3 sm:grid-cols-3">
                            <li className="flex items-center gap-2 text-sm font-medium text-foreground-muted">
                                <TrustIcon />
                                {t("home.trust1Title")}
                            </li>

                            <li className="flex items-center gap-2 text-sm font-medium text-foreground-muted">
                                <TrustIcon />
                                {t("home.trust2Title")}
                            </li>

                            <li className="flex items-center gap-2 text-sm font-medium text-foreground-muted">
                                <TrustIcon />
                                {t("home.trust3Title")}
                            </li>
                        </ul>
                    </div>

                    {/* Urun koleji: vitrindekilerden canli gorsel dokus */}
                    {heroCollage.length > 0 && (
                        <div
                            aria-hidden="true"
                            className="relative hidden h-80 lg:block"
                        >
                            {heroCollage.map((product, index) => {
                                const image = product.images[0]?.image_url;

                                if (!image) {
                                    return null;
                                }

                                const positions = [
                                    "left-2 top-6 rotate-[-4deg]",
                                    "left-32 top-0 rotate-3",
                                    "left-24 top-36 rotate-2",
                                    "left-52 top-28 rotate-[-3deg]",
                                ];

                                return (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img
                                        key={product.id}
                                        src={image}
                                        alt=""
                                        loading={index > 1 ? "lazy" : "eager"}
                                        className={`absolute h-40 w-40 rounded-2xl border border-border bg-surface object-cover shadow-md ${positions[index % positions.length]}`}
                                    />
                                );
                            })}

                            <span className="absolute right-4 top-4 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-md">
                                {t("home.dealsBadge")}
                            </span>
                        </div>
                    )}
                </div>
            </section>

            {/* ---------------------------------------------------------------------------
                Avantaj seridi: e-ticaret guven bantlari
                --------------------------------------------------------------------------- */}
            <section
                aria-label={t("home.trust1Title")}
                className="border-b border-border bg-surface"
            >
                <div className="mx-auto grid max-w-7xl gap-6 px-6 py-8 sm:grid-cols-3 lg:px-8">
                    <article className="flex items-start gap-3">
                        <TrustIcon />

                        <div>
                            <h2 className="text-sm font-semibold">
                                {t("home.trust1Title")}
                            </h2>

                            <p className="mt-1 text-sm text-foreground-muted">
                                {t("home.trust1Description")}
                            </p>
                        </div>
                    </article>

                    <article className="flex items-start gap-3">
                        <TrustIcon />

                        <div>
                            <h2 className="text-sm font-semibold">
                                {t("home.trust2Title")}
                            </h2>

                            <p className="mt-1 text-sm text-foreground-muted">
                                {t("home.trust2Description")}
                            </p>
                        </div>
                    </article>

                    <article className="flex items-start gap-3">
                        <TrustIcon />

                        <div>
                            <h2 className="text-sm font-semibold">
                                {t("home.trust3Title")}
                            </h2>

                            <p className="mt-1 text-sm text-foreground-muted">
                                {t("home.trust3Description")}
                            </p>
                        </div>
                    </article>
                </div>
            </section>

            {featured.length === 0 && moreProducts.length === 0 && (
                <section className="mx-auto max-w-7xl px-6 py-16 lg:px-8">
                    <div className="rounded-2xl border border-border bg-surface p-10 text-center">
                        <h2 className="text-xl font-semibold">
                            {t("home.featuredTitle")}
                        </h2>

                        <p className="mx-auto mt-3 max-w-lg text-foreground-muted">
                            {t("home.noProducts")}
                        </p>
                    </div>
                </section>
            )}

            {/* ---------------------------------------------------------------------------
                Kategoriler: renkli kartlar (hepsiburada kategori seridi duzeni)
                --------------------------------------------------------------------------- */}
            {categories.length > 0 && (
                <section className="mx-auto max-w-7xl px-6 py-12 lg:px-8">
                    <SectionHeader
                        label={t("home.featuredLabel")}
                        title={t("home.categoriesTitle")}
                        description={t("home.categoriesDescription")}
                        viewAllText={t("home.viewAll")}
                        viewAllHref="/kategoriler"
                    />

                    <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                        {categories.map((category, index) => (
                            <Link
                                key={category.id}
                                href={`/products?category=${encodeURIComponent(category.slug)}`}
                                className={`group flex items-center gap-4 rounded-2xl border p-5 transition hover:shadow-md ${CATEGORY_TINTS[index % CATEGORY_TINTS.length]}`}
                            >
                                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-surface text-lg font-bold text-foreground shadow-sm">
                                    {category.name.charAt(0).toLocaleUpperCase("tr-TR")}
                                </span>

                                <span className="min-w-0 flex-1">
                                    <span className="block truncate font-semibold">
                                        {category.name}
                                    </span>

                                    <span className="text-xs opacity-80">
                                        {t("categories.viewProducts")}
                                    </span>
                                </span>

                                <span
                                    aria-hidden="true"
                                    className="text-lg transition-transform group-hover:translate-x-1"
                                >
                                    →
                                </span>
                            </Link>
                        ))}
                    </div>
                </section>
            )}

            {/* ---------------------------------------------------------------------------
                Günün Fırsatları: yatay kaydırmalı urun seridi
                --------------------------------------------------------------------------- */}
            {deals.length > 0 && (
                <section className="border-y border-border bg-surface-2/60">
                    <div className="mx-auto max-w-7xl px-6 py-12 lg:px-8">
                        <SectionHeader
                            label={t("home.dealsLabel")}
                            title={t("home.dealsTitle")}
                            description={t("home.dealsDescription")}
                            viewAllText={t("home.viewAll")}
                            viewAllHref="/products"
                        />

                        <div
                            className="mt-8 -mx-6 flex snap-x snap-mandatory gap-4 overflow-x-auto px-6 pb-4 lg:mx-0 lg:px-0"
                            aria-label={t("home.dealsTitle")}
                        >
                            {deals.map((product) => (
                                <div
                                    key={product.id}
                                    className="relative w-52 shrink-0 snap-start sm:w-60"
                                >
                                    <span className="absolute right-3 top-3 z-10 rounded-full bg-danger-solid px-2.5 py-1 text-xs font-bold text-white shadow-sm">
                                        {t("home.dealsBadge")}
                                    </span>

                                    <ProductCard
                                        product={product}
                                        viewDetailsText={cardTexts.viewDetails}
                                        outOfStockText={cardTexts.outOfStock}
                                        noImageText={cardTexts.noImage}
                                        sampleBadgeText={cardTexts.sampleBadge}
                                    />
                                </div>
                            ))}
                        </div>

                        <p className="mt-2 text-sm text-foreground-subtle">
                            {t("home.sampleNote")}
                        </p>
                    </div>
                </section>
            )}

            {/* ---------------------------------------------------------------------------
                Ahilik kulturu bandı: urun bolumleri arasinda kimlik alani
                --------------------------------------------------------------------------- */}
            <section className="mx-auto max-w-7xl px-6 py-12 lg:px-8">
                <div className="overflow-hidden rounded-3xl border border-primary-soft bg-primary-soft">
                    <div className="flex flex-col gap-8 p-8 sm:p-10 lg:flex-row lg:items-center lg:justify-between lg:p-12">
                        <div className="max-w-2xl">
                            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">
                                Ahicadde · Ahilik
                            </p>

                            <h2 className="mt-3 text-2xl font-semibold tracking-tight text-primary-soft-foreground sm:text-3xl">
                                {t("home.cultureTitle")}
                            </h2>

                            <p className="mt-4 leading-7 text-primary-soft-foreground/90">
                                {cultureParagraphs[0]}
                            </p>

                            <Link
                                href="/ahilik"
                                className="mt-6 inline-flex rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary-hover"
                            >
                                {t("ahilik.label")} →
                            </Link>
                        </div>

                        <div
                            aria-hidden="true"
                            className="flex h-28 w-28 shrink-0 items-center justify-center rounded-full bg-primary text-4xl font-bold text-primary-foreground shadow-md"
                        >
                            A
                        </div>
                    </div>
                </div>
            </section>

            {/* Vitrine yeni eklenenler */}
            <ProductGridSection
                label={t("home.newArrivalsLabel")}
                title={t("home.newArrivalsTitle")}
                description={t("home.newArrivalsDescription")}
                products={newArrivals}
                cardTexts={cardTexts}
            />

            {/* ---------------------------------------------------------------------------
                Satici + urun girisi bandı
                --------------------------------------------------------------------------- */}
            <section className="mx-auto max-w-7xl px-6 py-6 lg:px-8">
                <div className="rounded-3xl bg-primary px-8 py-10 text-primary-foreground sm:px-10 lg:px-12">
                    <div className="flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
                        <div className="max-w-2xl">
                            <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
                                {t("home.sellerBandTitle")}
                            </h2>

                            <p className="mt-4 leading-7 text-primary-foreground/90">
                                {t("home.sellerBandDescription")}
                            </p>
                        </div>

                        <div className="flex flex-wrap items-center gap-3">
                            <Link
                                href="/satici-ol"
                                className={buttonClasses("secondary", "lg")}
                            >
                                {t("home.ctaSeller")}
                            </Link>

                            <Link
                                href="/urun-ekle"
                                className="rounded-xl border border-primary-foreground/50 px-6 py-3 text-base font-medium text-primary-foreground transition-colors hover:bg-primary-foreground/10"
                            >
                                {t("home.addProductCta")}
                            </Link>
                        </div>
                    </div>
                </div>
            </section>

            {/* Populer urunler */}
            <ProductGridSection
                label={t("home.popularLabel")}
                title={t("home.popularTitle")}
                description={t("home.popularDescription")}
                products={popular}
                cardTexts={cardTexts}
            />

            {/* Degerler */}
            <section className="border-t border-border bg-surface-2/60">
                <div className="mx-auto grid max-w-7xl gap-12 px-6 py-16 md:grid-cols-3 lg:px-8">
                    <article>
                        <h2 className="text-xl font-semibold">
                            {t("home.value1Title")}
                        </h2>

                        <p className="mt-3 leading-7 text-foreground-muted">
                            {t("home.value1Description")}
                        </p>
                    </article>

                    <article>
                        <h2 className="text-xl font-semibold">
                            {t("home.value2Title")}
                        </h2>

                        <p className="mt-3 leading-7 text-foreground-muted">
                            {t("home.value2Description")}
                        </p>
                    </article>

                    <article>
                        <h2 className="text-xl font-semibold">
                            {t("home.value3Title")}
                        </h2>

                        <p className="mt-3 leading-7 text-foreground-muted">
                            {t("home.value3Description")}
                        </p>
                    </article>
                </div>
            </section>

            {/* Ahilik kultur tam metni */}
            <section className="mx-auto max-w-4xl px-6 py-20 lg:px-8">
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
