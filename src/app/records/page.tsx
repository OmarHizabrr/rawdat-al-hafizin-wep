"use client";

import { FullAcademicRecords } from "@/components/students/FullAcademicRecords";
import { ResponsivePageShell } from "@/components/layout/ResponsivePageShell";

export default function RecordsPage() {
    return (
        <ResponsivePageShell
            title="السجل الأكاديمي الشامل"
            subtitle="عرض موحد لإنجازاتك، الاختبارات، النقاط، والأوسمة بطريقة واضحة على الموبايل والكمبيوتر."
            className="max-w-6xl"
        >
            <FullAcademicRecords />
        </ResponsivePageShell>
    );
}
