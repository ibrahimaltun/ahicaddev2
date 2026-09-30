import type { Metadata } from "next";

import { getProduct } from "@/features/products/api";

interface ProductLayoutProps {
    children: React.ReactNode;
}

interface ProductLayoutParams {
    params: Promise<{
        slug: string;
    }>;
}

export async function generateMetadata({
    params,
}: ProductLayoutParams): Promise<Metadata> {
    const { slug } = await params;

    try {
        const product = await getProduct(slug);

        return {
            title: product.name,
            description:
                product.description ||
                `${product.name} - Ahicadde`,
            alternates: {
                canonical: `/products/${product.slug}`,
            },
            openGraph: {
                title: product.name,
                description:
                    product.description ||
                    `${product.name} - Ahicadde`,
                type: "website",
                images: product.images[0]
                    ? [product.images[0].image_url]
                    : undefined,
            },
        };
    } catch {
        return {
            title: "Product Not Found",
        };
    }
}

export default function ProductLayout({
    children,
}: ProductLayoutProps) {
    return children;
}