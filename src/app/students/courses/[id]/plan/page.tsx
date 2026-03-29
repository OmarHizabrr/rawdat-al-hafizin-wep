"use client";

import { use } from "react";
import { StudentPlanView } from "@/components/students/StudentPlanView";

interface PageProps {
    params: Promise<{ id: string }>;
}

export default function StudentCoursePlanPage({ params }: PageProps) {
    const { id } = use(params);

    return (
        <div className="container mx-auto py-8">
            <StudentPlanView 
                courseId={id} 
                backUrl={`/students/courses/${id}`} 
            />
        </div>
    );
}
