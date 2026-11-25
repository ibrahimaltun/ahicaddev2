"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/form";
import { Notice } from "@/components/ui/notice";
import { register, verifyEmail } from "@/features/auth/api";
import { useI18n } from "@/features/i18n/LocaleProvider";

export default function RegisterPage() {
    const router = useRouter();
    const { t } = useI18n();

    const [step, setStep] = useState<"register" | "verify">("register");
    const [registeredEmail, setRegisteredEmail] = useState("");

    const [form, setForm] = useState({
        first_name: "",
        last_name: "",
        email: "",
        password: "",
    });

    const [otp, setOtp] = useState("");
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

    async function handleRegister(
        event: FormEvent<HTMLFormElement>,
    ) {
        event.preventDefault();

        setError("");
        setSuccess("");
        setLoading(true);

        try {
            await register(form);
            setRegisteredEmail(form.email);
            setSuccess(t("auth.registerSuccessOtp"));
            setStep("verify");
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

    async function handleVerify(
        event: FormEvent<HTMLFormElement>,
    ) {
        event.preventDefault();

        setError("");
        setSuccess("");
        setLoading(true);

        try {
            await verifyEmail({ token: otp.trim() });
            setSuccess(t("auth.otpVerifySuccess"));

            setTimeout(() => {
                router.push("/login");
            }, 1500);
        } catch (submitError) {
            setError(
                submitError instanceof Error
                    ? submitError.message
                    : t("auth.otpVerifyError"),
            );
        } finally {
            setLoading(false);
        }
    }

    return (
        <main className="min-h-screen bg-background">
            <section className="mx-auto flex max-w-md px-6 py-16">
                <div className="w-full rounded-2xl border border-border bg-surface p-8 shadow-sm">
                    {step === "register" ? (
                        <>
                            <h1 className="text-3xl font-semibold tracking-tight">
                                {t("auth.registerTitle")}
                            </h1>

                            <p className="mt-2 text-foreground-muted">
                                {t("auth.registerDescription")}
                            </p>

                            <form
                                onSubmit={handleRegister}
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
                        </>
                    ) : (
                        <>
                            <h1 className="text-3xl font-semibold tracking-tight">
                                {t("auth.otpTitle")}
                            </h1>

                            <p className="mt-2 text-foreground-muted">
                                {t("auth.otpDescription").replace("{email}", registeredEmail)}
                            </p>

                            <form
                                onSubmit={handleVerify}
                                className="mt-8 space-y-5"
                            >
                                <Field label={t("auth.otpLabel")} htmlFor="otp">
                                    <Input
                                        id="otp"
                                        type="text"
                                        inputMode="numeric"
                                        autoComplete="one-time-code"
                                        required
                                        maxLength={6}
                                        placeholder="123456"
                                        value={otp}
                                        onChange={(event) =>
                                            setOtp(event.target.value.replace(/\D/g, ""))
                                        }
                                        className="text-center text-2xl tracking-widest"
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
                                    disabled={loading || otp.length !== 6}
                                    className="w-full py-3"
                                >
                                    {loading ? t("auth.otpVerifying") : t("auth.otpVerifyButton")}
                                </Button>
                            </form>

                            <p className="mt-4 text-center text-sm text-foreground-muted">
                                {t("auth.otpResendHint")}{" "}
                                <a
                                    href="/login"
                                    className="font-medium text-primary underline-offset-2 hover:underline"
                                >
                                    {t("auth.loginLink")}
                                </a>
                            </p>
                        </>
                    )}
                </div>
            </section>
        </main>
    );
}
