import type { Metadata } from "next";

import { getServerI18n } from "@/lib/i18n/server";

export const metadata: Metadata = {
  title: "Satıcılarımız | Ahicadde",
  alternates: {
    canonical: "https://ahicadde.com/saticilar",
  },
};

export default async function SaticilarPage() {
  const { t } = await getServerI18n();

  return (
    <main className="mx-auto max-w-4xl px-6 py-20 lg:px-8">
      <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">
        {t("footer.sellersTitle")}
      </p>

      <h1 className="mt-5 text-4xl font-semibold tracking-tight">
        {t("seller.sellersTitle")}
      </h1>

      <p className="mt-6 leading-8 text-foreground-muted">
        {t("seller.sellersDescription")}
      </p>

      <div className="mt-10 rounded-2xl border border-dashed border-border-strong bg-surface p-10 text-center">
        <p className="text-foreground-muted">{t("seller.sellersEmpty")}</p>
      </div>
    </main>
  );
}
