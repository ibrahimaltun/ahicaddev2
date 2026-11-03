"use client";

import { Suspense, useState } from "react";
import type { FormEvent } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/form";
import { Notice } from "@/components/ui/notice";
import { resetPassword } from "@/features/auth/api";
import { useI18n } from "@/features/i18n/LocaleProvider";

function ResetPasswordForm() {
    const { t } = useI18n();
    const router = useRouter();
    const searchParams = useSearchParams();

    const token = searchParams.get("token") ?? "";

    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [error, setError] = useState("");
    const [success, setSuccess] = useState(false);
    const [loading, setLoading] = useState(false);

    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();

        setError("");

        if (password !== confirmPassword) {
            setError(t("auth.passwordMismatch"));
            return;
        }

        setLoading(true);

        try {
            await resetPassword({ token, new_password: password });
            setSuccess(true);
        } catch (submitError) {
            setError(
                submitError instanceof Error
                    ? submitError.message
                    : t("auth.resetError"),
            );
        } finally {
            setLoading(false);
        }
    }

    if (!token) {
        return (
            <main className="min-h-screen bg-background">
                <section className="mx-auto flex min-h-[calc(100vh-160px)] max-w-md items-center px-6 py-16">
                    <div className="w-full rounded-2xl border border-border bg-surface p-8 shadow-sm">
                        <Notice tone="error">
                            {t("auth.resetInvalidLink")}
                        </Notice>

                        <Link
                            href="/sifremi-unuttum"
                            className="mt-6 block text-center text-sm font-medium text-primary hover:underline"
                        >
                            {t("auth.resetRequestNew")}
                        </Link>
                    </div>
                </section>
            </main>
        );
    }

    return (
        <main className="min-h-screen bg-background">
            <section className="mx-auto flex min-h-[calc(100vh-160px)] max-w-md items-center px-6 py-16">
                <div className="w-full rounded-2xl border border-border bg-surface p-8 shadow-sm">
                    <div className="mb-8">
                        <h1 className="text-3xl font-semibold tracking-tight">
                            {t("auth.resetTitle")}
                        </h1>

                        <p className="mt-3 text-sm text-foreground-muted">
                            {t("auth.resetDescription")}
                        </p>
                    </div>

                    {success ? (
                        <>
                            <Notice tone="success">
                                {t("auth.resetSuccess")}
                            </Notice>

                            <Button
                                type="button"
                                className="mt-6 w-full"
                                onClick={() => router.push("/login")}
                            >
                                {t("auth.resetGoToLogin")}
                            </Button>
                        </>
                    ) : (
                        <form onSubmit={handleSubmit} className="grid gap-5">
                            {error ? <Notice tone="error">{error}</Notice> : null}

                            <Field
                                label={t("auth.newPassword")}
                                htmlFor="reset-password"
                            >
                                <Input
                                    id="reset-password"
                                    type="password"
                                    required
                                    minLength={8}
                                    autoComplete="new-password"
                                    value={password}
                                    onChange={(event) =>
                                        setPassword(event.target.value)
                                    }
                                />
                            </Field>

                            <Field
                                label={t("auth.confirmPassword")}
                                htmlFor="reset-password-confirm"
                            >
                                <Input
                                    id="reset-password-confirm"
                                    type="password"
                                    required
                                    minLength={8}
                                    autoComplete="new-password"
                                    value={confirmPassword}
                                    onChange={(event) =>
                                        setConfirmPassword(event.target.value)
                                    }
                                />
                            </Field>

                            <Button
                                type="submit"
                                disabled={loading}
                                className="w-full"
                            >
                                {loading
                                    ? t("auth.resetting")
                                    : t("auth.resetButton")}
                            </Button>
                        </form>
                    )}
                </div>
            </section>
        </main>
    );
}

export default function ResetPasswordPage() {
    return (
        <Suspense>
            <ResetPasswordForm />
        </Suspense>
    );
}