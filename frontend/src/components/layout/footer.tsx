import Link from "next/link";

export function Footer() {
    return (
        <footer className="border-t border-neutral-200 bg-neutral-950 text-white">
            <div className="mx-auto max-w-7xl px-6 py-16 lg:px-8">
                <div className="grid gap-12 md:grid-cols-4">
                    <div className="md:col-span-2">
                        <Link href="/" className="text-xl font-bold tracking-tight">
                            Ahicadde
                        </Link>

                        <p className="mt-4 max-w-md text-sm leading-6 text-neutral-400">
                            Ahilik anlayışından ilham alan, dayanışma ve şeffaflık
                            temelinde gelişen yeni nesil e-ticaret pazaryeri.
                        </p>
                    </div>

                    <div>
                        <h2 className="text-sm font-semibold">Ahicadde</h2>

                        <nav className="mt-4 flex flex-col gap-3 text-sm text-neutral-400">
                            <Link href="/ahilik" className="hover:text-white">
                                Ahilik
                            </Link>
                            <Link
                                href="/dayanismaci-pazar-yeri"
                                className="hover:text-white"
                            >
                                Dayanışmacı Pazar Yeri
                            </Link>
                            <Link href="/hizmet-ucretleri" className="hover:text-white">
                                Hizmet Ücretleri
                            </Link>
                        </nav>
                    </div>

                    <div>
                        <h2 className="text-sm font-semibold">Satıcılar</h2>

                        <nav className="mt-4 flex flex-col gap-3 text-sm text-neutral-400">
                            <Link href="/saticilar" className="hover:text-white">
                                Satıcılar
                            </Link>
                            <Link href="/satici-ol" className="hover:text-white">
                                Satıcı Ol
                            </Link>
                        </nav>
                    </div>
                </div>

                <div className="mt-16 border-t border-neutral-800 pt-8 text-sm text-neutral-500">
                    © {new Date().getFullYear()} Ahicadde. Tüm hakları saklıdır.
                </div>
            </div>
        </footer>
    );
}