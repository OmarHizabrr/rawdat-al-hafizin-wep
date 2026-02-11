"use client";

import { GlassCard } from "@/components/ui/GlassCard";
import { FileText } from "lucide-react";

export default function RecordsPage() {
    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <FileText className="h-8 w-8 text-primary" />
                <h1 className="text-3xl font-bold">السجلات</h1>
            </div>

            <GlassCard className="p-12 text-center text-muted-foreground">
                <p>جاري العمل على صفحة السجلات...</p>
            </GlassCard>
        </div>
    );
}
