/**
 * Google Analytics 4 (gtag.js) yardimcilari.
 *
 * Olcum kimligi `NEXT_PUBLIC_GA_MEASUREMENT_ID` ortam degiskeninden okunur;
 * tanimli degilse tum yardimcilar guvenli sekilde no-op davranir ve istemciye
 * hicbir ucuncu taraf script eklenmez. Boylece gelistirme ortaminda izleme
 * yuklenmez, uretimde ise yalnizca ID tanimlandigi anda aktiflesir.
 */
export const GA_MEASUREMENT_ID =
    process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID ?? "";

type GtagEventParams = Record<string, string | number | boolean | undefined>;

declare global {
    interface Window {
        dataLayer?: unknown[];
        gtag?: (...args: unknown[]) => void;
    }
}

/**
 * GA4'e ozel bir event gonderir. gtag.js henuz yuklenmemisse veya olcum ID
 * yoksa sessizce atlanir; arayan tarafta hata yonetimi gerektirmez.
 */
export function trackEvent(action: string, params: GtagEventParams = {}): void {
    if (!GA_MEASUREMENT_ID || typeof window === "undefined") {
        return;
    }

    if (typeof window.gtag !== "function") {
        return;
    }

    window.gtag("event", action, params);
}
