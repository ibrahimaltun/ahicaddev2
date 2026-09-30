import type { Product } from "./types";

export interface ProductListParams {
    page?: number;
    limit?: number;
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

    const query = searchParams.toString();

    const response = await fetch(
        `/products${query ? `?${query}` : ""}`,
        {
            next: {
                revalidate: 60,
            },
        },
    );

    if (!response.ok) {
        throw new Error("Failed to fetch products.");
    }

    return response.json();
}

export async function getProduct(
    slug: string,
): Promise<Product> {
    const response = await fetch(
        `/products/${encodeURIComponent(slug)}`,
        {
            next: {
                revalidate: 60,
            },
        },
    );

    if (!response.ok) {
        throw new Error("Failed to fetch product.");
    }

    return response.json();
}