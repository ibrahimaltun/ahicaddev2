import type { Metadata } from "next";
import { Geist } from "next/font/google";
import { GoogleAnalytics } from "@/components/analytics/GoogleAnalytics";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { AuthProvider } from "@/features/auth/hooks/AuthProvider";
import { CartProvider } from "@/features/cart/CartProvider";
import { LocaleProvider } from "@/features/i18n/LocaleProvider";
import { ThemeProvider } from "@/features/theme/ThemeProvider";

import { getServerLocale } from "@/lib/i18n/server";

import "./globals.css";

const geist = Geist({
  variable: "--font-geist",
  subsets: ["latin"],
});

// Koyu tema cookie/localStorage/system tercihini hidrasyon Oncesi uygular;
// boylece acik sayfa yuklenip sonra kararip "yanip sonme" (FOUC) olmaz.
const THEME_INIT_SCRIPT = `(function(){try{var m=document.cookie.match(/ahicadde-theme=(dark|light)/);var s=null;try{s=localStorage.getItem("ahicadde-theme")}catch(e){}var t=m?m[1]:(s||(window.matchMedia&&window.matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light"));if(t==="dark")document.documentElement.classList.add("dark");}catch(e){}})();`;

export const metadata: Metadata = {
  metadataBase: new URL("https://ahicadde.com"),

  title: {
    default: "Ahicadde | Ahilik Esasıyla Dayanışmacı E-Ticaret Pazaryeri",
    template: "%s | Ahicadde",
  },

  description:
    "Ahicadde, ahilik anlayışından ilham alan dayanışmacı bir e-ticaret pazaryeridir. Şeffaf ve düşük hizmet maliyetleriyle satıcının emeğini korumayı, alıcıya daha uygun alışveriş koşulları sunmayı amaçlar.",

  applicationName: "Ahicadde",

  keywords: [
    "Ahicadde",
    "ahilik",
    "dayanışmacı pazar yeri",
    "e-ticaret",
    "e-ticaret pazaryeri",
    "adil ticaret",
    "şeffaf ticaret",
    "uygun fiyat",
    "üretici",
    "esnaf",
    "online alışveriş",
  ],

  authors: [{ name: "Ahicadde" }],
  creator: "Ahicadde",
  publisher: "Ahicadde",

  alternates: {
    canonical: "https://ahicadde.com",
  },

  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },

  openGraph: {
    type: "website",
    locale: "tr_TR",
    url: "https://ahicadde.com",
    siteName: "Ahicadde",
    title: "Ahicadde | Dayanışmayla Büyüyen Pazar Yeri",
    description:
      "Ahilik anlayışından ilham alan, satıcının emeğini ve alıcının uygun alışveriş koşullarını önemseyen dayanışmacı e-ticaret pazaryeri.",
  },

  twitter: {
    card: "summary_large_image",
    title: "Ahicadde | Dayanışmayla Büyüyen Pazar Yeri",
    description:
      "Ahilik anlayışından ilham alan dayanışmacı e-ticaret pazaryeri.",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getServerLocale();

  return (
    <html
        lang={locale}
        className={geist.variable}
        suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>

      <body className="flex min-h-screen flex-col bg-background text-foreground">
        <GoogleAnalytics />
        <ThemeProvider>
          <LocaleProvider initialLocale={locale}>
            <AuthProvider>
              <CartProvider>
                <Header />

                <main className="flex-1">
                  {children}
                </main>

                <Footer />
              </CartProvider>
            </AuthProvider>
          </LocaleProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}