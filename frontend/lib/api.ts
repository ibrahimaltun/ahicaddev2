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
            error?.detail || "Bir hata oluştu.",
        );
    }

    return response.json();
}