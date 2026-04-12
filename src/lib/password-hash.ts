/**
 * بصمة كلمة المرور للتحقق من تسجيل الدخول بالهاتف (بدون إرسال النص الصريح لاحقاً).
 * الحسابات القديمة ما زالت تستخدم حقل password النصي في Firestore حتى تُحدَّث.
 */
export async function sha256Hex(plain: string): Promise<string> {
    const enc = new TextEncoder().encode(plain);
    const buf = await crypto.subtle.digest("SHA-256", enc);
    return Array.from(new Uint8Array(buf))
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");
}

/** إن وُجد passwordHash يُعتمد فقط عليه (بدون الرجوع إلى النص الصريح). */
export async function verifyPhonePassword(
    storedPassword: string | undefined,
    storedHash: string | undefined,
    input: string
): Promise<boolean> {
    if (storedHash && storedHash.length > 0) {
        return (await sha256Hex(input)) === storedHash;
    }
    if (storedPassword !== undefined && storedPassword !== "") {
        return storedPassword === input;
    }
    return false;
}
