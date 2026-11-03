import { cookies } from "next/headers";

import { dictionaries, type Locale, type TranslationKey } from "./dictionary";

const LOCALE_COOKIE = "ahicadde-locale";

/**
 * Sunucu tarafinda (server component / metadata) aktif dili okur.
 * Cookie yoksa varsayilan Turkce doner.
 */
export async function getServerLocale(): Promise<Locale> {
    const cookieStore = await cookies();
    const value = cookieStore.get(LOCALE_COOKIE)?.value;

    if (value === "en" || value === "tr") {
        return value;
    }

    return "tr";
}

export async function getServerI18n() {
    const locale = await getServerLocale();

    return {
        locale,
        t: (key: TranslationKey, vars?: Record<string, string | number>) => {
            const dictionary = dictionaries[locale] as unknown as Record<
                string,
                unknown
            >;

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

            let value =
                typeof current === "string"
                    ? current
                    : (key as string);

            if (vars) {
                for (const [name, varValue] of Object.entries(vars)) {
                    value = value.replaceAll(`{${name}}`, String(varValue));
                }
            }

            return value;
        },
    };
}
