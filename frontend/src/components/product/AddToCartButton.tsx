"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import { useAuth } from "@/features/auth/hooks/useAuth";
import { useCart } from "@/features/cart/CartProvider";

interface AddToCartButtonProps {
    productId: number;
    productName: string;
    disabled?: boolean;
}

export function AddToCartButton({
    productId,
    productName,
    disabled = false,
}: AddToCartButtonProps) {
    const router = useRouter();
    const {
        isAuthenticated,
        loading: authLoading,
    } = useAuth();
    const { addItem } = useCart();

    const [status, setStatus] = useState<
        "idle" | "loading" | "added" | "error"
    >("idle");
    const [errorMessage, setErrorMessage] = useState<
        string | null
    >(null);
    const resetTimeoutRef = useRef<ReturnType<
        typeof setTimeout
    > | null>(null);

    useEffect(() => {
        return () => {
            if (resetTimeoutRef.current) {
                clearTimeout(resetTimeoutRef.current);
            }
        };
    }, []);

    async function handleAddToCart() {
        if (!isAuthenticated) {
            router.push("/login");

            return;
        }

        setStatus("loading");
        setErrorMessage(null);

        try {
            await addItem(productId, 1);

            setStatus("added");

            if (resetTimeoutRef.current) {
                clearTimeout(resetTimeoutRef.current);
            }

            resetTimeoutRef.current = setTimeout(() => {
                setStatus("idle");
            }, 2000);
        } catch (error) {
            setStatus("error");
            setErrorMessage(
                error instanceof Error
                    ? error.message
                    : "Ürün sepete eklenemedi.",
            );
        }
    }

    const buttonLabel =
        status === "added"
            ? "Sepete Eklendi ✓"
            : status === "loading"
              ? "Ekleniyor..."
              : "Sepete Ekle";

    return (
        <div className="mt-8">
            <button
                type="button"
                disabled={disabled || authLoading || status === "loading"}
                onClick={handleAddToCart}
                className="w-full rounded-xl bg-neutral-950 px-6 py-3 text-sm font-medium text-white transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:bg-neutral-300"
            >
                {buttonLabel}
            </button>

            {status === "error" && errorMessage && (
                <p
                    role="alert"
                    className="mt-3 text-sm text-red-600"
                >
                    {errorMessage}
                </p>
            )}

            {status === "added" && !disabled && (
                <p className="mt-3 text-sm text-green-600">
                    {productName} sepetinize eklendi.
                </p>
            )}
        </div>
    );
}
