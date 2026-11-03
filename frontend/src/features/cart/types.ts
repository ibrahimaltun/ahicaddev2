export interface CartProduct {
    id: number;
    name: string;
    slug: string;
    price: string;
    stock: number;
    is_sample: boolean;
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
