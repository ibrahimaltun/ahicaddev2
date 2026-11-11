import type { BlockHeading, BlogPost, ContentBlock } from "@/features/blog/types";

import { aiEcommercePost } from "@/features/blog/posts/ai-ecommerce";
import { ecommerceDesignPost } from "@/features/blog/posts/ecommerce-design";
import { marketingTrends2026Post } from "@/features/blog/posts/marketing-trends-2026";

/** Blog yazi verisi. SSG sayesinde derleme zamaninda HTML'e doner. */
export const BLOG_POSTS: readonly BlogPost[] = [
    marketingTrends2026Post,
    ecommerceDesignPost,
    aiEcommercePost,
];

/** Yazilari yayın tarihine gore yeniden eskiye siralar. */
export function getSortedBlogPosts(): BlogPost[] {
    return [...BLOG_POSTS].sort((a, b) => b.date.localeCompare(a.date));
}

export function getBlogPostBySlug(slug: string): BlogPost | undefined {
    return BLOG_POSTS.find((post) => post.slug === slug);
}

/** Detay sayfasinin altindaki "bunu da okuyun" listesi icin diger yazilar. */
export function getOtherBlogPosts(slug: string, count = 2): BlogPost[] {
    return getSortedBlogPosts().filter((post) => post.slug !== slug).slice(0, count);
}

/** generateStaticParams icin slug listesi. */
export function getBlogSlugs(): string[] {
    return BLOG_POSTS.map((post) => post.slug);
}

/**
 * Basligi birinci basamak: harf/cevirme disindaki karakterleri tireye cevirir,
 * kucuk harfe alir; blok icin kararlari id uretir.
 */
export function slugifyHeading(text: string): string {
    return text
        .toLocaleLowerCase("tr-TR")
        .replace(/[^a-z0-9çğıöşü]+/g, "-")
        .replace(/^-+|-+$/g, "");
}

/**
 * Icerik bloklarindan H2/H3 basliklarini cikarir (icerik numarasi + onceki
 * basliklar ile kararsama id'lerin benzersiz olmasi icin).
 */
export function getPostHeadings(blocks: ContentBlock[]): BlockHeading[] {
    const headings: BlockHeading[] = [];

    for (const block of blocks) {
        if (block.type === "heading2" || block.type === "heading3") {
            const level = block.type === "heading2" ? 2 : 3;
            let id = slugifyHeading(block.text);

            // Aynı başlık blok içinde tekrar ederse id'yi benzersizleştir.
            if (headings.some((heading) => heading.id === id)) {
                let suffix = 2;
                while (headings.some((h) => h.id === `${id}-${suffix}`)) {
                    suffix += 1;
                }
                id = `${id}-${suffix}`;
            }

            headings.push({ id, text: block.text, level });
        }
    }

    return headings;
}

/** Word-count tarzi metin uzunlugundan tahmini okuma suresi (dakika). */
export function estimateReadingMinutes(blocks: ContentBlock[]): number {
    const words = blocks
        .map((block) => {
            if (block.type === "paragraph" || block.type === "callout" || block.type === "quote") {
                return block.text.split(/\s+/).filter(Boolean).length;
            }
            if (block.type === "heading2" || block.type === "heading3") {
                return block.text.split(/\s+/).filter(Boolean).length;
            }
            return block.items.reduce((total, item) => total + item.split(/\s+/).filter(Boolean).length, 0);
        })
        .reduce((total, item) => total + item, 0);

    return Math.max(1, Math.round(words / 200));
}

/** Blog tarihini secilen dilde formatlar: 27 Ekim 2026 / October 27, 2026. */
export function formatBlogDate(isoDate: string, locale: "tr" | "en"): string {
    return new Intl.DateTimeFormat(locale === "tr" ? "tr-TR" : "en-US", {
        day: "numeric",
        month: "long",
        year: "numeric",
    }).format(new Date(isoDate));
}
