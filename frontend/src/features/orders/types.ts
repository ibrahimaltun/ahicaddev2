export type OrderStatus =
    | "pending_payment"
    | "processing"
    | "shipped"
    | "delivered"
    | "cancelled";

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
    pending_payment: "Ödeme Bekleniyor",
    processing: "Hazırlanıyor",
    shipped: "Kargoya Verildi",
    delivered: "Teslim Edildi",
    cancelled: "İptal Edildi",
};

export const ORDER_STATUS_CLASSES: Record<OrderStatus, string> = {
    pending_payment: "bg-amber-50 text-amber-700",
    processing: "bg-blue-50 text-blue-700",
    shipped: "bg-indigo-50 text-indigo-700",
    delivered: "bg-green-50 text-green-700",
    cancelled: "bg-red-50 text-red-700",
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
