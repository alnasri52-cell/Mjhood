// Test RLS policies from client perspective
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function testClientQueries() {
    console.log('🔍 Testing queries as anonymous client (like browser)...\n');

    // Test exactly what NeedsMap does
    console.log('1️⃣ Testing NeedsMap query (with deleted_at):');
    const { data: needs1, error: needsError1 } = await supabase
        .from('local_needs')
        .select('*')
        .is('deleted_at', null)
        .order('created_at', { ascending: false });

    if (needsError1) {
        console.log('   ❌ Error:', needsError1.message);
        console.log('   Details:', needsError1);
    } else {
        console.log(`   ✓ Found ${needs1?.length || 0} needs`);
    }

    // Test fallback query
    console.log('\n2️⃣ Testing NeedsMap fallback query (no deleted_at):');
    const { data: needs2, error: needsError2 } = await supabase
        .from('local_needs')
        .select('*')
        .order('created_at', { ascending: false });

    if (needsError2) {
        console.log('   ❌ Error:', needsError2.message);
    } else {
        console.log(`   ✓ Found ${needs2?.length || 0} needs`);
    }

    // Test exactly what TalentMap does
    console.log('\n3️⃣ Testing TalentMap query (with deleted_at):');
    const { data: services1, error: servicesError1 } = await supabase
        .from('services')
        .select(`
      *,
      profiles:user_id (
        id,
        full_name,
        avatar_url,
        rating,
        gallery_urls,
        phone,
        social_links
      )
    `)
        .not('latitude', 'is', null)
        .not('longitude', 'is', null)
        .is('deleted_at', null);

    if (servicesError1) {
        console.log('   ❌ Error:', servicesError1.message);
        console.log('   Details:', servicesError1);
    } else {
        console.log(`   ✓ Found ${services1?.length || 0} services`);
    }

    // Test fallback query
    console.log('\n4️⃣ Testing TalentMap fallback query (no deleted_at):');
    const { data: services2, error: servicesError2 } = await supabase
        .from('services')
        .select(`
      *,
      profiles:user_id (
        id,
        full_name,
        avatar_url,
        rating,
        gallery_urls,
        phone,
        social_links
      )
    `)
        .not('latitude', 'is', null)
        .not('longitude', 'is', null);

    if (servicesError2) {
        console.log('   ❌ Error:', servicesError2.message);
    } else {
        console.log(`   ✓ Found ${services2?.length || 0} services`);
    }

    console.log('\n✅ Client test complete!');
}

testClientQueries().catch(console.error);
