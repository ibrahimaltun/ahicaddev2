import type { Metadata } from "next";

// Kisisel urun giris akisi: arama motorlarina kapali.
export const metadata: Metadata = {
    robots: {
        index: false,
        follow: false,
    },
};

export default function UrunEkleLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return children;
}
