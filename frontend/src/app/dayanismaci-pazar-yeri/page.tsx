import type { Metadata } from "next";

import { getServerI18n } from "@/lib/i18n/server";

export const metadata: Metadata = {
  title: "Dayanışmacı Pazar Yeri | Ahicadde",
  alternates: {
    canonical: "https://ahicadde.com/dayanismaci-pazar-yeri",
  },
};

export default async function DayanismaciPage() {
  const { t } = await getServerI18n();

  const paragraphs = t("solidarity.paragraphs").split("|");

  return (
    <main className="mx-auto max-w-4xl px-6 py-20 lg:px-8">
      <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">
        {t("footer.solidarityMarket")}
      </p>

      <h1 className="mt-5 text-4xl font-semibold tracking-tight">
        {t("solidarity.title")}
      </h1>

      <div className="mt-8 space-y-6 text-lg leading-8 text-foreground-muted">
        {paragraphs.map((paragraph, index) => (
          <p key={index}>{paragraph}</p>
        ))}
      </div>
    </main>
  );
}
