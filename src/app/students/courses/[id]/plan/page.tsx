"use client";

import { use, useEffect } from "react";
import { useRouter } from "next/navigation";

interface PageProps {
    params: Promise<{ id: string }>;
}

export default function StudentCoursePlanPage({ params }: PageProps) {
    const { id } = use(params);
    const router = useRouter();

    useEffect(() => {
        router.replace(`/students/courses/${id}`);
    }, [id, router]);

    return (
        <div className="container mx-auto py-8 text-center text-sm font-bold opacity-70">
            جاري تحويلك إلى تفاصيل الدورة...
        </div>
    );
}
