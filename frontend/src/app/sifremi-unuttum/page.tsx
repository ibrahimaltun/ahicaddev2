"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/form";
import { Notice } from "@/components/ui/notice";
import { forgotPassword } from "@/features/auth/api";
import { useI18n } from "@/features/i18n/LocaleProvider";

export default function ForgotPasswordPage() {
    const { t } = useI18n();

    const [email, setEmail] = useState("");
    const [error, setError] = useState("");
    const [sent, setSent] = useState(false);
    const [loading, setLoading] = useState(false);

    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();

        setError("");
        setLoading(true);

        try {
            await forgotPassword({ email });
            setSent(true);
        } catch (submitError) {
            setError(
                submitError instanceof Error
                    ? submitError.message
                    : t("auth.forgotPasswordError"),
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
                            {t("auth.forgotPasswordTitle")}
                        </h1>

                        <p className="mt-3 text-sm text-foreground-muted">
                            {t("auth.forgotPasswordDescription")}
                        </p>
                    </div>

                    {sent ? (
                        <>
                            <Notice tone="success">
                                {t("auth.forgotPasswordSent")}
                            </Notice>

                            <Link
                                href="/login"
                                className="mt-6 block text-center text-sm font-medium text-primary hover:underline"
                            >
                                {t("auth.forgotPasswordBackToLogin")}
                            </Link>
                        </>
                    ) : (
                        <form onSubmit={handleSubmit} className="grid gap-5">
                            {error ? <Notice tone="error">{error}</Notice> : null}

                            <Field
                                label={t("auth.email")}
                                htmlFor="forgot-email"
                            >
                                <Input
                                    id="forgot-email"
                                    type="email"
                                    required
                                    autoComplete="email"
                                    value={email}
                                    onChange={(event) =>
                                        setEmail(event.target.value)
                                    }
                                    placeholder="ornek@eposta.com"
                                />
                            </Field>

                            <Button
                                type="submit"
                                disabled={loading}
                                className="w-full"
                            >
                                {loading
                                    ? t("auth.forgotPasswordSending")
                                    : t("auth.forgotPasswordButton")}
                            </Button>

                            <Link
                                href="/login"
                                className="text-center text-sm font-medium text-primary hover:underline"
                            >
                                {t("auth.forgotPasswordBackToLogin")}
                            </Link>
                        </form>
                    )}
                </div>
            </section>
        </main>
    );
}