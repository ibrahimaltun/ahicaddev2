"use client";

import { useState } from "react";
import type { FormEvent, SubmitEvent } from "react";
import { useRouter } from "next/navigation";

import { register } from "@/features/auth/api";

export default function RegisterPage() {
    const router = useRouter();

    const [form, setForm] = useState({
        first_name: "",
        last_name: "",
        email: "",
        password: "",
    });

    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [loading, setLoading] = useState(false);

    function updateField(
        field: keyof typeof form,
        value: string,
    ) {
        setForm((current) => ({
            ...current,
            [field]: value,
        }));
    }

    async function handleSubmit(
        event: SubmitEvent<HTMLFormElement>,
    ) {
        event.preventDefault();

        setError("");
        setSuccess("");
        setLoading(true);

        try {
            await register(form);
            setSuccess(
                "Hesabınız başarıyla oluşturuldu. Giriş sayfasına yönlendiriliyorsunuz...",
            );

            setTimeout(() => {
                router.push("/login");
            }, 1200);
        } catch (error) {
            setError(
                error instanceof Error
                    ? error.message
                    : "Kayıt sırasında bir hata oluştu.",
            );
        } finally {
            setLoading(false);
        }
    }

    return (
        <main className="min-h-screen bg-white">
            <section className="mx-auto flex max-w-md px-6 py-16">
                <div className="w-full">
                    <h1 className="text-3xl font-semibold tracking-tight">
                        Hesap Oluştur
                    </h1>

                    <p className="mt-2 text-neutral-600">
                        Ahicadde'ye katılın.
                    </p>

                    <form
                        onSubmit={handleSubmit}
                        className="mt-8 space-y-5"
                    >
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="mb-2 block text-sm font-medium">
                                    Ad
                                </label>

                                <input
                                    required
                                    value={form.first_name}
                                    onChange={(event) =>
                                        updateField(
                                            "first_name",
                                            event.target.value,
                                        )
                                    }
                                    className="w-full rounded-xl border border-neutral-300 px-4 py-3 outline-none focus:border-neutral-900"
                                />
                            </div>

                            <div>
                                <label className="mb-2 block text-sm font-medium">
                                    Soyad
                                </label>

                                <input
                                    required
                                    value={form.last_name}
                                    onChange={(event) =>
                                        updateField(
                                            "last_name",
                                            event.target.value,
                                        )
                                    }
                                    className="w-full rounded-xl border border-neutral-300 px-4 py-3 outline-none focus:border-neutral-900"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="mb-2 block text-sm font-medium">
                                E-posta
                            </label>

                            <input
                                type="email"
                                autoComplete="email"
                                required
                                value={form.email}
                                onChange={(event) =>
                                    updateField("email", event.target.value)
                                }
                                className="w-full rounded-xl border border-neutral-300 px-4 py-3 outline-none focus:border-neutral-900"
                            />
                        </div>

                        <div>
                            <label className="mb-2 block text-sm font-medium">
                                Şifre
                            </label>

                            <input
                                type="password"
                                autoComplete="new-password"
                                required
                                minLength={8}
                                value={form.password}
                                onChange={(event) =>
                                    updateField(
                                        "password",
                                        event.target.value,
                                    )
                                }
                                className="w-full rounded-xl border border-neutral-300 px-4 py-3 outline-none focus:border-neutral-900"
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
                            className="w-full rounded-xl bg-neutral-950 px-4 py-3 font-medium text-white transition hover:bg-neutral-800 disabled:opacity-50"
                        >
                            {loading ? "Hesap oluşturuluyor..." : "Kayıt Ol"}
                        </button>
                    </form>

                    <p className="mt-6 text-center text-sm text-neutral-600">
                        Zaten hesabınız var mı?{" "}
                        <a
                            href="/login"
                            className="font-medium text-neutral-950 underline"
                        >
                            Giriş yapın
                        </a>
                    </p>
                </div>
            </section>
        </main>
    );
}