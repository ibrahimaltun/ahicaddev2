import { apiFetch } from "@/lib/api/client";

import type {
    ForgotPasswordRequest,
    LoginRequest,
    LoginResponse,
    RegisterRequest,
    ResetPasswordRequest,
    User,
    VerifyEmailRequest,
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

export async function forgotPassword(
    data: ForgotPasswordRequest,
): Promise<{ message: string }> {
    return apiFetch<{ message: string }>("/auth/forgot-password", {
        method: "POST",
        body: JSON.stringify(data),
    });
}

export async function resetPassword(
    data: ResetPasswordRequest,
): Promise<{ message: string }> {
    return apiFetch<{ message: string }>("/auth/reset-password", {
        method: "POST",
        body: JSON.stringify(data),
    });
}

export async function verifyEmail(
    data: VerifyEmailRequest,
): Promise<{ message: string }> {
    return apiFetch<{ message: string }>("/auth/verify-email", {
        method: "POST",
        body: JSON.stringify(data),
    });
}

export async function sendVerificationEmail(): Promise<{
    message: string;
}> {
    return apiFetch<{ message: string }>("/auth/send-verification", {
        method: "POST",
    });
}