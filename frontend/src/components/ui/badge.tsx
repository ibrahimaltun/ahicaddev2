import type { ReactNode } from "react";

export type BadgeTone =
    | "neutral"
    | "warning"
    | "info"
    | "success"
    | "danger"
    | "primary";

const TONE_CLASSES: Record<BadgeTone, string> = {
    neutral: "bg-surface-2 text-foreground-muted border-border",
    warning: "bg-warning-bg text-warning-fg border-warning-border",
    info: "bg-info-bg text-info-fg border-info-border",
    success: "bg-success-bg text-success-fg border-success-border",
    danger: "bg-danger-bg text-danger-fg border-danger-border",
    primary: "bg-primary-soft text-primary-soft-foreground border-transparent",
};

export function Badge({
    tone = "neutral",
    className = "",
    children,
}: {
    tone?: BadgeTone;
    className?: string;
    children: ReactNode;
}) {
    return (
        <span
            className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${TONE_CLASSES[tone]} ${className}`}
        >
            {children}
        </span>
    );
}
