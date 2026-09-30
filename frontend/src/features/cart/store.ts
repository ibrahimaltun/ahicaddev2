import { create } from "zustand";
import { persist } from "zustand/middleware";

import type { CartItem } from "./types";

interface CartStore {
    items: CartItem[];
    addItem: (item: CartItem) => void;
    removeItem: (productId: number) => void;
    updateQuantity: (
        productId: number,
        quantity: number,
    ) => void;
    clearCart: () => void;
}

export const useCartStore = create<CartStore>()(
    persist(
        (set) => ({
            items: [],

            addItem: (item) =>
                set((state) => {
                    const existingItem = state.items.find(
                        (cartItem) =>
                            cartItem.productId === item.productId,
                    );

                    if (existingItem) {
                        return {
                            items: state.items.map((cartItem) =>
                                cartItem.productId === item.productId
                                    ? {
                                        ...cartItem,
                                        quantity:
                                            cartItem.quantity +
                                            item.quantity,
                                    }
                                    : cartItem,
                            ),
                        };
                    }

                    return {
                        items: [...state.items, item],
                    };
                }),

            removeItem: (productId) =>
                set((state) => ({
                    items: state.items.filter(
                        (item) =>
                            item.productId !== productId,
                    ),
                })),

            updateQuantity: (productId, quantity) =>
                set((state) => ({
                    items:
                        quantity > 0
                            ? state.items.map((item) =>
                                item.productId === productId
                                    ? {
                                        ...item,
                                        quantity,
                                    }
                                    : item,
                            )
                            : state.items.filter(
                                (item) =>
                                    item.productId !== productId,
                            ),
                })),

            clearCart: () => set({ items: [] }),
        }),
        {
            name: "ahicadde-cart",
        },
    ),
);