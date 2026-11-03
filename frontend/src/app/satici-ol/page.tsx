import type { Metadata } from "next";
import Link from "next/link";

import { buttonClasses } from "@/components/ui/button";
import { getServerI18n } from "@/lib/i18n/server";

export const metadata: Metadata = {
  title: "Ahicadde'de Satıcı Ol",
  alternates: {
    canonical: "https://ahicadde.com/satici-ol",
  },
};

export default async function SaticiOlPage() {
  const { t } = await getServerI18n();

  return (
    <main>
      <section className="mx-auto max-w-4xl px-6 py-20 lg:px-8 lg:py-28">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">
          {t("seller.landingEyebrow")}
        </p>

        <h1 className="mt-5 text-4xl font-semibold tracking-tight sm:text-5xl">
          {t("seller.landingTitle")}
        </h1>

        <p className="mt-8 text-lg leading-8 text-foreground-muted">
          {t("seller.landingDescription")}
        </p>

        <div className="mt-10">
          <Link href="/satici-ol/basvuru" className={buttonClasses("primary", "lg")}>
            {t("seller.landingCta")}
          </Link>
        </div>
      </section>
    </main>
  );
}
