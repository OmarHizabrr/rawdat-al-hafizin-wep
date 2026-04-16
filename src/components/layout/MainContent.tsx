"use client";

import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { isAuthRoute, isDashboardRoute } from "@/config/navigation";

export function MainContent({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const noShellPadding = isDashboardRoute(pathname) || isAuthRoute(pathname);

    return (
        <main
            className={cn(
                "flex-1 pb-10",
                noShellPadding ? "min-h-0 px-0 pt-0" : "px-4 pt-24 md:px-6 lg:pr-80"
            )}
        >
            {noShellPadding ? (
                children
            ) : (
                <div className="mx-auto max-w-7xl">{children}</div>
            )}
        </main>
    );
}
