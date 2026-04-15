import type { LucideIcon } from "lucide-react";
import {
  Home,
  BookOpen,
  Users,
  ShieldCheck,
  GraduationCap,
  LayoutDashboard,
  Key,
  BarChart3,
  Bell,
  Layers,
} from "lucide-react";

export type PublicNavItem = {
  name: string;
  href: string;
  icon: LucideIcon;
};

export type DashboardNavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
};

export const publicNavItems: PublicNavItem[] = [
  { name: "الرئيسية", href: "/", icon: Home },
  { name: "التعريف بالبرنامج", href: "/about", icon: BookOpen },
  { name: "بوابة الطلاب", href: "/students", icon: Users },
];

export const adminDashboardNavItems: DashboardNavItem[] = [
  { href: "/admin", label: "لوحة التحكم", icon: LayoutDashboard },
  { href: "/admin/courses", label: "إدارة الدورات", icon: BookOpen },
  { href: "/admin/plans", label: "قوالب الخطط", icon: Layers },
  { href: "/admin/users", label: "المستخدمين", icon: Users },
  { href: "/admin/access-codes", label: "رموز الوصول", icon: Key },
  { href: "/admin/statistics", label: "الإحصائيات", icon: BarChart3 },
  { href: "/notifications", label: "الإشعارات والمحادثات", icon: Bell },
];

export const teacherDashboardNavItems: DashboardNavItem[] = [
  { href: "/teachers", label: "الحلقات", icon: LayoutDashboard },
  { href: "/notifications", label: "الإشعارات والمحادثات", icon: Bell },
];

const authRoutes = new Set(["/login", "/register", "/access-code"]);

export function isAuthRoute(pathname: string): boolean {
  return authRoutes.has(pathname);
}

export function isDashboardRoute(pathname: string): boolean {
  return pathname.startsWith("/admin") || pathname.startsWith("/teachers");
}

export function shouldHidePublicNavbar(pathname: string): boolean {
  return isDashboardRoute(pathname) || isAuthRoute(pathname);
}

export function getPublicNavItemsForRole(role?: string): PublicNavItem[] {
  const items = [...publicNavItems];
  if (role === "admin" || role === "committee") {
    items.push({ name: "الإدارة", href: "/admin", icon: ShieldCheck });
  } else if (role === "teacher") {
    items.push({ name: "لوحة المعلم", href: "/teachers", icon: GraduationCap });
  }
  return items;
}
