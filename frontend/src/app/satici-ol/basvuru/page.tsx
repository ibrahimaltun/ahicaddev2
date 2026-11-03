import type { Metadata } from "next";

import { getServerI18n } from "@/lib/i18n/server";

import SellerApplicationForm from "./seller-application-form";

export const metadata: Metadata = {
  title: "Satıcı Başvurusu | Ahicadde",
  alternates: { canonical: "https://ahicadde.com/satici-ol/basvuru" },
};

export default async function SaticiBasvuruPage() {
  const { t } = await getServerI18n();

  return (
    <main>
      <section className="mx-auto max-w-2xl px-6 py-16 lg:py-24">
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
          {t("seller.applyTitle")}
        </h1>

        <p className="mt-4 mb-10 text-foreground-muted">
          {t("seller.applySubtitle")}
        </p>

        <SellerApplicationForm />
      </section>
    </main>
  );
}
