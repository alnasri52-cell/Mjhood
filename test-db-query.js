// Quick test script to check database connectivity and data
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing environment variables!');
    console.log('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✓' : '✗');
    console.log('NEXT_PUBLIC_SUPABASE_ANON_KEY:', supabaseKey ? '✓' : '✗');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testQueries() {
    console.log('🔍 Testing database queries...\n');

    // Test 1: Check local_needs without deleted_at filter
    console.log('1️⃣ Testing local_needs (no filter):');
    const { data: needs1, error: needsError1 } = await supabase
        .from('local_needs')
        .select('*')
        .limit(5);

    if (needsError1) {
        console.log('   ❌ Error:', needsError1.message);
    } else {
        console.log(`   ✓ Found ${needs1?.length || 0} needs`);
        if (needs1 && needs1.length > 0) {
            console.log('   Sample:', needs1[0].title);
        }
    }

    // Test 2: Check local_needs with deleted_at filter
    console.log('\n2️⃣ Testing local_needs (with deleted_at filter):');
    const { data: needs2, error: needsError2 } = await supabase
        .from('local_needs')
        .select('*')
        .is('deleted_at', null)
        .limit(5);

    if (needsError2) {
        console.log('   ❌ Error:', needsError2.message);
    } else {
        console.log(`   ✓ Found ${needs2?.length || 0} needs`);
    }

    // Test 3: Check services without deleted_at filter
    console.log('\n3️⃣ Testing services (no filter):');
    const { data: services1, error: servicesError1 } = await supabase
        .from('services')
        .select('*')
        .limit(5);

    if (servicesError1) {
        console.log('   ❌ Error:', servicesError1.message);
    } else {
        console.log(`   ✓ Found ${services1?.length || 0} services`);
        if (services1 && services1.length > 0) {
            console.log('   Sample:', services1[0].title);
        }
    }

    // Test 4: Check services with deleted_at filter
    console.log('\n4️⃣ Testing services (with deleted_at filter):');
    const { data: services2, error: servicesError2 } = await supabase
        .from('services')
        .select('*')
        .is('deleted_at', null)
        .limit(5);

    if (servicesError2) {
        console.log('   ❌ Error:', servicesError2.message);
    } else {
        console.log(`   ✓ Found ${services2?.length || 0} services`);
    }

    // Test 5: Check services with profile join
    console.log('\n5️⃣ Testing services with profile join:');
    const { data: services3, error: servicesError3 } = await supabase
        .from('services')
        .select(`
      *,
      profiles:user_id (
        id,
        full_name,
        avatar_url
      )
    `)
        .not('latitude', 'is', null)
        .not('longitude', 'is', null)
        .limit(5);

    if (servicesError3) {
        console.log('   ❌ Error:', servicesError3.message);
    } else {
        console.log(`   ✓ Found ${services3?.length || 0} services with profiles`);
        if (services3 && services3.length > 0) {
            console.log('   Sample:', services3[0].title, '- Profile:', services3[0].profiles?.full_name || 'N/A');
        }
    }

    console.log('\n✅ Test complete!');
}

testQueries().catch(console.error);
