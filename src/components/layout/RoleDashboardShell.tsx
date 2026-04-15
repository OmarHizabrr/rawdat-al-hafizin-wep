"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogOut, Menu, Search, X, type LucideIcon } from "lucide-react";
import { UserMenuDropdown } from "@/components/layout/UserMenuDropdown";

type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
};

type Props = {
  title: string;
  titleIcon: LucideIcon;
  searchLabel: string;
  navItems: NavItem[];
  children: React.ReactNode;
  onSignOut: () => void;
};

export function RoleDashboardShell({
  title,
  titleIcon: TitleIcon,
  searchLabel,
  navItems,
  children,
  onSignOut,
}: Props) {
  const pathname = usePathname();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setIsMobile(true);
        setIsSidebarOpen(false);
      } else {
        setIsMobile(false);
        setIsSidebarOpen(true);
      }
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <div className="flex min-h-screen bg-muted/30 text-foreground dir-rtl">
      <aside
        className={`fixed inset-y-0 right-0 z-50 w-72 border-l border-border bg-card shadow-sm transition-transform duration-200 ease-out dark:bg-card ${
          isSidebarOpen ? "translate-x-0" : "translate-x-full"
        } ${isMobile ? "" : "lg:static lg:translate-x-0"}`}
      >
        <div className="flex items-center justify-between border-b border-border p-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm">
              <TitleIcon className="h-6 w-6" />
            </div>
            <h1 className="text-lg font-semibold tracking-tight text-foreground">{title}</h1>
          </div>
          {isMobile && (
            <button
              type="button"
              onClick={() => setIsSidebarOpen(false)}
              className="flex h-10 w-10 items-center justify-center rounded-lg border border-border text-muted-foreground transition-colors hover:bg-muted"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>

        <nav className="space-y-1 p-4">
          <p className="px-3 py-2 text-xs font-medium text-muted-foreground">القائمة</p>
          {navItems.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href === "/notifications" && pathname.startsWith("/notifications"));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                <item.icon className={`h-5 w-5 shrink-0 ${isActive ? "opacity-100" : "opacity-80"}`} />
                <span>{item.label}</span>
              </Link>
            );
          })}

          <button
            type="button"
            onClick={onSignOut}
            className="mt-6 flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-destructive transition-colors hover:bg-destructive/10"
          >
            <LogOut className="h-5 w-5" />
            تسجيل الخروج
          </button>
        </nav>
      </aside>

      {isMobile && isSidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40"
          onClick={() => setIsSidebarOpen(false)}
          aria-hidden
        />
      )}

      <main className="flex min-h-screen flex-1 flex-col overflow-hidden bg-background">
        <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b border-border bg-card px-4 shadow-sm md:px-8">
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-background transition-colors hover:bg-muted"
            >
              <Menu className="h-5 w-5" />
            </button>

            <div className="hidden items-center gap-2 rounded-lg border border-border bg-muted/40 px-3 py-1.5 sm:flex">
              <span className="text-xs text-muted-foreground">{searchLabel}</span>
              <Search className="h-4 w-4 text-muted-foreground" />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <UserMenuDropdown />
          </div>
        </header>

        <div className="mx-auto w-full max-w-7xl space-y-8 p-4 md:p-8">{children}</div>
      </main>
    </div>
  );
}
