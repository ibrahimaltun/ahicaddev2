import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Hesabım",
    description: "Ahicadde kullanıcı hesabı.",
    robots: {
        index: false,
        follow: false,
    },
};

export default function AccountLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return children;
}