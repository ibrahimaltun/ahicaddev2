export interface ProductImage {
    id: number;
    image_url: string;
    sort_order: number;
    is_primary: boolean;
}

export interface Product {
    id: number;
    name: string;
    slug: string;
    description: string | null;
    price: string;
    stock: number;
    is_active: boolean;
    category_id: number | null;
    brand_id: number | null;
    images: ProductImage[];
}