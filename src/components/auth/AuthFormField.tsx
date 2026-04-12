"use client";

import { type ComponentType, type ReactNode } from "react";
import { cn } from "@/lib/utils";

export type AuthFormFieldProps = {
    label: string;
    name: string;
    icon: ComponentType<{ className?: string }>;
    type?: string;
    placeholder: string;
    value: string;
    onChange: (value: string) => void;
    dir?: "ltr" | "rtl";
    autoComplete?: string;
    trailing?: ReactNode;
    disabled?: boolean;
};

export function AuthFormField({
    label,
    name,
    icon: Icon,
    type = "text",
    placeholder,
    value,
    onChange,
    dir,
    autoComplete,
    trailing,
    disabled,
}: AuthFormFieldProps) {
    return (
        <div className="space-y-2">
            <label htmlFor={name} className="block text-sm font-medium text-foreground">
                {label}
            </label>
            <div className="relative">
                <span className="pointer-events-none absolute start-3 top-1/2 z-[1] -translate-y-1/2 text-muted-foreground">
                    <Icon className="h-4 w-4 opacity-70" aria-hidden />
                </span>
                <input
                    id={name}
                    name={name}
                    type={type}
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder={placeholder}
                    dir={dir}
                    autoComplete={autoComplete}
                    disabled={disabled}
                    className={cn(
                        "h-12 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm transition-shadow placeholder:text-muted-foreground/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ring-offset-background disabled:cursor-not-allowed disabled:opacity-50",
                        "ps-10",
                        trailing && "pe-11"
                    )}
                />
                {trailing && (
                    <div className="absolute end-2 top-1/2 z-[1] -translate-y-1/2">{trailing}</div>
                )}
            </div>
        </div>
    );
}
