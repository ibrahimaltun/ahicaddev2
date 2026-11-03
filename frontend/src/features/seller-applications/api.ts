import { apiFetch } from "@/lib/api/client";

import type { SellerApplication } from "./types";

export async function getSellerApplications(
    status?: "pending" | "approved" | "rejected",
): Promise<SellerApplication[]> {
    const query = status ? `?status=${encodeURIComponent(status)}` : "";

    return apiFetch<SellerApplication[]>(
        `/seller-applications/admin${query}`,
    );
}

export async function approveSellerApplication(
    applicationId: number,
): Promise<SellerApplication> {
    return apiFetch<SellerApplication>(
        `/seller-applications/admin/${applicationId}/approve`,
        { method: "PATCH" },
    );
}

export async function rejectSellerApplication(
    applicationId: number,
): Promise<SellerApplication> {
    return apiFetch<SellerApplication>(
        `/seller-applications/admin/${applicationId}/reject`,
        { method: "PATCH" },
    );
}
