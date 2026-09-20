import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Ahilik ve Ahicadde",
    description:
        "Ahilik kültürünün dayanışma, dürüstlük, paylaşma ve emeğe saygı anlayışından ilham alan Ahicadde'nin kuruluş felsefesini keşfedin.",
    alternates: {
        canonical: "https://ahicadde.com/ahilik",
    },
};

export default function AhilikPage() {
    return (
        <main>
            <section className="mx-auto max-w-4xl px-6 py-20 lg:px-8 lg:py-28">
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-neutral-500">
                    Ahicadde'nin kuruluş felsefesi
                </p>

                <h1 className="mt-5 text-4xl font-semibold tracking-tight sm:text-5xl">
                    Ahilik kültürünü dijital ticarete taşıyoruz.
                </h1>

                <div className="mt-8 space-y-6 text-lg leading-8 text-neutral-600">
                    <p>
                        Ahilik, Anadolu'da ticaret ve esnaf kültürünün gelişiminde önemli
                        bir yere sahip olan; dürüstlük, güven, dayanışma, paylaşma ve
                        emeğe saygı gibi değerleri öne çıkaran köklü bir gelenektir.
                    </p>

                    <p>
                        Ahicadde, bu değerlerden ilham alarak internet üzerinde yalnızca
                        ürünlerin alınıp satıldığı bir platform değil, alıcıların,
                        satıcıların ve üreticilerin birlikte değer oluşturabileceği bir
                        ticaret ekosistemi oluşturmayı amaçlar.
                    </p>

                    <p>
                        Bizim için ticaret yalnızca fiyat ve işlemden ibaret değildir.
                        Güven, şeffaflık, emeğin karşılığını alabilme ve karşılıklı
                        dayanışma da ticaretin önemli parçalarıdır.
                    </p>
                </div>
            </section>
        </main>
    );
}