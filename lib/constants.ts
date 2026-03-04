export const LOCAL_NEEDS_CATEGORIES = [
    "Mosque",
    "Cafe",
    "Restaurant",
    "Bakery",
    "Drive-Thru Kiosk",
    "Grocery Store",
    "Mall",
    "Pharmacy",
    "Medical Center",
    "Gym",
    "Salon",
    "Laundromat",
    "Auto Repair",
    "Car Wash",
    "Gas Station",
    "EV Charging",
    "Private School",
    "Co-working Space",
    "Sports Venue",
    "Park",
    "ATM / Bank Branch",
    "Public Restroom",
    "Other"
] as const;

export type LocalNeedCategory = typeof LOCAL_NEEDS_CATEGORIES[number];
