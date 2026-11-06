import { apiFetch, apiFetchEmpty, apiFetchWithTotal } from "@/lib/api/client";

import type {
    AdminOrder,
    AdminProduct,
    AdminStats,
    AdminUser,
    CatalogImportResult,
} from "./types";

export async function getAdminStats(): Promise<AdminStats> {
    return apiFetch<AdminStats>("/admin/stats");
}

export async function getAdminUsers(
    search?: string,
): Promise<AdminUser[]> {
    const query = search ? `?search=${encodeURIComponent(search)}` : "";

    return apiFetch<AdminUser[]>(`/admin/users${query}`);
}

export async function updateAdminUser(
    userId: number,
    payload: { role?: "customer" | "admin"; is_active?: boolean },
): Promise<AdminUser> {
    return apiFetch<AdminUser>(`/admin/users/${userId}`, {
        method: "PATCH",
        body: JSON.stringify(payload),
    });
}

export async function getAdminProducts(
    search?: string,
): Promise<AdminProduct[]> {
    const query = search ? `?search=${encodeURIComponent(search)}` : "";

    return apiFetch<AdminProduct[]>(`/admin/products${query}`);
}

export async function updateAdminProduct(
    productId: number,
    payload: {
        name?: string;
        price?: string;
        stock?: number;
        is_active?: boolean;
        description?: string;
    },
): Promise<AdminProduct> {
    return apiFetch<AdminProduct>(`/admin/products/${productId}`, {
        method: "PATCH",
        body: JSON.stringify(payload),
    });
}

export async function deleteAdminProduct(productId: number): Promise<void> {
    return apiFetchEmpty(`/admin/products/${productId}`, {
        method: "DELETE",
    });
}

export async function getAdminOrders(
    status?: string,
    page = 1,
): Promise<{ items: AdminOrder[]; total: number }> {
    const params = new URLSearchParams();

    if (status) {
        params.set("status", status);
    }

    if (page > 1) {
        params.set("page", String(page));
    }

    const query = params.toString();

    return apiFetchWithTotal<AdminOrder>(
        `/admin/orders${query ? `?${query}` : ""}`,
    );
}

export async function updateOrderStatus(
    orderId: number,
    status: "processing" | "shipped" | "delivered" | "cancelled",
) {
    return apiFetch(`/orders/${orderId}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
    });
}

export async function importExternalCatalog(
    limit = 30,
): Promise<CatalogImportResult> {
    return apiFetch<CatalogImportResult>("/admin/catalog/import", {
        method: "POST",
        body: JSON.stringify({ source: "dummyjson", limit }),
    });
}
