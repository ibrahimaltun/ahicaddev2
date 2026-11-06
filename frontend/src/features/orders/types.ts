export type OrderStatus =
    | "pending_payment"
    | "processing"
    | "shipped"
    | "delivered"
    | "cancelled";

import type { BadgeTone } from "@/components/ui/badge";

export const ORDER_STATUSES: OrderStatus[] = [
    "pending_payment",
    "processing",
    "shipped",
    "delivered",
    "cancelled",
];

/**
 * Durum makinesi (backend `ORDER_STATUS_TRANSITIONS` ile aynidir):
 * admin yalnizca bu gecisleri secebilir; gecersiz secim 409 dondurur.
 */
export const ALLOWED_ORDER_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
    pending_payment: ["processing", "cancelled"],
    processing: ["shipped", "cancelled"],
    shipped: ["delivered"],
    delivered: [],
    cancelled: [],
};

export function allowedStatusesFor(status: OrderStatus): OrderStatus[] {
    return ALLOWED_ORDER_TRANSITIONS[status] ?? [];
}

/** Durum rozetlerinin renk tonlari (i18n metinleri sozlukte tutulur). */
export const ORDER_STATUS_TONES: Record<OrderStatus, BadgeTone> = {
    pending_payment: "warning",
    processing: "info",
    shipped: "primary",
    delivered: "success",
    cancelled: "danger",
};

export interface OrderItem {
    id: number;
    product_id: number | null;
    product_name: string;
    unit_price: string;
    quantity: number;
}

export interface Order {
    id: number;
    status: OrderStatus;
    payment_method: string;
    total_price: string;
    shipping_full_name: string;
    shipping_phone: string;
    shipping_city: string;
    shipping_district: string;
    shipping_address: string;
    shipping_postal_code: string | null;
    created_at: string;
    items: OrderItem[];
}

export interface OrderCreateInput {
    shipping_full_name: string;
    shipping_phone: string;
    shipping_city: string;
    shipping_district: string;
    shipping_address: string;
    shipping_postal_code?: string | null;
}

export interface PaymentInfo {
    payment_method: "iban_transfer";
    iban: string;
    receiver: string;
    instructions: string;
}
