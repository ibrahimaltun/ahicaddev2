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
    /** Yüklenen gorsellerin sunucu URL'leri (/api/v1/media/...); en fazla 5. */
    image_urls?: string[];
}

interface UploadedFile {
    url: string;
    file_name: string;
    size: number;
}

/**
 * Urun gorsellerini sunucuya yukler; her dosya icin /api/v1/media/... URL'si
 * doner. multipart/form-data oldugu icin Content-Type basligi tarayiciya
 * birakilir (boundary otomatik eklenir).
 */
export async function uploadProductImages(
    files: File[],
): Promise<string[]> {
    const body = new FormData();

    for (const file of files) {
        body.append("files", file);
    }

    const response = await fetch("/api/v1/uploads", {
        method: "POST",
        credentials: "include",
        body,
    });

    if (!response.ok) {
        const error = await response.json().catch(() => null);

        throw new Error(
            error?.detail || "Görseller yüklenirken bir hata oluştu.",
        );
    }

    const data = (await response.json()) as { files: UploadedFile[] };

    return data.files.map((file) => file.url);
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
