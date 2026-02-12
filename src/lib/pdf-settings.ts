"use client";

export interface PdfSettings {
    rightHeader: string;
    leftHeader: string;
    footerText: string;
    isHeaderVisible: boolean;
    isFooterVisible: boolean;
    fontSize: number;
    margin: number;
    logoBase64: string;
    fontFamily: 'Amiri' | 'Cairo' | 'NotoNaskhArabic';
}

export const defaultPdfSettings: PdfSettings = {
    rightHeader: 'الجمهورية اليمنية\nوزارة الأوقاف والإرشاد\nقطاع تحفيظ القرآن الكريم',
    leftHeader: 'Republic of Yemen\nMinistry of Awqaf\nHoly Quran Sector',
    footerText: 'مدير المركز\n....................',
    isHeaderVisible: true,
    isFooterVisible: true,
    fontSize: 12,
    margin: 20,
    logoBase64: '',
    fontFamily: 'Amiri',
};

const STORAGE_KEY = 'rawdat_pdf_settings';

export const PdfSettingsService = {
    getSettings: (): PdfSettings => {
        if (typeof window === 'undefined') return defaultPdfSettings;
        const saved = localStorage.getItem(STORAGE_KEY);
        if (!saved) return defaultPdfSettings;
        try {
            return JSON.parse(saved);
        } catch {
            return defaultPdfSettings;
        }
    },

    saveSettings: (settings: PdfSettings) => {
        if (typeof window === 'undefined') return;
        localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    },

    resetSettings: () => {
        if (typeof window === 'undefined') return;
        localStorage.removeItem(STORAGE_KEY);
    }
};
