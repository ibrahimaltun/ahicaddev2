import { apiFetch } from "@/lib/api/client";

import type {
    SellerApplication,
    SellerApplicationStatus,
} from "./types";

export interface SellerApplicationInput {
    full_name: string;
    phone: string;
    city: string;
    seller_type: string;
    business_name: string | null;
    tax_number: string | null;
    website_or_social: string | null;
    product_category: string;
    product_description: string;
    estimated_product_count: string;
    kvkk_consent: boolean;
    website_url_hp?: string | null;
}

export async function getMySellerApplications(): Promise<SellerApplication[]> {
    return apiFetch<SellerApplication[]>("/seller-applications/mine");
}

export async function getSellerApplications(
    status?: SellerApplicationStatus,
): Promise<SellerApplication[]> {
    const query = status ? `?status=${encodeURIComponent(status)}` : "";

    return apiFetch<SellerApplication[]>(
        `/seller-applications/admin${query}`,
    );
}

export async function createSellerApplication(
    payload: SellerApplicationInput,
): Promise<SellerApplication> {
    return apiFetch<SellerApplication>("/seller-applications", {
        method: "POST",
        body: JSON.stringify(payload),
    });
}

export interface SellerApplicationDecisionInput {
    admin_note?: string | null;
}

export async function approveSellerApplication(
    applicationId: number,
    decision?: SellerApplicationDecisionInput,
): Promise<SellerApplication> {
    return apiFetch<SellerApplication>(
        `/seller-applications/admin/${applicationId}/approve`,
        {
            method: "PATCH",
            body: JSON.stringify(decision ?? {}),
        },
    );
}

export async function rejectSellerApplication(
    applicationId: number,
    decision?: SellerApplicationDecisionInput,
): Promise<SellerApplication> {
    return apiFetch<SellerApplication>(
        `/seller-applications/admin/${applicationId}/reject`,
        {
            method: "PATCH",
            body: JSON.stringify(decision ?? {}),
        },
    );
}
