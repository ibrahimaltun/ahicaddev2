import {
    apiFetch,
    apiFetchEmpty,
} from "@/lib/api/client";

import type { Cart } from "./types";

export async function getCart(): Promise<Cart> {
    return apiFetch<Cart>("/cart");
}

export async function addCartItem(
    productId: number,
    quantity: number = 1,
): Promise<Cart> {
    return apiFetch<Cart>("/cart/items", {
        method: "POST",
        body: JSON.stringify({
            product_id: productId,
            quantity,
        }),
    });
}

export async function updateCartItem(
    itemId: number,
    quantity: number,
): Promise<Cart> {
    return apiFetch<Cart>(`/cart/items/${itemId}`, {
        method: "PATCH",
        body: JSON.stringify({ quantity }),
    });
}

export async function removeCartItem(itemId: number): Promise<void> {
    return apiFetchEmpty(`/cart/items/${itemId}`, {
        method: "DELETE",
    });
}

export async function clearCart(): Promise<void> {
    return apiFetchEmpty("/cart", {
        method: "DELETE",
    });
}
