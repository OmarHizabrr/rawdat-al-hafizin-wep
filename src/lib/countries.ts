export interface Country {
    name: string;
    code: string; // ISO code
    dialCode: string;
    flag: string;
}

export const countries: Country[] = [
    { name: "السعودية", code: "SA", dialCode: "+966", flag: "🇸🇦" },
    { name: "الإمارات", code: "AE", dialCode: "+971", flag: "🇦🇪" },
    { name: "الكويت", code: "KW", dialCode: "+965", flag: "🇰🇼" },
    { name: "قطر", code: "QA", dialCode: "+974", flag: "🇶🇦" },
    { name: "عمان", code: "OM", dialCode: "+968", flag: "🇴🇲" },
    { name: "البحرين", code: "BH", dialCode: "+973", flag: "🇧🇭" },
    { name: "مصر", code: "EG", dialCode: "+20", flag: "🇪🇬" },
    { name: "الأردن", code: "JO", dialCode: "+962", flag: "🇯🇴" },
    { name: "سوريا", code: "SY", dialCode: "+963", flag: "🇸🇾" },
    { name: "لبنان", code: "LB", dialCode: "+961", flag: "🇱🇧" },
    { name: "فلسطين", code: "PS", dialCode: "+970", flag: "🇵🇸" },
    { name: "العراق", code: "IQ", dialCode: "+964", flag: "🇮🇶" },
    { name: "اليمن", code: "YE", dialCode: "+967", flag: "🇾🇪" },
    { name: "ليبيا", code: "LY", dialCode: "+218", flag: "🇱🇾" },
    { name: "تونس", code: "TN", dialCode: "+216", flag: "🇹🇳" },
    { name: "الجزائر", code: "DZ", dialCode: "+213", flag: "🇩🇿" },
    { name: "المغرب", code: "MA", dialCode: "+212", flag: "🇲🇦" },
    { name: "السودان", code: "SD", dialCode: "+249", flag: "🇸🇩" },
    { name: "موريتانيا", code: "MR", dialCode: "+222", flag: "🇲🇷" },
    { name: "جيبوتي", code: "DJ", dialCode: "+253", flag: "🇩🇯" },
    { name: "الصومال", code: "SO", dialCode: "+252", flag: "🇸🇴" },
    { name: "تركيا", code: "TR", dialCode: "+90", flag: "🇹🇷" },
    { name: "ماليزيا", code: "MY", dialCode: "+60", flag: "🇲🇾" },
    { name: "إندونيسيا", code: "ID", dialCode: "+62", flag: "🇮🇩" },
    { name: "باكستان", code: "PK", dialCode: "+92", flag: "🇵🇰" },
    { name: "أفغانستان", code: "AF", dialCode: "+93", flag: "🇦🇫" },
    { name: "فرنسا", code: "FR", dialCode: "+33", flag: "🇫🇷" },
    { name: "ألمانيا", code: "DE", dialCode: "+49", flag: "🇩🇪" },
    { name: "بريطانيا", code: "GB", dialCode: "+44", flag: "🇬🇧" },
    { name: "أمريكا", code: "US", dialCode: "+1", flag: "🇺🇸" },
    { name: "كندا", code: "CA", dialCode: "+1", flag: "🇨🇦" },
    { name: "أستراليا", code: "AU", dialCode: "+61", flag: "🇦🇺" },
    { name: "السويد", code: "SE", dialCode: "+46", flag: "🇸🇪" },
    { name: "النرويج", code: "NO", dialCode: "+47", flag: "🇳🇴" },
    { name: "هولندا", code: "NL", dialCode: "+31", flag: "🇳🇱" },
    { name: "إسبانيا", code: "ES", dialCode: "+34", flag: "🇪🇸" },
    { name: "إيطاليا", code: "IT", dialCode: "+39", flag: "🇮🇹" },
    { name: "النمسا", code: "AT", dialCode: "+43", flag: "🇦🇹" },
    { name: "سويسرا", code: "CH", dialCode: "+41", flag: "🇨🇭" },
    { name: "بلجيكا", code: "BE", dialCode: "+32", flag: "🇧🇪" },
];
