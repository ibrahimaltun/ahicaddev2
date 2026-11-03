"use client";

import {
    createContext,
    useCallback,
    useContext,
    useMemo,
    useState,
} from "react";

export type Theme = "light" | "dark";

export const THEME_COOKIE = "ahicadde-theme";

interface ThemeContextValue {
    theme: Theme | null;
    setTheme: (theme: Theme) => void;
    toggle: () => void;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

function persistTheme(theme: Theme) {
    document.documentElement.classList.toggle("dark", theme === "dark");

    document.cookie = `${THEME_COOKIE}=${theme}; path=/; max-age=31536000; samesite=lax`;

    try {
        localStorage.setItem(THEME_COOKIE, theme);
    } catch {
        // localStorage kapali olabilir; cookie yeterli.
    }
}

/**
 * Tema ozellikle layout'daki inline script ile <html> sinifina uygulanir;
 * bu provider yalnizca durumu takip eder ve degistirmek icin arayuz saglar.
 */
function readCurrentTheme(): Theme {
    if (
        typeof document !== "undefined" &&
        document.documentElement.classList.contains("dark")
    ) {
        return "dark";
    }

    return "light";
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
    // Tema, layout'daki inline script tarafindan hidrasyondan once
    // <html> sinifina uygulanmistir; burada yalnizca okunur.
    const [theme, setThemeState] = useState<Theme>(readCurrentTheme);

    const setTheme = useCallback((nextTheme: Theme) => {
        persistTheme(nextTheme);
        setThemeState(nextTheme);
    }, []);

    const toggle = useCallback(() => {
        setThemeState((current) => {
            const nextTheme: Theme =
                current === "dark" || current === null
                    ? "light"
                    : "dark";

            persistTheme(nextTheme);

            return nextTheme;
        });
    }, []);

    const value = useMemo<ThemeContextValue>(
        () => ({ theme, setTheme, toggle }),
        [theme, setTheme, toggle],
    );

    return (
        <ThemeContext.Provider value={value}>
            {children}
        </ThemeContext.Provider>
    );
}

export function useTheme() {
    const context = useContext(ThemeContext);

    if (!context) {
        throw new Error("useTheme must be used inside ThemeProvider");
    }

    return context;
}
