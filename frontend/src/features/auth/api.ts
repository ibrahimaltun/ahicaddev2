import { apiFetch } from "@/lib/api/client";

import type {
    LoginRequest,
    LoginResponse,
    RegisterRequest,
    User,
} from "./types";

export async function login(
    data: LoginRequest,
): Promise<LoginResponse> {
    return apiFetch<LoginResponse>("/auth/login", {
        method: "POST",
        body: JSON.stringify(data),
    });
}

export async function register(
    data: RegisterRequest,
): Promise<User> {
    return apiFetch<User>("/auth/register", {
        method: "POST",
        body: JSON.stringify(data),
    });
}

export async function logout(): Promise<{ message: string }> {
    return apiFetch<{ message: string }>("/auth/logout", {
        method: "POST",
    });
}

export async function getCurrentUser(): Promise<User> {
    return apiFetch<User>("/auth/me");
}