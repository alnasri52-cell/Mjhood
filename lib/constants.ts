export const SERVICE_CATEGORIES = [
    "Home Improvement",
    "Cleaning Services",
    "Gardening & Landscaping",
    "Moving & Trucking",
    "Electrical Help",
    "Plumbing Help",
    "Painting & Decorating",
    "Carpentry & Woodworking",
    "General Handyman",
    "Tech Support & IT",
    "Coding & Development",
    "Graphic Design",
    "Writing & Translation",
    "Tutoring & Education",
    "Childcare & Babysitting",
    "Pet Care & Walking",
    "Cooking & Catering",
    "Health & Wellness",
    "Beauty & Personal Care",
    "Photography & Video",
    "Event Planning",
    "Automotive Help",
    "Legal & Admin",
    "Other"
] as const;

export type ServiceCategory = typeof SERVICE_CATEGORIES[number];

export const SECTORS = [
    "Home Services",
    "Professional Services",
    "Family & Care",
    "Events & Lifestyle",
    "Education",
    "Other"
] as const;

export type Sector = typeof SECTORS[number];

export const SECTOR_CATEGORIES: Record<Sector, ServiceCategory[]> = {
    "Home Services": [
        "Home Improvement",
        "Cleaning Services",
        "Gardening & Landscaping",
        "Moving & Trucking",
        "Electrical Help",
        "Plumbing Help",
        "Painting & Decorating",
        "Carpentry & Woodworking",
        "General Handyman"
    ],
    "Professional Services": [
        "Tech Support & IT",
        "Coding & Development",
        "Graphic Design",
        "Writing & Translation",
        "Legal & Admin"
    ],
    "Family & Care": [
        "Childcare & Babysitting",
        "Pet Care & Walking",
        "Health & Wellness",
        "Beauty & Personal Care"
    ],
    "Events & Lifestyle": [
        "Cooking & Catering",
        "Photography & Video",
        "Event Planning"
    ],
    "Education": [
        "Tutoring & Education"
    ],
    "Other": [
        "Automotive Help",
        "Other"
    ]
};

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
