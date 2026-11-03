"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { useCart } from "@/features/cart/CartProvider";
import { useI18n } from "@/features/i18n/LocaleProvider";

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
    const { t } = useI18n();
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
                    : t("products.addToCartError"),
            );
        }
    }

    const buttonLabel =
        status === "added"
            ? t("products.addedToCart")
            : status === "loading"
              ? t("products.addingToCart")
              : t("products.addToCart");

    return (
        <div className="mt-8">
            <Button
                variant="primary"
                size="lg"
                disabled={disabled || authLoading || status === "loading"}
                onClick={handleAddToCart}
                className="w-full"
            >
                {buttonLabel}
            </Button>

            {status === "error" && errorMessage && (
                <p
                    role="alert"
                    className="mt-3 text-sm text-danger-fg"
                >
                    {errorMessage}
                </p>
            )}

            {status === "added" && !disabled && (
                <p className="mt-3 text-sm text-success-fg">
                    {productName} {t("products.addedToCartMessage")}
                </p>
            )}
        </div>
    );
}
