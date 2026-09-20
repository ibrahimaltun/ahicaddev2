import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Hizmet Ücretleri ve Şeffaf Maliyetler",
    description:
        "Ahicadde'nin hizmet ücretleri, satıcı maliyetleri ve şeffaf ticaret yaklaşımı hakkında bilgi edinin.",
    alternates: {
        canonical: "https://ahicadde.com/hizmet-ucretleri",
    },
};

export default function HizmetUcretleriPage() {
    return (
        <main>
            <section className="mx-auto max-w-4xl px-6 py-20 lg:px-8 lg:py-28">
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-neutral-500">
                    Şeffaf maliyet
                </p>

                <h1 className="mt-5 text-4xl font-semibold tracking-tight sm:text-5xl">
                    Hizmet ücretlerini açık ve anlaşılır tutuyoruz.
                </h1>

                <div className="mt-8 space-y-6 text-lg leading-8 text-neutral-600">
                    <p>
                        Bir pazar yerinin maliyet yapısının hem satıcı hem de alıcı
                        tarafından anlaşılabilir olması gerektiğine inanıyoruz.
                    </p>

                    <p>
                        Ahicadde'nin hizmet ücretleri açık şekilde gösterilecek ve
                        satıcıların satışlarından kendilerine kalan tutarı önceden
                        hesaplayabilmeleri sağlanacaktır.
                    </p>

                    <p>
                        Ücret politikamızın temel amacı; gereksiz maliyetleri azaltarak
                        sürdürülebilir bir pazar yeri oluşturmak ve oluşabilecek
                        avantajların ticaret ekosistemine yansıyabilmesini sağlamaktır.
                    </p>
                </div>
            </section>
        </main>
    );
}