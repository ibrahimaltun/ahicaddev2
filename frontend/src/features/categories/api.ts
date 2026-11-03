import type { Category } from "./types";

const API_BASE_URL =
    process.env.API_INTERNAL_URL ||
    "http://localhost:8000/api/v1";

export async function getCategories(): Promise<Category[]> {
    const response = await fetch(`${API_BASE_URL}/categories`, {
        next: {
            revalidate: 60,
        },
    });

    if (!response.ok) {
        throw new Error("Kategoriler çekilirken bir hata oluştu.");
    }

    return response.json();
}
