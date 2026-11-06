const API_BASE_URL = "/api/v1";

export async function apiFetch<T>(
    endpoint: string,
    options: RequestInit = {},
): Promise<T> {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        credentials: "include",
        headers: {
            "Content-Type": "application/json",
            ...options.headers,
        },
    });

    if (!response.ok) {
        const error = await response.json().catch(() => null);

        throw new Error(
            error?.detail || "İşlem sırasında bir hata oluştu.",
        );
    }

    return response.json();
}

export async function apiFetchEmpty(
    endpoint: string,
    options: RequestInit = {},
): Promise<void> {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        credentials: "include",
        headers: {
            "Content-Type": "application/json",
            ...options.headers,
        },
    });

    if (!response.ok) {
        const error = await response.json().catch(() => null);

        throw new Error(
            error?.detail || "İşlem sırasında bir hata oluştu.",
        );
    }
}

/** Sayfali liste yanıtlarini toplam kayit sayisiyla (X-Total-Count) dondurur. */
export async function apiFetchWithTotal<T>(
    endpoint: string,
    options: RequestInit = {},
): Promise<{ items: T[]; total: number }> {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        credentials: "include",
        headers: {
            "Content-Type": "application/json",
            ...options.headers,
        },
    });

    if (!response.ok) {
        const error = await response.json().catch(() => null);

        throw new Error(
            error?.detail || "İşlem sırasında bir hata oluştu.",
        );
    }

    const items = (await response.json()) as T[];
    const total = Number(response.headers.get("X-Total-Count"));

    return {
        items,
        total: Number.isFinite(total) ? total : items.length,
    };
}