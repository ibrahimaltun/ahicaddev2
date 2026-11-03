import type { Metadata } from "next";

import { getServerI18n } from "@/lib/i18n/server";

export const metadata: Metadata = {
  title: "Hizmet Ücretleri | Ahicadde",
  alternates: {
    canonical: "https://ahicadde.com/hizmet-ucretleri",
  },
};

export default async function FeesPage() {
  const { t } = await getServerI18n();

  const feeKeys = ["listing", "commission", "iban", "noHidden"] as const;

  return (
    <main className="mx-auto max-w-4xl px-6 py-20 lg:px-8">
      <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">
        {t("footer.fees")}
      </p>

      <h1 className="mt-5 text-4xl font-semibold tracking-tight">
        {t("fees.title")}
      </h1>

      <p className="mt-6 leading-8 text-foreground-muted">
        {t("fees.description")}
      </p>

      <ul className="mt-10 space-y-4">
        {feeKeys.map((key) => (
          <li
            key={key}
            className="rounded-2xl border border-border bg-surface p-6"
          >
            <h2 className="font-semibold">{t(`fees.${key}.title`)}</h2>

            <p className="mt-2 leading-7 text-foreground-muted">
              {t(`fees.${key}.description`)}
            </p>
          </li>
        ))}
      </ul>
    </main>
  );
}
