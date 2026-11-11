/**
 * JSON-LD verisini `<script>` etiketine guvenli serilestirir.
 *
 * Kullanici girisi (urun adi, aciklamasi vb.) JSON-LD'ye girebildigi icin
 * "<", ">" ve satir ayirici karakterler kacirilir; aksi halde urun adina
 * yazilan "</script><script>alert(1)</script>" gibi bir deger sayfada
 * sakli XSS ile sonuclanir.
 */
export function jsonLdHtml(data: unknown): string {
    return JSON.stringify(data)
        .replace(/</g, "\\u003c")
        .replace(/>/g, "\\u003e")
        .replace(/\u2028/g, "\\u2028")
        .replace(/\u2029/g, "\\u2029");
}

const ORGANIZATION_NAME = "Ahicadde";
const ORGANIZATION_URL = "https://ahicadde.com";

export interface ArticleJsonLd {
    "@context": string;
    "@type": "BlogPosting";
    headline: string;
    description: string;
    datePublished: string;
    dateModified: string;
    keywords: string;
    author: Record<string, string>;
    publisher: Record<string, string>;
    mainEntityOfPage: Record<string, string>;
}

/**
 * Blog yazi sayfasi icin BlogPosting yapilandirilmis verisi.
 */
export function createArticleJsonLd({
    title,
    description,
    slug,
    datePublished,
    dateModified,
    keywords,
}: {
    title: string;
    description: string;
    slug: string;
    datePublished: string;
    dateModified: string;
    keywords: string[];
}): ArticleJsonLd {
    return {
        "@context": "https://schema.org",
        "@type": "BlogPosting",
        headline: title,
        description,
        datePublished,
        dateModified,
        keywords: keywords.join(", "),
        author: { "@type": "Organization", name: ORGANIZATION_NAME, url: ORGANIZATION_URL },
        publisher: { "@type": "Organization", name: ORGANIZATION_NAME, url: ORGANIZATION_URL },
        mainEntityOfPage: {
            "@type": "WebPage",
            "@id": `${ORGANIZATION_URL}/blog/${slug}`,
        },
    };
}

export interface BreadcrumbJsonLd {
    "@context": string;
    "@type": "BreadcrumbList";
    itemListElement: {
        "@type": "ListItem";
        position: number;
        name: string;
        item: string;
    }[];
}

/**
 * Icerik sayfalari icin BreadcrumbList yapilandirilmis verisi.
 */
export function createBreadcrumbJsonLd(
    items: { name: string; url: string }[],
): BreadcrumbJsonLd {
    return {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: items.map((item, index) => ({
            "@type": "ListItem",
            position: index + 1,
            name: item.name,
            item: item.url,
        })),
    };
}

export interface FaqJsonLd {
    "@context": string;
    "@type": "FAQPage";
    mainEntity: {
        "@type": "Question";
        name: string;
        acceptedAnswer: { "@type": "Answer"; text: string };
    }[];
}

/**
 * SSS bolumu olan icerik sayfalari icin FAQPage yapilandirilmis verisi.
 */
export function createFaqJsonLd(
    faqs: { question: string; answer: string }[],
): FaqJsonLd {
    return {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: faqs.map((faq) => ({
            "@type": "Question",
            name: faq.question,
            acceptedAnswer: { "@type": "Answer", text: faq.answer },
        })),
    };
}

export interface CollectionPageJsonLd {
    "@context": string;
    "@type": "CollectionPage";
    name: string;
    description: string;
    url: string;
}

/**
 * Blog listesi gibi icerik koleksiyonlari icin CollectionPage verisi.
 */
export function createCollectionPageJsonLd({
    name,
    description,
    path,
}: {
    name: string;
    description: string;
    path: string;
}): CollectionPageJsonLd {
    return {
        "@context": "https://schema.org",
        "@type": "CollectionPage",
        name,
        description,
        url: `${ORGANIZATION_URL}${path}`,
    };
}
