"use client";

import { useState, useEffect } from "react";
import { useTheme } from "next-themes";
import { useAuth } from "@/lib/auth-context";
import {
    Moon,
    Sun,
    Monitor,
    Bell,
    FileText,
    ChevronLeft,
    Headset,
    Star,
    Info,
    LogOut,
    ExternalLink
} from "lucide-react";
import { GlassCard } from "@/components/ui/GlassCard";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function SettingsPage() {
    const { theme, setTheme } = useTheme();
    const { signOut } = useAuth();
    const router = useRouter();
    const [mounted, setMounted] = useState(false);
    const [notificationsEnabled, setNotificationsEnabled] = useState(true);

    // Prevent hydration mismatch
    useEffect(() => {
        setMounted(true);
    }, []);

    const handleLogout = async () => {
        await signOut();
        router.push("/login");
    };

    if (!mounted) return null;

    type SettingsItem = {
        icon: any;
        iconColor: string;
        label: string;
        subLabel?: string;
        value?: string;
        action?: () => void;
        href?: string; // Optional href
        isToggle?: boolean;
        toggleValue?: boolean;
        onToggle?: () => void;
    };

    const sections: { title: string; items: SettingsItem[] }[] = [
        {
            title: "المظهر والتنبيهات",
            items: [
                {
                    icon: theme === 'dark' ? Moon : theme === 'light' ? Sun : Monitor,
                    iconColor: "text-primary",
                    label: "مظهر التطبيق",
                    value: theme === 'dark' ? "داكن" : theme === 'light' ? "فاتح" : "النظام",
                    action: () => {
                        const newTheme = theme === 'system' ? 'light' : theme === 'light' ? 'dark' : 'system';
                        setTheme(newTheme);
                    }
                },
                {
                    icon: Bell,
                    iconColor: "text-yellow-500",
                    label: "الإشعارات",
                    value: notificationsEnabled ? "مفعل" : "معطل",
                    subLabel: "تلقي تنبيهات بمواعيد الحلقات",
                    isToggle: true,
                    toggleValue: notificationsEnabled,
                    onToggle: () => setNotificationsEnabled(!notificationsEnabled)
                }
            ]
        },
        {
            title: "إعدادات النظام",
            items: [
                {
                    icon: FileText,
                    iconColor: "text-red-500",
                    label: "إعدادات الطباعة (PDF)",
                    subLabel: "تخصيص الخطوط والرؤوس والتذييلات",
                    href: "/settings/pdf"
                }
            ]
        },
        {
            title: "الدعم والتواصل",
            items: [
                {
                    icon: Headset,
                    iconColor: "text-green-500",
                    label: "تواصل معنا",
                    subLabel: "اقتراحات أو بلاغات عن مشاكل",
                    action: () => window.open("https://wa.me/967777613709", "_blank")
                },
                {
                    icon: Star,
                    iconColor: "text-amber-500",
                    label: "قيم التطبيق",
                    action: () => alert("سيتم توجيهك للمتجر قريباً")
                },
                {
                    icon: Info,
                    iconColor: "text-gray-500",
                    label: "عن التطبيق",
                    subLabel: "الإصدار 1.2.0 (Web)",
                    action: () => alert("روضة الحافظين - منصة تعليمية شاملة للقرآن والسنة.")
                }
            ]
        }
    ];

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <header className="text-center space-y-2">
                <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
                    الإعدادات
                </h1>
                <p className="text-muted-foreground">تخصيص التطبيق وتفضيلات الاستخدام</p>
            </header>

            <div className="space-y-6 max-w-2xl mx-auto">
                {sections.map((section, idx) => (
                    <div key={idx} className="space-y-3">
                        <h2 className="text-sm font-bold text-primary px-2">{section.title}</h2>
                        <GlassCard className="p-0 overflow-hidden">
                            {section.items.map((item, itemIdx) => (
                                <div key={itemIdx}>
                                    <div
                                        onClick={item.action || (item.isToggle ? item.onToggle : undefined)}
                                        className={`
                                            flex items-center justify-between p-4 transition-colors
                                            ${item.href ? "" : "cursor-pointer hover:bg-black/5 dark:hover:bg-white/5"}
                                        `}
                                    >
                                        {item.href ? (
                                            <Link href={item.href} className="flex items-center flex-1 gap-4">
                                                <RowContent item={item} />
                                            </Link>
                                        ) : (
                                            <div className="flex items-center flex-1 gap-4">
                                                <RowContent item={item} />
                                            </div>
                                        )}

                                        {item.isToggle && (
                                            <div className={`
                                                w-11 h-6 rounded-full transition-colors flex items-center px-1
                                                ${item.toggleValue ? "bg-primary" : "bg-gray-300 dark:bg-gray-700"}
                                            `}>
                                                <div className={`
                                                    w-4 h-4 rounded-full bg-white shadow transition-transform
                                                    ${item.toggleValue ? "translate-x-[-20px] rtl:translate-x-[-20px]" : "translate-x-0"}
                                                `} />
                                            </div>
                                        )}
                                    </div>
                                    {itemIdx < section.items.length - 1 && (
                                        <hr className="border-gray-100 dark:border-white/5 mx-4" />
                                    )}
                                </div>
                            ))}
                        </GlassCard>
                    </div>
                ))}

                <div className="pt-4">
                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center justify-center gap-2 p-4 rounded-xl border border-red-200 dark:border-red-900/30 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors font-medium"
                    >
                        <LogOut className="w-5 h-5" />
                        <span>تسجيل الخروج</span>
                    </button>
                    <p className="text-center text-xs text-muted-foreground mt-4">
                        الرقم التعريفي للجلسة: {Math.random().toString(36).substr(2, 9).toUpperCase()}
                    </p>
                </div>
            </div>
        </div>
    );
}

function RowContent({ item }: { item: any }) {
    return (
        <>
            <div className={`p-2 rounded-lg bg-gray-50 dark:bg-white/5 ${item.iconColor}`}>
                <item.icon className="w-5 h-5" />
            </div>
            <div className="flex-1 text-right">
                <p className="font-medium">{item.label}</p>
                {item.subLabel && (
                    <p className="text-xs text-muted-foreground">{item.subLabel}</p>
                )}
            </div>
            {item.value && (
                <span className="text-sm text-muted-foreground font-medium px-2">
                    {item.value}
                </span>
            )}
            {item.href && <ChevronLeft className="w-4 h-4 text-muted-foreground" />}
            {!item.href && !item.isToggle && !item.value && <div />}
        </>
    );
}
