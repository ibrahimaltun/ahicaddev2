import type { Metadata } from "next";
import { Geist } from "next/font/google";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { AuthProvider } from "@/features/auth/hooks/AuthProvider";

import "./globals.css";

const geist = Geist({
  variable: "--font-geist",
  subsets: ["latin"],
});

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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr" className={geist.variable}>
      <body>
        <AuthProvider>
          <Header />

          <main className="flex-1">
            {children}
          </main>

          <Footer />
        </AuthProvider>
      </body>
    </html>
  );
}