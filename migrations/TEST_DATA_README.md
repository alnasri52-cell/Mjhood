# Test Data Migration - Saudi Cities

This directory contains SQL migrations to populate your Mjhood database with realistic test data across 11 major Saudi cities.

## What's Included

### 📊 Data Summary
- **100 User Profiles** with complete information
- **50+ Services** across all categories
- **50+ Community Needs** 
- **11 Cities Covered**: Riyadh, Jeddah, Mecca, Medina, Dammam, Khobar, Dhahran, Buraydah, Taif, Tabuk, Abha

### 👤 Profile Data Includes:
- Full Arabic and English names
- Professional titles and bios
- Profile pictures (via placeholder URLs)
- Social media handles (Instagram, Twitter, Website)
- Country set to Saudi Arabia (SA)

### 🔧 Service Data Includes:
- Realistic service titles and descriptions in Arabic
- All service categories (Home Improvement, Tech Support, Tutoring, etc.)
- Precise GPS coordinates for each city
- Pricing (fixed, range, or negotiable)
- Price ranges from 50 SAR to 500,000 SAR

### 🏘️ Needs Data Includes:
- Community infrastructure needs
- All need categories (Grocery Store, Park, Pharmacy, etc.)
- Vote counts (15-45 votes per need)
- Realistic descriptions in Arabic

### 🖼️ Photos:
- **Profile Pictures**: `https://i.pravatar.cc/300?img={1-70}`
- **Work Samples**: Can be added via `https://picsum.photos/800/600?random={id}`

## Migration Files

1. **seed_test_data_part1.sql** - First 50 user profiles
2. **seed_test_data_part2.sql** - Remaining 50 user profiles  
3. **seed_test_data_part3_services.sql** - 50+ service listings
4. **seed_test_data_part4_needs.sql** - 50+ community needs

## How to Run

### Option 1: Via Supabase Dashboard
1. Go to your Supabase project dashboard
2. Navigate to SQL Editor
3. Copy and paste each migration file in order (Part 1 → Part 4)
4. Run each query

### Option 2: Via Command Line (if you have direct DB access)
```bash
psql -h your-db-host -U your-username -d your-database -f migrations/seed_test_data_part1.sql
psql -h your-db-host -U your-username -d your-database -f migrations/seed_test_data_part2.sql
psql -h your-db-host -U your-username -d your-database -f migrations/seed_test_data_part3_services.sql
psql -h your-db-host -U your-username -d your-database -f migrations/seed_test_data_part4_needs.sql
```

### Option 3: Via Supabase CLI
```bash
supabase db push --file migrations/seed_test_data_part1.sql
supabase db push --file migrations/seed_test_data_part2.sql
supabase db push --file migrations/seed_test_data_part3_services.sql
supabase db push --file migrations/seed_test_data_part4_needs.sql
```

## City Coordinates

| City | Latitude | Longitude |
|------|----------|-----------|
| Riyadh | 24.7136 | 46.6753 |
| Jeddah | 21.5433 | 39.1728 |
| Mecca | 21.3891 | 39.8579 |
| Medina | 24.5247 | 39.5692 |
| Dammam | 26.4207 | 50.0888 |
| Khobar | 26.2172 | 50.1971 |
| Dhahran | 26.2672 | 50.1471 |
| Buraydah | 26.3660 | 43.9750 |
| Taif | 21.2703 | 40.4158 |
| Tabuk | 28.3838 | 36.5550 |
| Abha | 18.2164 | 42.5053 |

## Important Notes

⚠️ **Authentication**: These migrations create profiles with UUIDs, but they don't create actual auth users. You have two options:

1. **Link to existing test users**: If you have test auth users, update the `id` fields in the profiles to match your auth user IDs
2. **Create auth users separately**: Use Supabase Auth API or dashboard to create users, then link them to these profiles

⚠️ **Photos**: The placeholder image URLs will work immediately, but you can replace them with real images later.

⚠️ **Cleanup**: To remove all test data:
```sql
DELETE FROM services WHERE user_id LIKE '10000000-0000-0000-0000-%';
DELETE FROM local_needs WHERE user_id LIKE '10000000-0000-0000-0000-%';
DELETE FROM profiles WHERE id LIKE '10000000-0000-0000-0000-%';
```

## Extending the Data

To add more services or needs:
- Copy the INSERT statement format
- Use realistic coordinates within each city's bounds
- Increment the UUID (e.g., `10000000-0000-0000-0000-000000000101`)
- Keep pricing realistic for Saudi market

## Categories Available

### Services:
Home Improvement, Cleaning Services, Gardening & Landscaping, Moving & Trucking, Electrical Help, Plumbing Help, Painting & Decorating, Carpentry & Woodworking, General Handyman, Tech Support & IT, Coding & Development, Graphic Design, Writing & Translation, Tutoring & Education, Childcare & Babysitting, Pet Care & Walking, Cooking & Catering, Health & Wellness, Beauty & Personal Care, Photography & Video, Event Planning, Automotive Help, Legal & Admin, Other

### Needs:
Grocery Store, Pharmacy, ATM / Bank, Park / Green Space, Public Restroom, Mosque / Place of Worship, School / Kindergarten, Hospital / Clinic, Gym / Fitness Center, Cafe / Restaurant, Public Transport Stop, Post Office, Library, Community Center

---

**Created**: December 2024  
**For**: Mjhood Platform Testing
