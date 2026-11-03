"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/form";
import { Notice } from "@/components/ui/notice";
import { register } from "@/features/auth/api";
import { useI18n } from "@/features/i18n/LocaleProvider";

export default function RegisterPage() {
    const router = useRouter();
    const { t } = useI18n();

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
        event: FormEvent<HTMLFormElement>,
    ) {
        event.preventDefault();

        setError("");
        setSuccess("");
        setLoading(true);

        try {
            await register(form);
            setSuccess(t("auth.registerSuccess"));

            setTimeout(() => {
                router.push("/login");
            }, 1200);
        } catch (submitError) {
            setError(
                submitError instanceof Error
                    ? submitError.message
                    : t("auth.registerError"),
            );
        } finally {
            setLoading(false);
        }
    }

    return (
        <main className="min-h-screen bg-background">
            <section className="mx-auto flex max-w-md px-6 py-16">
                <div className="w-full rounded-2xl border border-border bg-surface p-8 shadow-sm">
                    <h1 className="text-3xl font-semibold tracking-tight">
                        {t("auth.registerTitle")}
                    </h1>

                    <p className="mt-2 text-foreground-muted">
                        {t("auth.registerDescription")}
                    </p>

                    <form
                        onSubmit={handleSubmit}
                        className="mt-8 space-y-5"
                    >
                        <div className="grid grid-cols-2 gap-4">
                            <Field label={t("auth.firstName")} htmlFor="first_name">
                                <Input
                                    id="first_name"
                                    required
                                    autoComplete="given-name"
                                    value={form.first_name}
                                    onChange={(event) =>
                                        updateField(
                                            "first_name",
                                            event.target.value,
                                        )
                                    }
                                />
                            </Field>

                            <Field label={t("auth.lastName")} htmlFor="last_name">
                                <Input
                                    id="last_name"
                                    required
                                    autoComplete="family-name"
                                    value={form.last_name}
                                    onChange={(event) =>
                                        updateField(
                                            "last_name",
                                            event.target.value,
                                        )
                                    }
                                />
                            </Field>
                        </div>

                        <Field label={t("auth.email")} htmlFor="email">
                            <Input
                                id="email"
                                type="email"
                                autoComplete="email"
                                required
                                value={form.email}
                                onChange={(event) =>
                                    updateField("email", event.target.value)
                                }
                            />
                        </Field>

                        <Field label={t("auth.password")} htmlFor="password">
                            <Input
                                id="password"
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
                            {loading ? t("auth.registering") : t("auth.registerButton")}
                        </Button>
                    </form>

                    <p className="mt-6 text-center text-sm text-foreground-muted">
                        {t("auth.haveAccount")}{" "}
                        <a
                            href="/login"
                            className="font-medium text-primary underline-offset-2 hover:underline"
                        >
                            {t("auth.loginLink")}
                        </a>
                    </p>
                </div>
            </section>
        </main>
    );
}
