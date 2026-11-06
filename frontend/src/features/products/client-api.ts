import {
    apiFetch,
} from "@/lib/api/client";

import type { Product } from "./types";

/** Musteri urun girisi formu verisi (baslangic seviyesi alanlar). */
export interface CustomerProductPayload {
    name: string;
    description: string;
    price: number;
    stock: number;
    category_id: number;
    image_url?: string | null;
}

/**
 * Giris yapan musterinin urun girisi: urun 'pending' olarak onaya girer,
 * 5 dakika sonra otomatik onaylanir.
 */
export async function createCustomerProduct(
    payload: CustomerProductPayload,
): Promise<Product> {
    return apiFetch<Product>("/products/submissions", {
        method: "POST",
        body: JSON.stringify(payload),
    });
}

/** Giris yapan musterinin kendi urun girislerini durumlarıyla getirir. */
export async function getMyProductSubmissions(): Promise<Product[]> {
    return apiFetch<Product[]>("/products/submissions");
}
