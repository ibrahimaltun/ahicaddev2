/**
 * Blog icerik modeli. Yazilar statik olarak TypeScript verisi olarak tutulur;
 * boylece her yazi SSG ile derleme zamaninda tamamen statik HTML'e doner
 * (hizli TTFB + arama motorlari icin ideal taranabilirlik).
 */

export type ContentBlock =
    | { type: "paragraph"; text: string }
    | { type: "heading2"; text: string }
    | { type: "heading3"; text: string }
    | { type: "bulletList"; items: string[] }
    | { type: "numberedList"; items: string[] }
    | { type: "quote"; text: string; author?: string }
    | { type: "callout"; text: string };

export interface BlogSource {
    /** Kaynagin makaledeki gorunen adi, or. "Shopify - AI in Ecommerce" */
    label: string;
    publisher: string;
    url: string;
}

export interface BlogFaq {
    question: string;
    answer: string;
}

export interface BlogPost {
    /** URL parcasi: /blog/<slug> */
    slug: string;
    title: string;
    /** Arama sonucu ve sosyal paylasimlardaki ozet (~150-160 karakter) */
    excerpt: string;
    /** Yazi kategorisi: Yapay Zeka, Tasarim & Teknoloji, Pazarlama vb. */
    category: string;
    /** ISO tarih: YYYY-MM-DD */
    date: string;
    /** Icerik guncellendiyse ISO tarih */
    dateModified?: string;
    keywords: string[];
    readingMinutes: number;
    blocks: ContentBlock[];
    /** Makalenin basindaki "ozet ve cikarilar" kutusu */
    takeaways: string[];
    faqs: BlogFaq[];
    sources: BlogSource[];
}

export interface BlockHeading {
    id: string;
    text: string;
    level: 2 | 3;
}
