"use client";

import { GlassCard } from "@/components/ui/GlassCard";
import { Users } from "lucide-react";

export default function StudentsPage() {
    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Users className="h-8 w-8 text-primary" />
                <h1 className="text-3xl font-bold">الطلاب</h1>
            </div>

            <GlassCard className="p-12 text-center text-muted-foreground">
                <p>جاري العمل على صفحة الطلاب...</p>
            </GlassCard>
        </div>
    );
}
