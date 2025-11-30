const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function makeAdmin(fullName) {
    // Find user by full name (since we don't have email easily in profiles)
    const { data: profiles, error: findError } = await supabase
        .from('profiles')
        .select('id, full_name')
        .eq('full_name', fullName)
        .single();

    if (findError || !profiles) {
        console.error('User not found:', fullName);
        return;
    }

    const { error: updateError } = await supabase
        .from('profiles')
        .update({ role: 'admin' })
        .eq('id', profiles.id);

    if (updateError) {
        console.error('Error updating role:', updateError);
    } else {
        console.log(`Successfully upgraded ${fullName} to admin.`);
    }
}

// Upgrade 'aa' to admin
makeAdmin('aa');
