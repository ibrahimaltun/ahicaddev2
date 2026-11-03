"use client";

import {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useState,
} from "react";
import { useRouter } from "next/navigation";

import { dictionaries, type Locale, type TranslationKey } from "@/lib/i18n/dictionary";

export const LOCALE_COOKIE = "ahicadde-locale";

interface I18nContextValue {
    locale: Locale;
    setLocale: (locale: Locale) => void;
    t: (key: TranslationKey, vars?: Record<string, string | number>) => string;
}

const I18nContext = createContext<I18nContextValue | undefined>(undefined);

function translate(
    locale: Locale,
    key: TranslationKey,
    vars?: Record<string, string | number>,
): string {
    const dictionary = dictionaries[locale] as unknown as Record<string, unknown>;

    let current: unknown = dictionary;

    for (const part of key.split(".")) {
        if (
            current !== null &&
            typeof current === "object" &&
            part in (current as Record<string, unknown>)
        ) {
            current = (current as Record<string, unknown>)[part];
        } else {
            current = undefined;
            break;
        }
    }

    let value: string;

    if (typeof current === "string") {
        value = current;
    } else {
        // Sozlukte eksik anahtar: gorsel yerine anahtar goster, sessizce hata verme.
        value = key;
    }

    if (vars) {
        for (const [name, varValue] of Object.entries(vars)) {
            value = value.replaceAll(`{${name}}`, String(varValue));
        }
    }

    return value;
}

export function LocaleProvider({
    initialLocale,
    children,
}: {
    initialLocale: Locale;
    children: React.ReactNode;
}) {
    const [locale, setLocaleState] = useState<Locale>(initialLocale);
    const router = useRouter();

    useEffect(() => {
        document.documentElement.lang = locale;
    }, [locale]);

    const setLocale = useCallback(
        (nextLocale: Locale) => {
            document.cookie = `${LOCALE_COOKIE}=${nextLocale}; path=/; max-age=31536000; samesite=lax`;
            setLocaleState(nextLocale);

            // Sunucu tarafinda render edilen sayfalar (ana sayfa, urunler vb.)
            // yeni dilde yeniden render edilsin.
            router.refresh();
        },
        [router],
    );

    const value = useMemo<I18nContextValue>(
        () => ({
            locale,
            setLocale,
            t: (key, vars) => translate(locale, key, vars),
        }),
        [locale, setLocale],
    );

    return (
        <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
    );
}

export function useI18n() {
    const context = useContext(I18nContext);

    if (!context) {
        throw new Error("useI18n must be used inside LocaleProvider");
    }

    return context;
}
