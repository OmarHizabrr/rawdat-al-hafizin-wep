"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { FullAcademicRecords } from "@/components/students/FullAcademicRecords";
import { Loader2 } from "lucide-react";

/** الطلاب والمتقدمون: التوجيه إلى نفس المحتوى داخل بوابة الطالب */
export default function RecordsPage() {
    const { userData } = useAuth();
    const router = useRouter();
    const role = userData?.role;

    useEffect(() => {
        if (role === "student" || role === "applicant") {
            router.replace("/students/records");
        }
    }, [role, router]);

    if (role === "student" || role === "applicant") {
        return (
            <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3 text-muted-foreground">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-sm">جاري التوجيه إلى السجل ضمن بوابة الطالب…</p>
            </div>
        );
    }

    return <FullAcademicRecords />;
}
