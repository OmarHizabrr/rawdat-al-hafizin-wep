/**
 * مسار مفيد لعرض/إدارة مستخدم من سياق الصفحة الحالية (مثل اختيار المستلمين في الإشعارات).
 * يعيد null عندما لا يوجد مسار آمن أو مناسب.
 */
export function getUserProfilePath(
    pathname: string,
    targetUserId: string,
    viewerRole?: string | null
): string | null {
    if (!targetUserId || typeof pathname !== "string") return null;
    if (pathname.startsWith("/students")) return null;
    if (pathname.startsWith("/teachers")) return null;
    if (viewerRole === "admin" || viewerRole === "committee") {
        return `/admin/users?userId=${encodeURIComponent(targetUserId)}`;
    }
    return null;
}
