"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/form";
import { Notice } from "@/components/ui/notice";
import { login } from "@/features/auth/api";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { useI18n } from "@/features/i18n/LocaleProvider";

export default function LoginPage() {
    const router = useRouter();
    const { refreshUser } = useAuth();
    const { t } = useI18n();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [loading, setLoading] = useState(false);

    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
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

            setSuccess(t("auth.loginSuccess"));

            router.push("/account");
        } catch (submitError) {
            setError(
                submitError instanceof Error
                    ? submitError.message
                    : t("auth.loginError"),
            );
        } finally {
            setLoading(false);
        }
    }

    return (
        <main className="min-h-screen bg-background">
            <section className="mx-auto flex min-h-[calc(100vh-160px)] max-w-md items-center px-6 py-16">
                <div className="w-full rounded-2xl border border-border bg-surface p-8 shadow-sm">
                    <div className="mb-8">
                        <h1 className="text-3xl font-semibold tracking-tight">
                            {t("auth.loginTitle")}
                        </h1>

                        <p className="mt-2 text-foreground-muted">
                            {t("auth.loginDescription")}
                        </p>
                    </div>

                    <form
                        onSubmit={handleSubmit}
                        className="space-y-5"
                    >
                        <Field label={t("auth.email")} htmlFor="email">
                            <Input
                                id="email"
                                type="email"
                                autoComplete="email"
                                required
                                value={email}
                                onChange={(event) =>
                                    setEmail(event.target.value)
                                }
                            />
                        </Field>

                        <Field label={t("auth.password")} htmlFor="password">
                            <Input
                                id="password"
                                type="password"
                                autoComplete="current-password"
                                required
                                value={password}
                                onChange={(event) =>
                                    setPassword(event.target.value)
                                }
                            />
                        </Field>

                        {success && (
                            <Notice tone="success" role="status">
                                {success}
                            </Notice>
                        )}

                        {error && (
                            <Notice tone="error" role="alert">
                                {error}
                            </Notice>
                        )}

                        <Button
                            type="submit"
                            disabled={loading}
                            className="w-full py-3"
                        >
                            {loading ? t("auth.loggingIn") : t("auth.loginButton")}
                        </Button>
                    </form>

                    <p className="mt-6 text-center text-sm text-foreground-muted">
                        {t("auth.noAccount")}{" "}
                        <a
                            href="/register"
                            className="font-medium text-primary underline-offset-2 hover:underline"
                        >
                            {t("auth.registerLink")}
                        </a>
                    </p>
                </div>
            </section>
        </main>
    );
}
