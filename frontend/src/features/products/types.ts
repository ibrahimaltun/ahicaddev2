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
    is_sample: boolean;
    is_active: boolean;
    /** Urun giris onay akisi: pending | approved | rejected. */
    status?: string;
    owner_user_id?: number | null;
    submitted_at?: string | null;
    category_id: number | null;
    brand_id: number | null;
    images: ProductImage[];
}