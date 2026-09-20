import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Dayanışmacı E-Ticaret Pazaryeri",
    description:
        "Ahicadde'nin dayanışma, şeffaflık ve karşılıklı fayda anlayışı üzerine kurulan e-ticaret pazaryeri modelini keşfedin.",
    alternates: {
        canonical: "https://ahicadde.com/dayanismaci-pazar-yeri",
    },
};

export default function DayanismaciPazarYeriPage() {
    return (
        <main>
            <section className="mx-auto max-w-4xl px-6 py-20 lg:px-8 lg:py-28">
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-neutral-500">
                    Ahicadde modeli
                </p>

                <h1 className="mt-5 text-4xl font-semibold tracking-tight sm:text-5xl">
                    Dayanışmayla büyüyen bir e-ticaret pazaryeri.
                </h1>

                <div className="mt-8 space-y-6 text-lg leading-8 text-neutral-600">
                    <p>
                        Ahicadde, alıcı ve satıcıların karşılıklı değer oluşturduğu
                        dayanışmacı bir pazar yeri modeli geliştirmeyi amaçlar.
                    </p>

                    <p>
                        Platformun temel yaklaşımı; gereksiz maliyetleri azaltmak,
                        hizmet bedellerini şeffaflaştırmak ve ticaret yapan kişilerin
                        emeğinin karşılığını daha iyi koruyabilmesini sağlamaktır.
                    </p>

                    <p>
                        Oluşabilecek maliyet avantajlarının daha uygun alışveriş
                        koşullarına yansıyabilmesi için sürdürülebilir ve şeffaf bir
                        ticaret modeli oluşturmayı hedefliyoruz.
                    </p>
                </div>
            </section>
        </main>
    );
}