import type { Metadata } from "next";

import { getServerI18n } from "@/lib/i18n/server";

export const metadata: Metadata = {
  title: "Ahilik | Ahicadde",
  alternates: {
    canonical: "https://ahicadde.com/ahilik",
  },
};

export default async function AhilikPage() {
  const { t } = await getServerI18n();

  const paragraphs = t("ahilik.paragraphs").split("|");

  return (
    <main className="mx-auto max-w-4xl px-6 py-20 lg:px-8">
      <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">
        {t("ahilik.label")}
      </p>

      <h1 className="mt-5 text-4xl font-semibold tracking-tight">
        {t("ahilik.title")}
      </h1>

      <div className="mt-8 space-y-6 text-lg leading-8 text-foreground-muted">
        {paragraphs.map((paragraph, index) => (
          <p key={index}>{paragraph}</p>
        ))}
      </div>
    </main>
  );
}
