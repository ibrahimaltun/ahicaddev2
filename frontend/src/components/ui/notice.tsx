import type { ReactNode } from "react";

export type NoticeTone = "success" | "error" | "info" | "warning";

const TONE_CLASSES: Record<NoticeTone, string> = {
    success: "border-success-border bg-success-bg text-success-fg",
    error: "border-danger-border bg-danger-bg text-danger-fg",
    info: "border-info-border bg-info-bg text-info-fg",
    warning: "border-warning-border bg-warning-bg text-warning-fg",
};

export function Notice({
    tone = "info",
    role,
    className = "",
    children,
}: {
    tone?: NoticeTone;
    role?: string;
    className?: string;
    children: ReactNode;
}) {
    return (
        <div
            role={role}
            className={`rounded-xl border px-4 py-3 text-sm ${TONE_CLASSES[tone]} ${className}`}
        >
            {children}
        </div>
    );
}
