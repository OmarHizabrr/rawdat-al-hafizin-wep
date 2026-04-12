/**
 * حقول شائعة من مستند users/{uid} في Firestore.
 * يُسمح بحقول إضافية ديناميكية.
 */
export interface UserDocument {
    uid?: string;
    email?: string | null;
    displayName?: string | null;
    photoURL?: string | null;
    phoneNumber?: string;
    phoneNumberNormalized?: string;
    /** قديم: نص صريح (توافق تطبيق Flutter) */
    password?: string;
    /** جديد: SHA-256 سداسي عشري لكلمة المرور */
    passwordHash?: string;
    role?: string;
    isActive?: boolean;
    authProvider?: string;
    totalPoints?: number;
    groupId?: string;
    accessCode?: string;
    [key: string]: unknown;
}
