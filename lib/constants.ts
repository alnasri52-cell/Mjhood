export const LOCAL_NEEDS_CATEGORIES = [
    "Grocery Store",
    "Pharmacy",
    "ATM / Bank",
    "Park / Green Space",
    "Public Restroom",
    "Mosque / Place of Worship",
    "School / Kindergarten",
    "Hospital / Clinic",
    "Gym / Fitness Center",
    "Cafe / Restaurant",
    "Public Transport Stop",
    "Post Office",
    "Library",
    "Community Center",
    "Other"
] as const;

export type LocalNeedCategory = typeof LOCAL_NEEDS_CATEGORIES[number];
