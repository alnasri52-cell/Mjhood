const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSchemas() {
    console.log('--- Checking Schemas ---');

    // Check profiles
    const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .limit(1);

    if (profileError) console.error('Profiles Error:', profileError.message);
    else console.log('Profile Keys:', Object.keys(profile[0] || {}));

    // Check services
    const { data: service, error: serviceError } = await supabase
        .from('services')
        .select('*')
        .limit(1);

    if (serviceError) console.error('Services Error:', serviceError.message);
    else console.log('Service Keys:', Object.keys(service[0] || {}));

    // Check local_needs
    const { data: need, error: needError } = await supabase
        .from('local_needs')
        .select('*')
        .limit(1);

    if (needError) console.error('Needs Error:', needError.message);
    else console.log('Need Keys:', Object.keys(need[0] || {}));
}

checkSchemas();
