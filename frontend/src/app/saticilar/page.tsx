import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Satıcılar İçin Ahicadde",
    description:
        "Ahicadde'de ürünlerini satmak isteyen üretici, esnaf ve işletmeler için şeffaf ve dayanışmacı e-ticaret yaklaşımını keşfedin.",
    alternates: {
        canonical: "https://ahicadde.com/saticilar",
    },
};

export default function SaticilarPage() {
    return (
        <main>
            <section className="mx-auto max-w-4xl px-6 py-20 lg:px-8 lg:py-28">
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-neutral-500">
                    Satıcılar için
                </p>

                <h1 className="mt-5 text-4xl font-semibold tracking-tight sm:text-5xl">
                    Emeğini ve ürününü daha şeffaf bir ticaret ortamında sun.
                </h1>

                <div className="mt-8 space-y-6 text-lg leading-8 text-neutral-600">
                    <p>
                        Ahicadde; üreticilerin, esnafın ve işletmelerin ürünlerini
                        internet üzerinden müşterilere ulaştırabilmesini sağlayan bir
                        e-ticaret pazaryeri oluşturmayı hedefler.
                    </p>

                    <p>
                        Hizmet maliyetlerinin açıkça görülebilmesi ve satıcıların
                        satışlarından elde ettikleri tutarı kolayca hesaplayabilmesi
                        Ahicadde'nin temel prensipleri arasında yer alır.
                    </p>

                    <p>
                        Amacımız, satıcının emeğini ve kazancını merkeze alan,
                        sürdürülebilir ve şeffaf bir pazar yeri oluşturmaktır.
                    </p>
                </div>
            </section>
        </main>
    );
}