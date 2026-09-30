import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Giriş Yap",
    description: "Ahicadde hesabınıza giriş yapın.",
    robots: {
        index: false,
        follow: false,
    },
};

export default function LoginLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return children;
}