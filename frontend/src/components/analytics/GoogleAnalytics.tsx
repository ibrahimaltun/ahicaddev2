"use client";

import Script from "next/script";
import { usePathname, useSearchParams } from "next/navigation";
import { useReportWebVitals } from "next/web-vitals";
import { Suspense, useEffect } from "react";

import { GA_MEASUREMENT_ID, trackEvent } from "@/lib/analytics/gtag";

/**
 * SPA gezinmelerinde otomatik page_view uretilmedigi icin rota degisimlerini
 * dinleyip GA4'e page_view eventi gonderir. Ilk yuklemede de tetiklenir;
 * bu yuzden gtag config'inde send_page_view: false kullanilir.
 */
function RouteChangeTracker() {
    const pathname = usePathname();
    const searchParams = useSearchParams();

    useEffect(() => {
        if (typeof window === "undefined") {
            return;
        }

        trackEvent("page_view", {
            page_title: document.title,
            page_path:
                pathname +
                (searchParams.size > 0 ? `?${searchParams.toString()}` : ""),
            page_location: window.location.href,
        });
    }, [pathname, searchParams]);

    return null;
}

/**
 * Core Web Vitals (LCP, INP, CLS vb.) metriklerini GA4'e iletir.
 * Metrik adi event adidir; deger Google'in onerdigi bicimde yuvarlanir.
 */
function WebVitalsReporter() {
    useReportWebVitals((metric) => {
        trackEvent(metric.name, {
            value: Math.round(metric.delta),
            metric_id: metric.id,
            metric_delta: metric.delta,
            rating: metric.rating,
            non_interaction: true,
        });
    });

    return null;
}

function GoogleAnalyticsScripts() {
    return (
        <>
            <Script
                strategy="afterInteractive"
                src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
            />

            <Script
                id="ga4-init"
                strategy="afterInteractive"
                dangerouslySetInnerHTML={{
                    __html: [
                        "window.dataLayer = window.dataLayer || [];",
                        "function gtag(){dataLayer.push(arguments);}",
                        `gtag('js', new Date());`,
                        `gtag('config', '${GA_MEASUREMENT_ID}', { send_page_view: false });`,
                    ].join("\n"),
                }}
            />
        </>
    );
}

/**
 * Tum sayfalarda yuklenen Google Analytics 4 entegrasyonu.
 * - gtag.js root layout uzerinden her sayfada bir kez yuklenir.
 * - istemci tarafi gezinmelerinde page_view event'i manuel gonderilir.
 * - Core Web Vitals metrikleri ozel event olarak raporlanir.
 * Olcum ID tanimli degilse hicbir sey render etmez (yukleme yapilmaz).
 */
export function GoogleAnalytics() {
    if (!GA_MEASUREMENT_ID) {
        return null;
    }

    return (
        <>
            <GoogleAnalyticsScripts />

            {/* useSearchParams, statik on-render sirasinda Suspense ister */}
            <Suspense fallback={null}>
                <RouteChangeTracker />
            </Suspense>

            <WebVitalsReporter />
        </>
    );
}
