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
                    "/hesabim/",
                    "/sepet/",
                    "/checkout/",
                    "/giris/",
                    "/kayit/",
                ],
            },
        ],
        sitemap: `${baseUrl}/sitemap.xml`,
    };
}