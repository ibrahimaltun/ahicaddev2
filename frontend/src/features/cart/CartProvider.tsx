"use client";

import {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useState,
} from "react";

import { useAuth } from "@/features/auth/hooks/useAuth";

import {
    addCartItem,
    clearCart,
    getCart,
    removeCartItem,
    updateCartItem,
} from "./api";
import type { Cart, CartItem } from "./types";

interface CartState {
    userId: number | null;
    cart: Cart | null;
    error: string | null;
}

interface CartContextValue {
    items: CartItem[];
    totalCount: number;
    isLoading: boolean;
    error: string | null;
    refresh: () => Promise<void>;
    addItem: (productId: number, quantity?: number) => Promise<void>;
    updateItem: (itemId: number, quantity: number) => Promise<void>;
    removeItem: (itemId: number) => Promise<void>;
    clear: () => Promise<void>;
}

const CART_LOAD_ERROR = "Sepet yüklenirken bir hata oluştu.";

const CartContext = createContext<CartContextValue | undefined>(
    undefined,
);

export function CartProvider({
    children,
}: {
    children: React.ReactNode;
}) {
    const { user, loading: authLoading } = useAuth();
    const [state, setState] = useState<CartState>({
        userId: null,
        cart: null,
        error: null,
    });

    const refresh = useCallback(async () => {
        if (!user) {
            setState({ userId: null, cart: null, error: null });

            return;
        }

        try {
            const nextCart = await getCart();

            setState({
                userId: user.id,
                cart: nextCart,
                error: null,
            });
        } catch {
            setState({
                userId: user.id,
                cart: null,
                error: CART_LOAD_ERROR,
            });
        }
    }, [user]);

    useEffect(() => {
        if (authLoading || !user) {
            return;
        }

        let cancelled = false;

        (async () => {
            if (!cancelled) {
                await refresh();
            }
        })();

        return () => {
            cancelled = true;
        };
    }, [user, authLoading, refresh]);

    const addItem = useCallback(
        async (productId: number, quantity: number = 1) => {
            if (!user) {
                return;
            }

            const nextCart = await addCartItem(productId, quantity);

            setState({
                userId: user.id,
                cart: nextCart,
                error: null,
            });
        },
        [user],
    );

    const updateItem = useCallback(
        async (itemId: number, quantity: number) => {
            if (!user) {
                return;
            }

            const nextCart = await updateCartItem(itemId, quantity);

            setState({
                userId: user.id,
                cart: nextCart,
                error: null,
            });
        },
        [user],
    );

    const removeItem = useCallback(
        async (itemId: number) => {
            if (!user) {
                return;
            }

            await removeCartItem(itemId);

            setState((current) => ({
                ...current,
                cart: current.cart
                    ? {
                        ...current.cart,
                        items: current.cart.items.filter(
                            (item) => item.id !== itemId,
                        ),
                    }
                    : current.cart,
            }));
        },
        [user],
    );

    const clear = useCallback(async () => {
        if (!user) {
            return;
        }

        await clearCart();

        setState((current) => ({
            ...current,
            cart: current.cart
                ? {
                    ...current.cart,
                    items: [],
                }
                : current.cart,
        }));
    }, [user]);

    const value = useMemo<CartContextValue>(() => {
        const isLoadedForUser =
            user !== null && state.userId === user.id;

        const items = isLoadedForUser
            ? state.cart?.items ?? []
            : [];

        return {
            items,
            totalCount: items.reduce(
                (total, item) => total + item.quantity,
                0,
            ),
            isLoading: user !== null && state.userId !== user.id,
            error: isLoadedAtUser(state, user) ? state.error : null,
            refresh,
            addItem,
            updateItem,
            removeItem,
            clear,
        };
    }, [state, user, refresh, addItem, updateItem, removeItem, clear]);

    return (
        <CartContext.Provider value={value}>
            {children}
        </CartContext.Provider>
    );
}

function isLoadedAtUser(
    state: CartState,
    user: { id: number } | null,
) {
    return user !== null && state.userId === user.id;
}

export function useCart() {
    const context = useContext(CartContext);

    if (!context) {
        throw new Error(
            "useCart must be used inside CartProvider",
        );
    }

    return context;
}

