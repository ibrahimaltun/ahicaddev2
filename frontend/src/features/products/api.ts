import type { Product } from "./types";

const API_BASE_URL =
    process.env.API_INTERNAL_URL ||
    "http://localhost:8000/api/v1";

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
        `${API_BASE_URL}/products${query ? `?${query}` : ""}`,
        {
            next: {
                revalidate: 60,
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