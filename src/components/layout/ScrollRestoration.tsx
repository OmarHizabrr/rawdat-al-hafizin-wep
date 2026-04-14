"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

const storageKeyForPath = (path: string) => `scroll-pos:${path}`;

export function ScrollRestoration() {
  const pathname = usePathname();

  useEffect(() => {
    if (typeof window === "undefined") return;
    const key = storageKeyForPath(pathname || "/");

    const restore = () => {
      const saved = sessionStorage.getItem(key);
      if (!saved) return;
      const y = Number(saved);
      if (!Number.isNaN(y)) window.scrollTo(0, y);
    };

    const save = () => {
      sessionStorage.setItem(key, String(window.scrollY));
    };

    restore();
    window.history.scrollRestoration = "manual";
    window.addEventListener("scroll", save, { passive: true });
    window.addEventListener("pagehide", save);
    document.addEventListener("visibilitychange", save);

    return () => {
      save();
      window.removeEventListener("scroll", save);
      window.removeEventListener("pagehide", save);
      document.removeEventListener("visibilitychange", save);
    };
  }, [pathname]);

  return null;
}
