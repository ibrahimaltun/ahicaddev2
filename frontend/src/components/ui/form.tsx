import type {
    InputHTMLAttributes,
    LabelHTMLAttributes,
    ReactNode,
    SelectHTMLAttributes,
    TextareaHTMLAttributes,
} from "react";

const CONTROL_CLASSES =
    "w-full rounded-xl border border-border-strong bg-surface px-4 py-3 text-foreground " +
    "transition-colors placeholder:text-foreground-subtle focus:border-ring focus:outline-none " +
    "disabled:cursor-not-allowed disabled:opacity-55";

export function Label({
    htmlFor,
    children,
    className = "",
    ...rest
}: LabelHTMLAttributes<HTMLLabelElement>) {
    return (
        <label
            htmlFor={htmlFor}
            className={`mb-2 block text-sm font-medium text-foreground ${className}`}
            {...rest}
        >
            {children}
        </label>
    );
}

export function Input({
    className = "",
    ...rest
}: InputHTMLAttributes<HTMLInputElement>) {
    return <input className={`${CONTROL_CLASSES} ${className}`} {...rest} />;
}

export function Select({
    className = "",
    children,
    ...rest
}: SelectHTMLAttributes<HTMLSelectElement>) {
    return (
        <select className={`${CONTROL_CLASSES} ${className}`} {...rest}>
            {children}
        </select>
    );
}

export function Textarea({
    className = "",
    ...rest
}: TextareaHTMLAttributes<HTMLTextAreaElement>) {
    return (
        <textarea
            className={`${CONTROL_CLASSES} min-h-28 ${className}`}
            {...rest}
        />
    );
}

export function Field({
    label,
    htmlFor,
    hint,
    children,
}: {
    label: string;
    htmlFor: string;
    hint?: string;
    children: ReactNode;
}) {
    return (
        <div>
            <Label htmlFor={htmlFor}>{label}</Label>
            {children}
            {hint && (
                <p className="mt-1.5 text-xs text-foreground-subtle">{hint}</p>
            )}
        </div>
    );
}
