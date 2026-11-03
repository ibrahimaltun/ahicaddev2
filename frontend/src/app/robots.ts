import type { MetadataRoute } from "next";

const baseUrl = "https://ahicadde.com";

export default function robots(): MetadataRoute.Robots {
    return {
        rules: [
            {
                userAgent: "*",
                allow: "/",
                disallow: [
                    "/api/",
                    "/admin/",
                    "/account/",
                    "/cart/",
                    "/orders/",
                    "/login",
                    "/register",
                    "/checkout/",
                ],
            },
        ],
        sitemap: `${baseUrl}/sitemap.xml`,
    };
}