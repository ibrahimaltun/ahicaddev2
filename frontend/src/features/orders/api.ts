import { apiFetch } from "@/lib/api/client";

import type {
    Order,
    OrderCreateInput,
    OrderStatus,
    PaymentInfo,
} from "./types";

export async function getOrders(): Promise<Order[]> {
    return apiFetch<Order[]>("/orders");
}

export async function getOrder(orderId: number): Promise<Order> {
    return apiFetch<Order>(`/orders/${orderId}`);
}

export async function createOrder(
    input: OrderCreateInput,
): Promise<Order> {
    return apiFetch<Order>("/orders", {
        method: "POST",
        body: JSON.stringify({
            shipping_full_name: input.shipping_full_name,
            shipping_phone: input.shipping_phone,
            shipping_city: input.shipping_city,
            shipping_district: input.shipping_district,
            shipping_address: input.shipping_address,
            shipping_postal_code: input.shipping_postal_code || null,
        }),
    });
}

export async function cancelOrder(orderId: number): Promise<Order> {
    return apiFetch<Order>(`/orders/${orderId}/cancel`, {
        method: "POST",
    });
}

export async function getPaymentInfo(): Promise<PaymentInfo> {
    return apiFetch<PaymentInfo>("/orders/payment-info");
}

export async function updateOrderStatus(
    orderId: number,
    status: OrderStatus,
): Promise<Order> {
    return apiFetch<Order>(`/orders/${orderId}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
    });
}
