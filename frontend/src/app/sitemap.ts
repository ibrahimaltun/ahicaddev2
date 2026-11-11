import type { MetadataRoute } from "next";

import { BLOG_POSTS } from "@/features/blog/posts";
import { BLOG_BASE_PATH } from "@/lib/constants";

const baseUrl = "https://ahicadde.com";

const API_BASE_URL =
    process.env.API_INTERNAL_URL || "http://localhost:8000/api/v1";

interface SitemapProduct {
    slug: string;
}

interface SitemapCategory {
    slug: string;
}

// Sitemap, statik sayfalar + API'den cekilen urun/kategori URL'lerinden olusur.
// Yeni aktarilan ornek katalog urunlerinin arama motorlarina kisa surede
// yansimasi icin 10 dakikalik revalidate yeterlidir.
export const revalidate = 600;

async function fetchJson<T>(path: string): Promise<T[]> {
    try {
        const response = await fetch(`${API_BASE_URL}${path}`, {
            next: { revalidate: 3600 },
        });

        if (!response.ok) {
            return [];
        }

        return (await response.json()) as T[];
    } catch {
        return [];
    }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const [products, categories] = await Promise.all([
        fetchJson<SitemapProduct>("/products?limit=100"),
        fetchJson<SitemapCategory>("/categories"),
    ]);

    const staticEntries: MetadataRoute.Sitemap = [
        {
            url: baseUrl,
            lastModified: new Date(),
            changeFrequency: "daily",
            priority: 1,
        },
        {
            url: `${baseUrl}/products`,
            lastModified: new Date(),
            changeFrequency: "daily",
            priority: 0.9,
        },
        {
            url: `${baseUrl}/kategoriler`,
            lastModified: new Date(),
            changeFrequency: "weekly",
            priority: 0.8,
        },
        {
            url: `${baseUrl}/ahilik`,
            lastModified: new Date(),
            changeFrequency: "monthly",
            priority: 0.7,
        },
        {
            url: `${baseUrl}/dayanismaci-pazar-yeri`,
            lastModified: new Date(),
            changeFrequency: "monthly",
            priority: 0.7,
        },
        {
            url: `${baseUrl}${BLOG_BASE_PATH}`,
            lastModified: new Date(),
            changeFrequency: "weekly",
            priority: 0.7,
        },
        {
            url: `${baseUrl}/saticilar`,
            lastModified: new Date(),
            changeFrequency: "monthly",
            priority: 0.7,
        },
        {
            url: `${baseUrl}/satici-ol`,
            lastModified: new Date(),
            changeFrequency: "monthly",
            priority: 0.7,
        },
        {
            url: `${baseUrl}/hizmet-ucretleri`,
            lastModified: new Date(),
            changeFrequency: "monthly",
            priority: 0.6,
        },
    ];

    const productEntries: MetadataRoute.Sitemap = products.map((product) => ({
        url: `${baseUrl}/products/${product.slug}`,
        lastModified: new Date(),
        changeFrequency: "daily" as const,
        priority: 0.8,
    }));

    const categoryEntries: MetadataRoute.Sitemap = categories.map(
        (category) => ({
            url: `${baseUrl}/products?category=${encodeURIComponent(
                category.slug,
            )}`,
            lastModified: new Date(),
            changeFrequency: "weekly" as const,
            priority: 0.6,
        }),
    );

    const blogEntries: MetadataRoute.Sitemap = BLOG_POSTS.map((post) => ({
        url: `${baseUrl}${BLOG_BASE_PATH}/${post.slug}`,
        lastModified: new Date(post.dateModified ?? post.date),
        changeFrequency: "monthly" as const,
        priority: 0.7,
    }));

    return [...staticEntries, ...blogEntries, ...productEntries, ...categoryEntries];
}
