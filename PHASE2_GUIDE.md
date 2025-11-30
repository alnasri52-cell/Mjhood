# Phase 2 Implementation Guide

## Summary
Phase 1 (database) is complete. Phase 2 requires updating frontend components to use the new `service_categories` table and apply coordinate masking.

---

## What's Been Done ✅

1. **Database Migrations** - All deployed successfully
   - `service_categories` table
   - `location_reports` table
   - Location integrity fields in profiles

2. **API Routes** - Ready to use
   - `/api/services/categories` - CRUD for service categories
   - `/api/reports/location` - Location reporting

3. **Utilities**
   - `lib/utils/coordinateMasking.ts` - Privacy protection

4. **Components**
   - `ServiceCategorySelector.tsx` - Multi-service management UI

---

## What Needs to Be Done 🔄

### Priority 1: Update TalentMap (High Impact)

**File**: `components/map/TalentMap.tsx`

**Changes Needed**:

1. **Update Service Interface** (lines 20-44):
```typescript
interface ServiceWithCategories {
    user_id: string;
    latitude: number;  // Will be masked
    longitude: number; // Will be masked
    categories: Array<{
        id: string;
        category: string;
        title: string;
        description: string;
        price_type?: string;
        price_min?: number;
        price_max?: number;
    }>;
    profile: {
        id: string;
        full_name: string;
        avatar_url: string;
        rating: number;
        // ... other fields
    };
}
```

2. **Update fetchServices function** (around line 160):
```typescript
const fetchServices = async () => {
    // Fetch profiles with their service categories
    const { data, error } = await supabase
        .from('profiles')
        .select(`
            id,
            latitude,
            longitude,
            full_name,
            avatar_url,
            rating,
            gallery_urls,
            phone,
            social_links,
            service_categories!inner (
                id,
                category,
                title,
                description,
                price_type,
                price_min,
                price_max
            )
        `)
        .not('latitude', 'is', null)
        .not('longitude', 'is', null);
    
    // Group by user, apply coordinate masking
    const servicesWithMasking = data?.map(profile => ({
        ...profile,
        // Coordinates are already public (jittered) in DB
        // Or apply masking here if needed
    }));
    
    setServices(servicesWithMasking);
};
```

3. **Update Marker Popup** (around line 400):
- Show all service categories for a user
- Display as badges or list
- Keep existing profile info

### Priority 2: Update Profile Edit Page

**File**: `app/(main)/profile/edit/page.tsx`

**Changes**:
1. Remove `serviceTitle` and `serviceDescription` state (old single-service model)
2. Add `serviceCategories` state
3. Use `ServiceCategorySelector` component
4. Update save logic to save categories via API

**Key Code**:
```typescript
const [serviceCategories, setServiceCategories] = useState<ServiceCategory[]>([]);

// In handleSave:
for (const category of serviceCategories) {
    await fetch('/api/services/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(category)
    });
}
```

### Priority 3: Update My Services Page

**File**: `app/(main)/my-services/page.tsx`

**Changes**:
1. Fetch from `service_categories` instead of `services`
2. Remove location picker per service (use profile location)
3. Use `ServiceCategorySelector` for management

### Priority 4: Apply Coordinate Masking

**Where**: TalentMap, NeedsMap, any map display

**How**:
```typescript
import { maskCoordinates, canViewExactCoordinates } from '@/lib/utils/coordinateMasking';

// When displaying on map:
const displayCoords = userRole === 'admin' 
    ? { lat: profile.location_exact_lat, lng: profile.location_exact_lng }
    : { lat: profile.latitude, lng: profile.longitude }; // Already masked in DB

// Or apply masking in real-time:
const masked = maskCoordinates(
    { lat: profile.location_exact_lat, lng: profile.location_exact_lng },
    profile.id
);
```

---

## Testing Checklist

After making changes:

- [ ] User can add multiple service categories
- [ ] All categories show at same location on map
- [ ] Coordinates are masked (not exact home location)
- [ ] Admin can see exact coordinates
- [ ] Map performance is good
- [ ] No console errors

---

## Migration Strategy

**Current State**: You likely have data in the old `services` table

**Options**:

1. **Gradual Migration** (Recommended):
   - Keep both systems running
   - New services go to `service_categories`
   - Migrate old data in background

2. **Full Migration**:
   - Run migration script to move all services
   - Update all code at once
   - More risky but cleaner

**Migration Script** (if needed):
```sql
-- Copy services to service_categories
INSERT INTO service_categories (user_id, category, title, description, price_type, price_min, price_max)
SELECT 
    user_id,
    category,
    title,
    description,
    price_type,
    price_min,
    price_max
FROM services
WHERE deleted_at IS NULL;

-- Update profiles with service locations (keep most recent)
UPDATE profiles p
SET 
    latitude = s.latitude,
    longitude = s.longitude,
    location_exact_lat = s.latitude,
    location_exact_lng = s.longitude
FROM (
    SELECT DISTINCT ON (user_id) 
        user_id, latitude, longitude
    FROM services
    WHERE deleted_at IS NULL
    ORDER BY user_id, created_at DESC
) s
WHERE p.id = s.user_id;
```

---

## Quick Win: Start Small

**Easiest Path to See Results**:

1. Update `ServiceCategorySelector` usage in profile edit
2. Test adding multiple categories
3. Verify they save to database
4. Then update map to display them

This gives you immediate feedback without touching the complex map code.

---

## Need Help?

The main complexity is in TalentMap.tsx (600+ lines). Consider:
- Breaking it into smaller components
- Testing changes incrementally
- Using browser dev tools to debug

**Key Files**:
- `components/map/TalentMap.tsx` - Main map display
- `app/(main)/profile/edit/page.tsx` - Profile editing
- `app/(main)/my-services/page.tsx` - Service management
- `components/services/ServiceCategorySelector.tsx` - ✅ Already created
