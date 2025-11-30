// Country data with ISO codes, names (English/Arabic), and map coordinates
// Priority countries (Middle East) are listed first in the PRIORITY_COUNTRIES array

export const PRIORITY_COUNTRIES = ['SA', 'AE', 'KW', 'QA', 'BH', 'OM', 'JO', 'EG'];

export interface CountryData {
    name: {
        en: string;
        ar: string;
    };
    coordinates: {
        lat: number;
        lng: number;
        zoom: number;
    };
}

export const COUNTRY_DATA: Record<string, CountryData> = {
    // Priority Countries (Middle East)
    SA: {
        name: { en: 'Saudi Arabia', ar: 'المملكة العربية السعودية' },
        coordinates: { lat: 24.7136, lng: 46.6753, zoom: 6 }
    },
    AE: {
        name: { en: 'United Arab Emirates', ar: 'الإمارات العربية المتحدة' },
        coordinates: { lat: 23.4241, lng: 53.8478, zoom: 7 }
    },
    KW: {
        name: { en: 'Kuwait', ar: 'الكويت' },
        coordinates: { lat: 29.3117, lng: 47.4818, zoom: 8 }
    },
    QA: {
        name: { en: 'Qatar', ar: 'قطر' },
        coordinates: { lat: 25.3548, lng: 51.1839, zoom: 8 }
    },
    BH: {
        name: { en: 'Bahrain', ar: 'البحرين' },
        coordinates: { lat: 26.0667, lng: 50.5577, zoom: 10 }
    },
    OM: {
        name: { en: 'Oman', ar: 'عمان' },
        coordinates: { lat: 21.4735, lng: 55.9754, zoom: 6 }
    },
    JO: {
        name: { en: 'Jordan', ar: 'الأردن' },
        coordinates: { lat: 30.5852, lng: 36.2384, zoom: 7 }
    },
    EG: {
        name: { en: 'Egypt', ar: 'مصر' },
        coordinates: { lat: 26.8206, lng: 30.8025, zoom: 6 }
    },

    // All Other Countries (Alphabetically)
    AF: {
        name: { en: 'Afghanistan', ar: 'أفغانستان' },
        coordinates: { lat: 33.9391, lng: 67.7100, zoom: 6 }
    },
    AL: {
        name: { en: 'Albania', ar: 'ألبانيا' },
        coordinates: { lat: 41.1533, lng: 20.1683, zoom: 7 }
    },
    DZ: {
        name: { en: 'Algeria', ar: 'الجزائر' },
        coordinates: { lat: 28.0339, lng: 1.6596, zoom: 5 }
    },
    AR: {
        name: { en: 'Argentina', ar: 'الأرجنتين' },
        coordinates: { lat: -38.4161, lng: -63.6167, zoom: 4 }
    },
    AU: {
        name: { en: 'Australia', ar: 'أستراليا' },
        coordinates: { lat: -25.2744, lng: 133.7751, zoom: 4 }
    },
    AT: {
        name: { en: 'Austria', ar: 'النمسا' },
        coordinates: { lat: 47.5162, lng: 14.5501, zoom: 7 }
    },
    BD: {
        name: { en: 'Bangladesh', ar: 'بنغلاديش' },
        coordinates: { lat: 23.6850, lng: 90.3563, zoom: 7 }
    },
    BE: {
        name: { en: 'Belgium', ar: 'بلجيكا' },
        coordinates: { lat: 50.5039, lng: 4.4699, zoom: 8 }
    },
    BR: {
        name: { en: 'Brazil', ar: 'البرازيل' },
        coordinates: { lat: -14.2350, lng: -51.9253, zoom: 4 }
    },
    CA: {
        name: { en: 'Canada', ar: 'كندا' },
        coordinates: { lat: 56.1304, lng: -106.3468, zoom: 4 }
    },
    CL: {
        name: { en: 'Chile', ar: 'تشيلي' },
        coordinates: { lat: -35.6751, lng: -71.5430, zoom: 4 }
    },
    CN: {
        name: { en: 'China', ar: 'الصين' },
        coordinates: { lat: 35.8617, lng: 104.1954, zoom: 4 }
    },
    CO: {
        name: { en: 'Colombia', ar: 'كولومبيا' },
        coordinates: { lat: 4.5709, lng: -74.2973, zoom: 5 }
    },
    CZ: {
        name: { en: 'Czech Republic', ar: 'التشيك' },
        coordinates: { lat: 49.8175, lng: 15.4730, zoom: 7 }
    },
    DK: {
        name: { en: 'Denmark', ar: 'الدنمارك' },
        coordinates: { lat: 56.2639, lng: 9.5018, zoom: 7 }
    },
    FI: {
        name: { en: 'Finland', ar: 'فنلندا' },
        coordinates: { lat: 61.9241, lng: 25.7482, zoom: 5 }
    },
    FR: {
        name: { en: 'France', ar: 'فرنسا' },
        coordinates: { lat: 46.2276, lng: 2.2137, zoom: 6 }
    },
    DE: {
        name: { en: 'Germany', ar: 'ألمانيا' },
        coordinates: { lat: 51.1657, lng: 10.4515, zoom: 6 }
    },
    GR: {
        name: { en: 'Greece', ar: 'اليونان' },
        coordinates: { lat: 39.0742, lng: 21.8243, zoom: 6 }
    },
    HK: {
        name: { en: 'Hong Kong', ar: 'هونغ كونغ' },
        coordinates: { lat: 22.3193, lng: 114.1694, zoom: 11 }
    },
    HU: {
        name: { en: 'Hungary', ar: 'المجر' },
        coordinates: { lat: 47.1625, lng: 19.5033, zoom: 7 }
    },
    IN: {
        name: { en: 'India', ar: 'الهند' },
        coordinates: { lat: 20.5937, lng: 78.9629, zoom: 5 }
    },
    ID: {
        name: { en: 'Indonesia', ar: 'إندونيسيا' },
        coordinates: { lat: -0.7893, lng: 113.9213, zoom: 5 }
    },
    IR: {
        name: { en: 'Iran', ar: 'إيران' },
        coordinates: { lat: 32.4279, lng: 53.6880, zoom: 5 }
    },
    IQ: {
        name: { en: 'Iraq', ar: 'العراق' },
        coordinates: { lat: 33.2232, lng: 43.6793, zoom: 6 }
    },
    IE: {
        name: { en: 'Ireland', ar: 'أيرلندا' },
        coordinates: { lat: 53.4129, lng: -8.2439, zoom: 7 }
    },
    IL: {
        name: { en: 'Israel', ar: 'إسرائيل' },
        coordinates: { lat: 31.0461, lng: 34.8516, zoom: 7 }
    },
    IT: {
        name: { en: 'Italy', ar: 'إيطاليا' },
        coordinates: { lat: 41.8719, lng: 12.5674, zoom: 6 }
    },
    JP: {
        name: { en: 'Japan', ar: 'اليابان' },
        coordinates: { lat: 36.2048, lng: 138.2529, zoom: 5 }
    },
    KE: {
        name: { en: 'Kenya', ar: 'كينيا' },
        coordinates: { lat: -0.0236, lng: 37.9062, zoom: 6 }
    },
    KR: {
        name: { en: 'South Korea', ar: 'كوريا الجنوبية' },
        coordinates: { lat: 35.9078, lng: 127.7669, zoom: 7 }
    },
    LB: {
        name: { en: 'Lebanon', ar: 'لبنان' },
        coordinates: { lat: 33.8547, lng: 35.8623, zoom: 8 }
    },
    LY: {
        name: { en: 'Libya', ar: 'ليبيا' },
        coordinates: { lat: 26.3351, lng: 17.2283, zoom: 5 }
    },
    MY: {
        name: { en: 'Malaysia', ar: 'ماليزيا' },
        coordinates: { lat: 4.2105, lng: 101.9758, zoom: 6 }
    },
    MX: {
        name: { en: 'Mexico', ar: 'المكسيك' },
        coordinates: { lat: 23.6345, lng: -102.5528, zoom: 5 }
    },
    MA: {
        name: { en: 'Morocco', ar: 'المغرب' },
        coordinates: { lat: 31.7917, lng: -7.0926, zoom: 6 }
    },
    NL: {
        name: { en: 'Netherlands', ar: 'هولندا' },
        coordinates: { lat: 52.1326, lng: 5.2913, zoom: 7 }
    },
    NZ: {
        name: { en: 'New Zealand', ar: 'نيوزيلندا' },
        coordinates: { lat: -40.9006, lng: 174.8860, zoom: 5 }
    },
    NG: {
        name: { en: 'Nigeria', ar: 'نيجيريا' },
        coordinates: { lat: 9.0820, lng: 8.6753, zoom: 6 }
    },
    NO: {
        name: { en: 'Norway', ar: 'النرويج' },
        coordinates: { lat: 60.4720, lng: 8.4689, zoom: 5 }
    },
    PK: {
        name: { en: 'Pakistan', ar: 'باكستان' },
        coordinates: { lat: 30.3753, lng: 69.3451, zoom: 5 }
    },
    PH: {
        name: { en: 'Philippines', ar: 'الفلبين' },
        coordinates: { lat: 12.8797, lng: 121.7740, zoom: 6 }
    },
    PL: {
        name: { en: 'Poland', ar: 'بولندا' },
        coordinates: { lat: 51.9194, lng: 19.1451, zoom: 6 }
    },
    PT: {
        name: { en: 'Portugal', ar: 'البرتغال' },
        coordinates: { lat: 39.3999, lng: -8.2245, zoom: 7 }
    },
    RO: {
        name: { en: 'Romania', ar: 'رومانيا' },
        coordinates: { lat: 45.9432, lng: 24.9668, zoom: 7 }
    },
    RU: {
        name: { en: 'Russia', ar: 'روسيا' },
        coordinates: { lat: 61.5240, lng: 105.3188, zoom: 3 }
    },
    SG: {
        name: { en: 'Singapore', ar: 'سنغافورة' },
        coordinates: { lat: 1.3521, lng: 103.8198, zoom: 11 }
    },
    ZA: {
        name: { en: 'South Africa', ar: 'جنوب أفريقيا' },
        coordinates: { lat: -30.5595, lng: 22.9375, zoom: 5 }
    },
    ES: {
        name: { en: 'Spain', ar: 'إسبانيا' },
        coordinates: { lat: 40.4637, lng: -3.7492, zoom: 6 }
    },
    SE: {
        name: { en: 'Sweden', ar: 'السويد' },
        coordinates: { lat: 60.1282, lng: 18.6435, zoom: 5 }
    },
    CH: {
        name: { en: 'Switzerland', ar: 'سويسرا' },
        coordinates: { lat: 46.8182, lng: 8.2275, zoom: 8 }
    },
    SY: {
        name: { en: 'Syria', ar: 'سوريا' },
        coordinates: { lat: 34.8021, lng: 38.9968, zoom: 7 }
    },
    TW: {
        name: { en: 'Taiwan', ar: 'تايوان' },
        coordinates: { lat: 23.6978, lng: 120.9605, zoom: 7 }
    },
    TH: {
        name: { en: 'Thailand', ar: 'تايلاند' },
        coordinates: { lat: 15.8700, lng: 100.9925, zoom: 6 }
    },
    TN: {
        name: { en: 'Tunisia', ar: 'تونس' },
        coordinates: { lat: 33.8869, lng: 9.5375, zoom: 7 }
    },
    TR: {
        name: { en: 'Turkey', ar: 'تركيا' },
        coordinates: { lat: 38.9637, lng: 35.2433, zoom: 6 }
    },
    UA: {
        name: { en: 'Ukraine', ar: 'أوكرانيا' },
        coordinates: { lat: 48.3794, lng: 31.1656, zoom: 6 }
    },
    GB: {
        name: { en: 'United Kingdom', ar: 'المملكة المتحدة' },
        coordinates: { lat: 55.3781, lng: -3.4360, zoom: 6 }
    },
    US: {
        name: { en: 'United States', ar: 'الولايات المتحدة' },
        coordinates: { lat: 37.0902, lng: -95.7129, zoom: 4 }
    },
    VN: {
        name: { en: 'Vietnam', ar: 'فيتنام' },
        coordinates: { lat: 14.0583, lng: 108.2772, zoom: 6 }
    },
    YE: {
        name: { en: 'Yemen', ar: 'اليمن' },
        coordinates: { lat: 15.5527, lng: 48.5164, zoom: 6 }
    },
};

// Helper function to get sorted countries with priority first
export function getSortedCountries(language: 'en' | 'ar' = 'en'): Array<{ code: string; name: string; isPriority: boolean }> {
    const allCountries = Object.entries(COUNTRY_DATA).map(([code, data]) => ({
        code,
        name: data.name[language],
        isPriority: PRIORITY_COUNTRIES.includes(code)
    }));

    // Separate priority and other countries
    const priority = allCountries.filter(c => c.isPriority);
    const others = allCountries.filter(c => !c.isPriority);

    // Sort priority by PRIORITY_COUNTRIES order
    priority.sort((a, b) => PRIORITY_COUNTRIES.indexOf(a.code) - PRIORITY_COUNTRIES.indexOf(b.code));

    // Sort others alphabetically by name
    others.sort((a, b) => a.name.localeCompare(b.name, language));

    return [...priority, ...others];
}
