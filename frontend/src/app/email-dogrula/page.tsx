"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

import { Notice } from "@/components/ui/notice";
import { verifyEmail } from "@/features/auth/api";
import { useI18n } from "@/features/i18n/LocaleProvider";

function EmailVerificationResult() {
    const { t } = useI18n();
    const searchParams = useSearchParams();

    const token = searchParams.get("token");

    const [result, setResult] = useState<"success" | "error" | null>(null);

    useEffect(() => {
        if (!token) {
            return;
        }

        let cancelled = false;

        (async () => {
            try {
                await verifyEmail({ token });

                if (!cancelled) {
                    setResult("success");
                }
            } catch {
                if (!cancelled) {
                    setResult("error");
                }
            }
        })();

        return () => {
            cancelled = true;
        };
    }, [token]);

    const status = !token ? "error" : (result ?? "verifying");

    return (
        <div className="w-full rounded-2xl border border-border bg-surface p-8 shadow-sm">
            <h1 className="text-3xl font-semibold tracking-tight">
                {t("auth.verifyTitle")}
            </h1>

            <div className="mt-6">
                {status === "verifying" ? (
                    <p className="text-sm text-foreground-muted">
                        {t("auth.verifying")}
                    </p>
                ) : null}

                {status === "success" ? (
                    <Notice tone="success">{t("auth.verifySuccess")}</Notice>
                ) : null}

                {status === "error" ? (
                    <Notice tone="error">{t("auth.verifyError")}</Notice>
                ) : null}
            </div>

            <Link
                href="/"
                className="mt-6 block text-center text-sm font-medium text-primary hover:underline"
            >
                {t("auth.verifyBackToHome")}
            </Link>
        </div>
    );
}

export default function EmailVerificationPage() {
    return (
        <main className="min-h-screen bg-background">
            <section className="mx-auto flex min-h-[calc(100vh-160px)] max-w-md items-center px-6 py-16">
                <Suspense>
                    <EmailVerificationResult />
                </Suspense>
            </section>
        </main>
    );
}