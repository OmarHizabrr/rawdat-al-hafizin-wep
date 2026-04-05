export interface SunnahVolume {
    id: string;
    title: string;
    totalPages: number;
    color: string;
}

export const SUNNAH_VOLUMES: SunnahVolume[] = [
    { id: 'muttafaq_1', title: 'المتفق عليه ١', totalPages: 188, color: 'from-blue-500 to-blue-600' },
    { id: 'muttafaq_2', title: 'المتفق عليه ٢', totalPages: 193, color: 'from-indigo-500 to-indigo-600' },
    { id: 'muttafaq_3', title: 'المتفق عليه ٣', totalPages: 211, color: 'from-purple-500 to-purple-600' },
    { id: 'muttafaq_4', title: 'المتفق عليه ٤', totalPages: 176, color: 'from-cyan-500 to-cyan-600' },
    { id: 'bukhari_vocabulary', title: 'مفردات البخاري', totalPages: 176, color: 'from-emerald-500 to-emerald-600' },
    { id: 'muslim_vocabulary', title: 'مفردات مسلم', totalPages: 214, color: 'from-teal-500 to-teal-600' },
    { id: 'abu_dawood_1', title: 'زوائد أبي داود (١)', totalPages: 271, color: 'from-amber-500 to-amber-600' },
    { id: 'abu_dawood_2', title: 'زوائد أبي داود (٢)', totalPages: 276, color: 'from-orange-500 to-orange-600' },
    { id: 'tirmidhi', title: 'زوائد الترمذي', totalPages: 224, color: 'from-pink-500 to-pink-600' },
    { id: 'nasa_majah_darimi', title: 'النسائي وابن ماجه والدارمي', totalPages: 142, color: 'from-rose-500 to-rose-600' },
    { id: 'musnads', title: 'المسانيد', totalPages: 319, color: 'from-slate-600 to-slate-700' },
    { id: 'sahihs_lexicons', title: 'الصحاح والمعاجم', totalPages: 138, color: 'from-gray-700 to-gray-800' },
];
