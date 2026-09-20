import Link from "next/link";

const navigation = [
    { href: "/urunler", label: "Ürünler" },
    { href: "/kategoriler", label: "Kategoriler" },
    { href: "/ahilik", label: "Ahilik" },
    { href: "/satici-ol", label: "Satıcı Ol" },
];

export function Header() {
    return (
        <header className="sticky top-0 z-50 border-b border-neutral-200/80 bg-white/95 backdrop-blur">
            <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6 lg:px-8">
                <Link
                    href="/"
                    className="text-xl font-bold tracking-tight"
                    aria-label="Ahicadde ana sayfa"
                >
                    Ahicadde
                </Link>

                <nav
                    aria-label="Ana navigasyon"
                    className="hidden items-center gap-7 md:flex"
                >
                    {navigation.map((item) => (
                        <Link
                            key={item.href}
                            href={item.href}
                            className="text-sm font-medium text-neutral-600 transition-colors hover:text-neutral-950"
                        >
                            {item.label}
                        </Link>
                    ))}
                </nav>

                <div className="flex items-center gap-2">
                    <Link
                        href="/giris"
                        className="hidden rounded-full px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-200 sm:inline-flex"
                    >
                        Giriş Yap
                    </Link>

                    <Link
                        href="/sepet"
                        className="rounded-full px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-neutral-200"
                    >
                        Sepet
                    </Link>
                </div>
            </div>
        </header>
    );
}