"use client";

import { useCallback, useSyncExternalStore } from "react";

import { trackEvent } from "@/lib/analytics/gtag";

const STORAGE_PREFIX = "ahicad:blog-rating:";
const RATING_CHANGE_EVENT = "ahicad:blog-rating-change";

interface RatingPanelProps {
    /** Puanlanan yazinin slug'i; localStorage anahtari ve GA event'i icin kullanilir */
    postSlug: string;
    /** Locale-aware etiketler */
    title: string;
    question: string;
    feedbackThanks: string;
    resetLabel: string;
    /** Siralanan emojiler: en kotuden en iyiye */
    emojis: readonly string[];
    labels: readonly string[];
}

/**
 * localStorage'i dis sistem olarak kullanir; puan degistiginde kendi
 * event'ini tetikler ve tarayicilar arasi "storage" event'lerini dinler.
 */
function subscribe(onChange: () => void): () => void {
    window.addEventListener(RATING_CHANGE_EVENT, onChange);
    window.addEventListener("storage", onChange);
    return () => {
        window.removeEventListener(RATING_CHANGE_EVENT, onChange);
        window.removeEventListener("storage", onChange);
    };
}

function getStoredRatingSnapshot(postSlug: string): string | null {
    try {
        const value = window.localStorage.getItem(STORAGE_PREFIX + postSlug);
        if (value === null) {
            return null;
        }
        const parsed = Number(value);
        return Number.isInteger(parsed) && parsed >= 1 ? value : null;
    } catch {
        // localStorage erisilemiyor (gizli tarayici vb.) -> sessizce yok say
        return null;
    }
}

/** SSR ve hidrasyon sirasinda kullanilan bos snapshot. */
function getEmptySnapshot(): string | null {
    return null;
}

function notifyRatingChanged(): void {
    window.dispatchEvent(new Event(RATING_CHANGE_EVENT));
}

/**
 * Giris gerektirmeyen, emoji tabanli yazi puanlama paneli.
 * - Puan yalnizca tarayicida (localStorage) saklanir, kullanici girisi yoktur.
 * - Puanlar GA4'e `blog_rating` eventi olarak iletilir.
 * - Ayni yazida kayitli puan varsa ozet + sifirlama gosterilir.
 */
export function RatingPanel({
    postSlug,
    title,
    question,
    feedbackThanks,
    resetLabel,
    emojis,
    labels,
}: RatingPanelProps) {
    const stored = useSyncExternalStore(
        subscribe,
        useCallback(() => getStoredRatingSnapshot(postSlug), [postSlug]),
        getEmptySnapshot,
    );
    const rating = stored === null ? null : Number(stored);

    const handleRate = useCallback(
        (value: number) => {
            try {
                window.localStorage.setItem(STORAGE_PREFIX + postSlug, String(value));
            } catch {
                // localStorage yoksa puan sadece GA'ya iletilir
            }
            notifyRatingChanged();
            trackEvent("blog_rating", {
                blog_slug: postSlug,
                rating_value: value,
                rating_label: labels[value - 1] ?? String(value),
            });
        },
        [labels, postSlug],
    );

    const handleReset = useCallback(() => {
        try {
            window.localStorage.removeItem(STORAGE_PREFIX + postSlug);
        } catch {
            // sessizce yoksay
        }
        notifyRatingChanged();
    }, [postSlug]);

    return (
        <section
            aria-label={title}
            className="mt-12 rounded-2xl border border-emerald-200 bg-emerald-50/60 p-6"
        >
            <h2 className="text-xl font-bold text-slate-900">{title}</h2>

            {rating !== null ? (
                <div className="mt-4">
                    <p className="text-lg text-emerald-900">
                        <span aria-hidden="true" className="mr-2 text-2xl">
                            {emojis[rating - 1]}
                        </span>
                        {feedbackThanks}
                    </p>
                    <button
                        type="button"
                        onClick={handleReset}
                        className="mt-3 text-sm font-medium text-emerald-700 underline-offset-2 hover:underline"
                    >
                        {resetLabel}
                    </button>
                </div>
            ) : (
                <>
                    <p className="mt-2 text-base leading-relaxed text-slate-600">{question}</p>
                    <div
                        className="mt-5 flex flex-wrap items-center gap-3"
                        role="group"
                        aria-label={title}
                    >
                        {emojis.map((emoji, index) => (
                            <button
                                key={emoji}
                                type="button"
                                onClick={() => handleRate(index + 1)}
                                aria-label={`${index + 1} / ${emojis.length}`}
                                title={labels[index]}
                                className="flex h-14 w-14 items-center justify-center rounded-full border border-slate-200 bg-white text-3xl transition hover:-translate-y-0.5 hover:border-emerald-400 hover:bg-emerald-50 focus:outline-none focus-visible:ring-2 focus:ring-emerald-600 focus-visible:ring-offset-2"
                            >
                                <span aria-hidden="true">{emoji}</span>
                            </button>
                        ))}
                    </div>
                </>
            )}
        </section>
    );
}
