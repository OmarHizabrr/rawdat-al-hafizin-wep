"use client";

import { cn } from "@/lib/utils";

type ResponsivePageShellProps = {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
};

export function ResponsivePageShell({
  title,
  subtitle,
  actions,
  children,
  className,
}: ResponsivePageShellProps) {
  return (
    <div className={cn("mx-auto w-full max-w-6xl space-y-8 px-3 pb-16 pt-2 sm:px-4 md:space-y-10 md:px-6", className)}>
      <header className="rounded-2xl border border-border/70 bg-card/80 p-4 shadow-sm backdrop-blur-sm sm:p-5 md:rounded-3xl md:p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="space-y-1.5">
            <h1 className="text-xl font-extrabold tracking-tight text-foreground sm:text-2xl md:text-3xl">{title}</h1>
            {subtitle ? <p className="max-w-3xl text-xs text-muted-foreground sm:text-sm">{subtitle}</p> : null}
          </div>
          {actions ? <div className="flex w-full flex-wrap gap-2 sm:w-auto sm:justify-end">{actions}</div> : null}
        </div>
      </header>
      {children}
    </div>
  );
}
