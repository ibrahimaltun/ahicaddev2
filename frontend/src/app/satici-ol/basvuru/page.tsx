import type { Metadata } from "next";
import SellerApplicationForm from "./seller-application-form";

export const metadata: Metadata = {
  title: "Satıcı Başvurusu | Ahicadde",
  description: "Ahicadde'de satış yapmak için başvuru formunu doldurun.",
  alternates: { canonical: "https://ahicadde.com/satici-ol/basvuru" },
};

export default function SaticiBasvuruPage() {
  return (
    <main>
      <section className="mx-auto max-w-2xl px-6 py-16 lg:py-24">
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Satıcı başvurusu</h1>
        <p className="mt-4 mb-10 text-neutral-600">
          Dört kısa adımda başvurunu tamamla, ekibimiz seninle iletişime geçsin.
        </p>
        <SellerApplicationForm />
      </section>
    </main>
  );
}
