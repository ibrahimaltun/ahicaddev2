import type { OrderItem, OrderStatus } from "@/features/orders/types";

export interface AdminStats {
    users_total: number;
    products_total: number;
    products_active: number;
    categories_total: number;
    orders_total: number;
    orders_by_status: Record<string, number>;
    revenue_total: string;
    seller_applications_by_status: Record<string, number>;
}

export interface AdminUser {
    id: number;
    email: string;
    first_name: string;
    last_name: string;
    role: "customer" | "admin";
    is_active: boolean;
    created_at: string;
    orders_count: number;
}

export interface AdminProduct {
    id: number;
    name: string;
    slug: string;
    description: string | null;
    price: string;
    stock: number;
    is_active: boolean;
    category_id: number | null;
    category_name: string | null;
    primary_image_url: string | null;
}

export interface AdminOrder {
    id: number;
    user_id: number;
    user_email: string;
    status: OrderStatus;
    payment_method: string;
    total_price: string;
    shipping_full_name: string;
    shipping_city: string;
    created_at: string;
    items: OrderItem[];
}

export interface CatalogImportResult {
    source: string;
    created_categories: number;
    created_products: number;
    skipped_products: number;
    total_products: number;
}
