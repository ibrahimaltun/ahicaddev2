export interface CartProduct {
    id: number;
    name: string;
    slug: string;
    price: string;
    stock: number;
    is_sample: boolean;
    is_active: boolean;
    status: string;
    image_url: string | null;
}

export interface CartItem {
    id: number;
    quantity: number;
    product: CartProduct;
}

export interface Cart {
    id: number;
    items: CartItem[];
}

export type CartItemProblem = "unavailable" | "insufficient_stock" | null;

/**
 * Satır bazlı proaktif sepet uyarısı: ürün pasifleştirilmiş/onay geri
 * alınmışsa ya da sepetteki adet stoktan fazlaysa sorun döndürür.
 * Sipariş oluşturma zaten 400/409 döner; buradaki kontrol kullanıcıyı
 * ödeme adımına geçmeden önce uyarır.
 */
export function getCartItemProblem(item: CartItem): CartItemProblem {
    const product = item.product;

    if (!product.is_active || product.status !== "approved") {
        return "unavailable";
    }

    if (item.quantity > product.stock) {
        return "insufficient_stock";
    }

    return null;
}

export function hasCartProblem(items: CartItem[]): boolean {
    return items.some((item) => getCartItemProblem(item) !== null);
}
