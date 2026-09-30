export interface CartItem {
    productId: number;
    name: string;
    slug: string;
    price: string;
    quantity: number;
    imageUrl: string | null;
}

export interface CartState {
    items: CartItem[];
}