import type { Metadata } from "next";

// Kisisel urun listesi: arama motorlarina kapali.
export const metadata: Metadata = {
    robots: {
        index: false,
        follow: false,
    },
};

export default function UrunlerimLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return children;
}
