import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Ahicadde'de Satıcı Ol",
  description:
    "Ürünlerinizi Ahicadde'de satmak için başvurun. Üretici, esnaf ve işletmeler için dayanışmacı e-ticaret pazaryeri.",
  alternates: {
    canonical: "https://ahicadde.com/satici-ol",
  },
};

export default function SaticiOlPage() {
  return (
    <main>
      <section className="mx-auto max-w-4xl px-6 py-20 lg:px-8 lg:py-28">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-neutral-500">
          Ahicadde&apos;de satış
        </p>

        <h1 className="mt-5 text-4xl font-semibold tracking-tight sm:text-5xl">
          Ürünlerini Ahicadde&apos;de müşterilerinle buluştur.
        </h1>

        <p className="mt-8 text-lg leading-8 text-neutral-600">
          Üretici, esnaf veya işletme olarak Ahicadde&apos;nin dayanışmacı
          e-ticaret ekosistemine katılabilir, ürünlerini yeni müşterilere
          ulaştırabilirsin.
        </p>

        <div className="mt-10">
          <Link
            href="/satici-ol/basvuru"
            className="rounded-full bg-neutral-750 px-7 py-3.5 text-sm font-medium text-white text-neutral-700 hover:bg-neutral-200 transition"
          >
            Satıcı Başvurusu Başlat
          </Link>
        </div>
      </section>
    </main>
  );
}
