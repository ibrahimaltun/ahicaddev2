import type { Product } from "./types";

const API_BASE_URL =
    process.env.API_INTERNAL_URL ||
    "http://localhost:8000/api/v1";

export interface ProductListParams {
    page?: number;
    limit?: number;
    category?: string;
    q?: string;
    /** 0 -> her istekte guncel veri (no-store). */
    revalidate?: number;
}

export async function getProducts(
    params: ProductListParams = {},
): Promise<Product[]> {
    const searchParams = new URLSearchParams();

    if (params.page !== undefined) {
        searchParams.set("page", String(params.page));
    }

    if (params.limit !== undefined) {
        searchParams.set("limit", String(params.limit));
    }

    if (params.category !== undefined) {
        searchParams.set("category", params.category);
    }

    if (params.q !== undefined && params.q.trim() !== "") {
        searchParams.set("q", params.q.trim());
    }

    const query = searchParams.toString();

    const revalidate = params.revalidate ?? 60;

    const response = await fetch(
        `${API_BASE_URL}/products${query ? `?${query}` : ""}`,
        {
            next: {
                revalidate,
            },
        },
    );

    if (!response.ok) {
        const errorText = await response.text();

        throw new Error(
            `Ürünler çekilirken bir hata oluştu. Status: ${response.status}, Detail: ${errorText}`,
        );
    }

    return response.json();
}

/**
 * Sayfa + toplam kayit döndüren liste çekimi (X-Total-Count tabanli).
 * Sayfalama arayüzü bu fonksiyonu kullanir; liste canli veri isterse
 * `cache: "no-store"` ile güncel toplam görür.
 */
export async function getProductsPage(
    params: ProductListParams = {},
): Promise<{ items: Product[]; total: number }> {
    const searchParams = new URLSearchParams();

    searchParams.set(
        "page",
        String(Math.max(params.page ?? 1, 1)),
    );
    searchParams.set("limit", String(params.limit ?? 20));

    if (params.category !== undefined) {
        searchParams.set("category", params.category);
    }

    if (params.q !== undefined && params.q.trim() !== "") {
        searchParams.set("q", params.q.trim());
    }

    const query = searchParams.toString();

    const response = await fetch(
        `${API_BASE_URL}/products${query ? `?${query}` : ""}`,
        {
            cache: "no-store",
        },
    );

    if (!response.ok) {
        const errorText = await response.text();

        throw new Error(
            `Ürünler çekilirken bir hata oluştu. Status: ${response.status}, Detail: ${errorText}`,
        );
    }

    const items = (await response.json()) as Product[];
    const total = Number(response.headers.get("X-Total-Count"));

    return {
        items,
        total: Number.isFinite(total) ? total : items.length,
    };
}

export async function getRelatedProducts(
    slug: string,
    limit = 4,
): Promise<Product[]> {
    const response = await fetch(
        `${API_BASE_URL}/products/${encodeURIComponent(
            slug,
        )}/related?limit=${limit}`,
        {
            next: {
                revalidate: 60,
            },
        },
    );

    if (!response.ok) {
        throw new Error("Önerilen ürünler çekilirken bir hata oluştu.");
    }

    return response.json();
}

export async function getProduct(
    slug: string,
): Promise<Product> {
    const response = await fetch(
        `${API_BASE_URL}/products/${encodeURIComponent(slug)}`,
        {
            next: {
                revalidate: 60,
            },
        },
    );

    if (!response.ok) {
        throw new Error("Ürünler çekilirken bir hata oluştu.");
    }

    return response.json();
}