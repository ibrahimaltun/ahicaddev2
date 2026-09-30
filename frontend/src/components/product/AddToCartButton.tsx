"use client";

import { useCartStore } from "@/features/cart/store";

interface AddToCartButtonProps {
    productId: number;
    name: string;
    slug: string;
    price: string;
    imageUrl: string | null;
    disabled?: boolean;
}

export function AddToCartButton({
    productId,
    name,
    slug,
    price,
    imageUrl,
    disabled = false,
}: AddToCartButtonProps) {
    const addItem = useCartStore((state) => state.addItem);

    function handleAddToCart() {
        addItem({
            productId,
            name,
            slug,
            price,
            quantity: 1,
            imageUrl,
        });
    }

    return (
        <button
            type="button"
            disabled={disabled}
            onClick={handleAddToCart}
            className="mt-8 w-full rounded-xl bg-neutral-950 px-6 py-3 text-sm font-medium text-white transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:bg-neutral-300"
        >
            Add to Cart
        </button>
    );
}