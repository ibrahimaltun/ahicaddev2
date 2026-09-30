"use client";

import { useState } from "react";
import type { SubmitEvent } from "react";
import { useRouter } from "next/navigation";

import { login } from "@/features/auth/api";
import { useAuth } from "@/features/auth/hooks/useAuth";

export default function LoginPage() {
    const router = useRouter();
    const { refreshUser } = useAuth();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [loading, setLoading] = useState(false);

    async function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
        event.preventDefault();

        setError("");
        setSuccess("");
        setLoading(true);

        try {
            await login({
                email,
                password,
            });

            await refreshUser();

            setSuccess(
                "Giriş başarılı. Hesabınıza yönlendiriliyorsunuz...",
            );

            router.push("/account");
        } catch (error) {
            setError(
                error instanceof Error
                    ? error.message
                    : "Giriş yapılamadı.",
            );
        } finally {
            setLoading(false);
        }
    }

    return (
        <main className="min-h-screen bg-white">
            <section className="mx-auto flex min-h-[calc(100vh-160px)] max-w-md items-center px-6 py-16">
                <div className="w-full">
                    <div className="mb-8">
                        <h1 className="text-3xl font-semibold tracking-tight">
                            Giriş Yap
                        </h1>

                        <p className="mt-2 text-neutral-600">
                            Ahicadde hesabınıza giriş yapın.
                        </p>
                    </div>

                    <form
                        onSubmit={handleSubmit}
                        className="space-y-5"
                    >
                        <div>
                            <label
                                htmlFor="email"
                                className="mb-2 block text-sm font-medium"
                            >
                                E-posta
                            </label>

                            <input
                                id="email"
                                type="email"
                                autoComplete="email"
                                required
                                value={email}
                                onChange={(event) =>
                                    setEmail(event.target.value)
                                }
                                className="w-full rounded-xl border border-neutral-300 px-4 py-3 outline-none transition focus:border-neutral-900"
                            />
                        </div>

                        <div>
                            <label
                                htmlFor="password"
                                className="mb-2 block text-sm font-medium"
                            >
                                Şifre
                            </label>

                            <input
                                id="password"
                                type="password"
                                autoComplete="current-password"
                                required
                                value={password}
                                onChange={(event) =>
                                    setPassword(event.target.value)
                                }
                                className="w-full rounded-xl border border-neutral-300 px-4 py-3 outline-none transition focus:border-neutral-900"
                            />
                        </div>

                        {success && (
                            <div
                                role="status"
                                className="mb-4 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700"
                            >
                                {success}
                            </div>
                        )}

                        {error && (
                            <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
                                {error}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full rounded-xl bg-neutral-950 px-4 py-3 font-medium text-white transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            {loading ? "Giriş yapılıyor..." : "Giriş Yap"}
                        </button>
                    </form>

                    <p className="mt-6 text-center text-sm text-neutral-600">
                        Hesabınız yok mu?{" "}
                        <a
                            href="/register"
                            className="font-medium text-neutral-950 underline"
                        >
                            Kayıt olun
                        </a>
                    </p>
                </div>
            </section>
        </main>
    );
}