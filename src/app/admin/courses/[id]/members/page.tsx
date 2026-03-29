"use client";

import { useParams } from "next/navigation";
import { GroupMembersManager } from "@/components/admin/GroupMembersManager";

export default function CourseMembersPage() {
    const { id } = useParams() as { id: string };
    
    return (
        <GroupMembersManager 
            groupId={id} 
            groupType="course" 
            backUrl="/admin/courses" 
        />
    );
}

