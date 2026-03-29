"use client";

import { useParams } from "next/navigation";
import { GroupMembersManager } from "@/components/admin/GroupMembersManager";

export default function HalaqaMembersPage() {
    const { id } = useParams() as { id: string };
    
    return (
        <GroupMembersManager 
            groupId={id} 
            groupType="halaqa" 
            backUrl="/admin/halaqat" 
        />
    );
}

