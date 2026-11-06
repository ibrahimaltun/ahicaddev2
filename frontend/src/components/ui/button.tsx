import type { ButtonHTMLAttributes, ReactNode } from "react";

export type ButtonVariant =
    | "primary"
    | "secondary"
    | "soft"
    | "ghost"
    | "danger"
    | "danger-outline"
    | "success"
    | "on-primary"
    | "on-primary-outline";

export type ButtonSize = "sm" | "md" | "lg";

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
    // Marka mavisi zemin + beyaz yazi (AA uyumlu kontrast cifti)
    primary:
        "bg-primary text-primary-foreground shadow-sm ring-1 ring-inset ring-white/15 hover:bg-primary-hover active:bg-primary-hover",
    secondary:
        "bg-surface text-foreground border border-border-strong shadow-sm hover:bg-surface-2",
    soft: "bg-primary-soft text-primary-soft-foreground hover:bg-primary-soft-hover",
    ghost: "text-foreground-muted hover:bg-surface-2 hover:text-foreground",
    danger: "bg-danger-solid text-white shadow-sm hover:bg-danger-solid-hover",
    "danger-outline":
        "border border-danger-border bg-danger-bg/40 text-danger-fg hover:bg-danger-bg",
    success: "bg-success-solid text-white shadow-sm hover:bg-success-solid-hover",
    // Renkli bantlar (bg-primary) uzerinde her kosulda okunur butonlar:
    // beyaz zemin + marka renginde yazi, metin bagimsiz olarak okunur.
    "on-primary":
        "bg-white text-primary shadow-sm hover:bg-white/90 active:bg-white/80",
    "on-primary-outline":
        "border border-white/70 text-white hover:bg-white/10 active:bg-white/20",
};

const SIZE_CLASSES: Record<ButtonSize, string> = {
    sm: "px-3 py-1.5 text-sm",
    md: "px-4 py-2 text-sm",
    lg: "px-6 py-3 text-base",
};

const BASE_CLASSES =
    "inline-flex items-center justify-center gap-2 rounded-xl font-medium transition-colors " +
    "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring " +
    "disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-inherit";

export function buttonClasses(
    variant: ButtonVariant = "primary",
    size: ButtonSize = "md",
    extraClassName = "",
): string {
    return [
        BASE_CLASSES,
        VARIANT_CLASSES[variant],
        SIZE_CLASSES[size],
        extraClassName,
    ]
        .filter(Boolean)
        .join(" ");
}

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: ButtonVariant;
    size?: ButtonSize;
    children: ReactNode;
}

export function Button({
    variant = "primary",
    size = "md",
    className = "",
    type = "button",
    children,
    ...rest
}: ButtonProps) {
    return (
        <button
            type={type}
            className={buttonClasses(variant, size, className)}
            {...rest}
        >
            {children}
        </button>
    );
}
