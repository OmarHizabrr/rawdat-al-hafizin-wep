"use client";

import { use } from "react";
import { CoursePlanManager } from "@/components/admin/CoursePlanManager";

interface PageProps {
    params: Promise<{ id: string }>;
}

export default function CoursePlanPage({ params }: PageProps) {
    const { id } = use(params);

    return (
        <div className="container mx-auto py-8">
            <CoursePlanManager 
                courseId={id} 
                backUrl="/admin/courses" 
            />
        </div>
    );
}
