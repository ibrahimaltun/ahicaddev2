export type SellerApplicationStatus = "pending" | "approved" | "rejected";

export interface SellerApplication {
    id: number;
    user_id: number;
    full_name: string;
    email: string;
    phone: string;
    city: string;
    seller_type: string;
    business_name: string | null;
    tax_number: string | null;
    website_or_social: string | null;
    product_category: string;
    product_description: string;
    estimated_product_count: string;
    status: SellerApplicationStatus;
    admin_note: string | null;
    decided_at: string | null;
    created_at: string;
}
