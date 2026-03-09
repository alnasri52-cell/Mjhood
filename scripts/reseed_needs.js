/**
 * Reseed script: Delete all old test pins + users, create fresh ones.
 * - 10 test users with profile pictures (across 10 cities)
 * - 100 needs with correct categories, some with images
 * - Realistic Arabic titles, varied vote counts
 * 
 * Usage: node scripts/reseed_needs.js
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { autoRefreshToken: false, persistSession: false } }
);

// ============ CONFIG ============

const CATEGORIES = [
    "Mosque", "Cafe", "Restaurant", "Bakery", "Drive-Thru Kiosk",
    "Grocery Store", "Mall", "Pharmacy", "Medical Center", "Gym",
    "Salon", "Laundromat", "Auto Repair", "Car Wash", "Gas Station",
    "EV Charging", "Private School", "Co-working Space", "Sports Venue",
    "Park", "ATM / Bank Branch", "Public Restroom", "Other"
];

const CITIES = [
    { name: 'Riyadh', lat: 24.7136, lng: 46.6753, nameAr: 'الرياض' },
    { name: 'Jeddah', lat: 21.5433, lng: 39.1728, nameAr: 'جدة' },
    { name: 'Makkah', lat: 21.4225, lng: 39.8262, nameAr: 'مكة' },
    { name: 'Madinah', lat: 24.4672, lng: 39.6112, nameAr: 'المدينة المنورة' },
    { name: 'Dammam', lat: 26.4207, lng: 50.0888, nameAr: 'الدمّام' },
    { name: 'Khobar', lat: 26.2795, lng: 50.2084, nameAr: 'الخبر' },
    { name: 'Tabuk', lat: 28.3838, lng: 36.5550, nameAr: 'تبوك' },
    { name: 'Abha', lat: 18.2164, lng: 42.5053, nameAr: 'أبها' },
    { name: 'Buraydah', lat: 26.3660, lng: 43.9750, nameAr: 'بريدة' },
    { name: 'Taif', lat: 21.2703, lng: 40.4158, nameAr: 'الطائف' },
];

// Realistic Arabic/English titles per category
const NEED_TEMPLATES = {
    "Mosque": [
        { title: "مسجد في هذا الحي", desc: "الحي يفتقر لمسجد قريب" },
        { title: "مصلى نساء", desc: "نحتاج مصلى مخصص للنساء" },
    ],
    "Cafe": [
        { title: "كوفي شوب قريب", desc: "لا يوجد مقهى في المنطقة" },
        { title: "مقهى يقدم قهوة مختصة", desc: "أقرب مقهى مختص بعيد جداً" },
    ],
    "Restaurant": [
        { title: "مطعم عائلي", desc: "نحتاج مطعم يناسب العائلات" },
        { title: "مطعم وجبات صحية", desc: "خيارات الأكل الصحي قليلة هنا" },
    ],
    "Bakery": [
        { title: "مخبز طازج", desc: "لا يوجد مخبز بالقرب من الحي" },
        { title: "مخبز يقدم خبز عربي", desc: "أقرب مخبز بعيد عن الحي" },
    ],
    "Drive-Thru Kiosk": [
        { title: "كشك سيارات (درايف ثرو)", desc: "مطلوب كشك طلبات سريعة للسيارات" },
    ],
    "Grocery Store": [
        { title: "بقالة قريبة من الحي", desc: "أقرب بقالة بعيدة جداً" },
        { title: "سوبرماركت في المنطقة", desc: "نحتاج متجر بقالة كبير" },
    ],
    "Mall": [
        { title: "مركز تسوق", desc: "لا يوجد مول قريب" },
    ],
    "Pharmacy": [
        { title: "صيدلية ٢٤ ساعة", desc: "نحتاج صيدلية تعمل طوال اليوم" },
        { title: "صيدلية في الحي", desc: "أقرب صيدلية بعيدة" },
    ],
    "Medical Center": [
        { title: "عيادة طبية قريبة", desc: "لا يوجد مركز صحي في المنطقة" },
        { title: "مركز طوارئ", desc: "أقرب مستشفى بعيد جداً" },
    ],
    "Gym": [
        { title: "نادي رياضي", desc: "نحتاج صالة رياضية في الحي" },
        { title: "نادي رياضي نسائي", desc: "لا يوجد نادي نسائي قريب" },
    ],
    "Salon": [
        { title: "صالون حلاقة", desc: "يحتاج الحي لصالون حلاقة" },
        { title: "صالون تجميل نسائي", desc: "أقرب صالون نسائي بعيد" },
    ],
    "Laundromat": [
        { title: "مغسلة ملابس", desc: "مطلوب مغسلة ملابس في المنطقة" },
    ],
    "Auto Repair": [
        { title: "ورشة صيانة سيارات", desc: "لا يوجد ورشة سيارات قريبة" },
    ],
    "Car Wash": [
        { title: "مغسلة سيارات", desc: "نحتاج مغسلة سيارات في الحي" },
    ],
    "Gas Station": [
        { title: "محطة وقود", desc: "أقرب محطة بنزين بعيدة" },
    ],
    "EV Charging": [
        { title: "محطة شحن سيارات كهربائية", desc: "لا يوجد شاحن سيارات كهربائية هنا" },
    ],
    "Private School": [
        { title: "مدرسة أهلية", desc: "الحي يحتاج مدرسة أهلية" },
        { title: "روضة أطفال", desc: "لا يوجد حضانة أطفال قريبة" },
    ],
    "Co-working Space": [
        { title: "مساحة عمل مشتركة", desc: "مطلوب مكان للعمل عن بُعد" },
    ],
    "Sports Venue": [
        { title: "ملعب كرة قدم", desc: "الحي يحتاج ملعب رياضي" },
        { title: "ملعب بادل", desc: "أقرب ملعب بادل بعيد" },
    ],
    "Park": [
        { title: "حديقة عامة", desc: "نحتاج حديقة في الحي" },
        { title: "ممشى ومنطقة مفتوحة", desc: "لا يوجد متنزه قريب" },
    ],
    "ATM / Bank Branch": [
        { title: "صراف آلي", desc: "أقرب صراف آلي بعيد جداً" },
        { title: "فرع بنك", desc: "نحتاج فرع بنك في المنطقة" },
    ],
    "Public Restroom": [
        { title: "دورات مياه عامة", desc: "المنطقة تفتقر لدورات مياه عامة" },
    ],
    "Other": [
        { title: "إنارة شوارع", desc: "الشوارع مظلمة ونحتاج إنارة" },
        { title: "صيانة أرصفة", desc: "الأرصفة بحاجة إلى تجديد" },
        { title: "حاويات نفايات", desc: "الحي يحتاج حاويات نفايات إضافية" },
    ],
};

// Unsplash images for need photos (category-relevant)
const NEED_IMAGES = {
    "Mosque": ["https://images.unsplash.com/photo-1545167496-5a782e4c68ef?w=600&h=400&fit=crop"],
    "Cafe": ["https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=600&h=400&fit=crop"],
    "Restaurant": ["https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=600&h=400&fit=crop"],
    "Bakery": ["https://images.unsplash.com/photo-1509440159596-0249088772ff?w=600&h=400&fit=crop"],
    "Grocery Store": ["https://images.unsplash.com/photo-1604719312566-8912e9227c6a?w=600&h=400&fit=crop"],
    "Pharmacy": ["https://images.unsplash.com/photo-1576602976047-174e57a47881?w=600&h=400&fit=crop"],
    "Gym": ["https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=600&h=400&fit=crop"],
    "Park": ["https://images.unsplash.com/photo-1588714477688-cf28a50e94f7?w=600&h=400&fit=crop"],
    "Medical Center": ["https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=600&h=400&fit=crop"],
};

// Test users (10 users, one per city)
const TEST_USERS = [
    { name: 'أحمد الرياض', gender: 'male', employment: 'employed', birth: 1990 },
    { name: 'سارة الجدة', gender: 'female', employment: 'employed', birth: 1995 },
    { name: 'محمد المكي', gender: 'male', employment: 'student', birth: 2000 },
    { name: 'نورة المدني', gender: 'female', employment: 'employed', birth: 1988 },
    { name: 'خالد الدمام', gender: 'male', employment: 'self_employed', birth: 1992 },
    { name: 'هدى الخبر', gender: 'female', employment: 'employed', birth: 1997 },
    { name: 'عبدالله التبوكي', gender: 'male', employment: 'employed', birth: 1985 },
    { name: 'ريم الأبهاوية', gender: 'female', employment: 'student', birth: 2001 },
    { name: 'فهد القصيم', gender: 'male', employment: 'self_employed', birth: 1993 },
    { name: 'لمى الطائف', gender: 'female', employment: 'employed', birth: 1996 },
];

// ============ HELPERS ============

function randomOffset(range = 0.04) {
    return (Math.random() * range * 2) - range;
}

function randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

// ============ MAIN ============

async function main() {
    console.log('🗑️  Step 1: Deleting old test data...');

    // Delete all needs (including votes, comments, fulfillments)
    const { error: delVotes } = await supabase.from('need_votes').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    if (delVotes) console.log('  Votes:', delVotes.message);
    else console.log('  ✅ Deleted all votes');

    const { error: delComments } = await supabase.from('need_comments').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    if (delComments) console.log('  Comments:', delComments.message);
    else console.log('  ✅ Deleted all comments');

    const { error: delFlagged } = await supabase.from('flagged_content').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    if (delFlagged) console.log('  Flagged:', delFlagged.message);
    else console.log('  ✅ Deleted all flagged content');

    const { error: delFulfill } = await supabase.from('fulfillment_submissions').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    if (delFulfill) console.log('  Fulfillments:', delFulfill.message);
    else console.log('  ✅ Deleted all fulfillment submissions');

    const { error: delNeeds } = await supabase.from('local_needs').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    if (delNeeds) console.log('  Needs:', delNeeds.message);
    else console.log('  ✅ Deleted all needs');

    console.log('\n👤 Step 2: Creating test user accounts...');

    // Get all existing users first
    const { data: { users: existingUsers } } = await supabase.auth.admin.listUsers({ perPage: 1000 });
    const existingByEmail = {};
    (existingUsers || []).forEach(u => { existingByEmail[u.email] = u.id; });

    const userIds = [];
    for (let i = 0; i < TEST_USERS.length; i++) {
        const user = TEST_USERS[i];
        const city = CITIES[i];
        const email = `testuser${i + 1}@mjhood.test`;
        const password = 'TestPass123!';

        let userId;

        if (existingByEmail[email]) {
            userId = existingByEmail[email];
            console.log(`  ℹ️  ${email} exists (${userId})`);
        } else {
            const { data: authData, error: authError } = await supabase.auth.admin.createUser({
                email,
                password,
                email_confirm: true,
            });

            if (authError) {
                console.log(`  ❌ ${email}: ${authError.message}`);
                continue;
            }
            userId = authData.user.id;
            console.log(`  ✅ Created ${email} (${userId})`);
        }

        userIds.push(userId);

        // Avatar URL using UI Avatars
        const avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=${user.gender === 'male' ? '0D8ABC' : 'C850C0'}&color=fff&size=128&bold=true&font-size=0.4`;

        // Update profile
        const { error: profileError } = await supabase
            .from('profiles')
            .upsert({
                id: userId,
                full_name: user.name,
                role: 'client',
                gender: user.gender,
                employment_status: user.employment,
                year_of_birth: user.birth,
                avatar_url: avatarUrl,
                country: 'SA',
                updated_at: new Date().toISOString(),
            });

        if (profileError) console.log(`  ❌ Profile: ${profileError.message}`);
    }

    if (userIds.length === 0) {
        console.log('❌ No users created, aborting.');
        return;
    }

    console.log(`\n📍 Step 3: Creating 100 needs across ${CITIES.length} cities...`);

    let needCount = 0;
    const needsToInsert = [];

    // 10 needs per city = 100 total
    for (let cityIdx = 0; cityIdx < CITIES.length; cityIdx++) {
        const city = CITIES[cityIdx];
        const userId = userIds[cityIdx % userIds.length];

        for (let j = 0; j < 10; j++) {
            const catIdx = (cityIdx * 10 + j) % CATEGORIES.length;
            const category = CATEGORIES[catIdx];
            const templates = NEED_TEMPLATES[category];
            const template = templates[j % templates.length];

            const lat = city.lat + randomOffset();
            const lng = city.lng + randomOffset();
            const upvotes = randomInt(1, 50);
            const downvotes = randomInt(0, 5);

            // ~30% of needs get images
            let imageUrls = null;
            if (Math.random() < 0.3 && NEED_IMAGES[category]) {
                imageUrls = NEED_IMAGES[category];
            }

            // Vary dates over last 30 days
            const daysAgo = randomInt(0, 30);
            const createdAt = new Date(Date.now() - daysAgo * 86400000).toISOString();

            needsToInsert.push({
                user_id: userId,
                title: template.title,
                description: template.desc,
                category,
                latitude: parseFloat(lat.toFixed(6)),
                longitude: parseFloat(lng.toFixed(6)),
                upvotes,
                downvotes,
                status: 'active',
                image_urls: imageUrls,
                city: city.name,
                neighborhood: null,
                created_at: createdAt,
            });

            needCount++;
        }
    }

    // Insert in batches of 25
    for (let i = 0; i < needsToInsert.length; i += 25) {
        const batch = needsToInsert.slice(i, i + 25);
        const { error } = await supabase.from('local_needs').insert(batch);
        if (error) {
            console.log(`  ❌ Batch ${Math.floor(i / 25) + 1}: ${error.message}`);
        } else {
            console.log(`  ✅ Batch ${Math.floor(i / 25) + 1}: ${batch.length} needs inserted`);
        }
    }

    console.log(`\n🌍 Step 4: Running geocoder for neighborhoods...`);

    // Fetch needs without neighborhood
    const { data: needsToGeo } = await supabase
        .from('local_needs')
        .select('id, latitude, longitude')
        .is('neighborhood', null)
        .is('deleted_at', null);

    let geoCount = 0;
    for (const need of (needsToGeo || [])) {
        try {
            const res = await fetch(
                `https://nominatim.openstreetmap.org/reverse?lat=${need.latitude}&lon=${need.longitude}&format=json&accept-language=en`,
                { headers: { 'User-Agent': 'Mjhood/1.0' } }
            );
            if (res.ok) {
                const data = await res.json();
                const addr = data.address || {};
                const city = addr.city || addr.town || addr.village || addr.county || null;
                const neighborhood = addr.suburb || addr.neighbourhood || addr.quarter || addr.district || null;
                if (city || neighborhood) {
                    await supabase.from('local_needs').update({ city, neighborhood }).eq('id', need.id);
                    geoCount++;
                }
            }
        } catch { }
        await sleep(1100); // Nominatim rate limit
    }

    console.log(`  ✅ Geocoded ${geoCount} needs`);

    console.log('\n🎉 Done! Summary:');
    console.log(`   - ${userIds.length} test users created`);
    console.log(`   - ${needCount} needs inserted across ${CITIES.length} cities`);
    console.log(`   - ${geoCount} needs geocoded with neighborhoods`);
}

main().catch(console.error);
