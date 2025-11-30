const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function listUsers() {
    const { data: profiles, error } = await supabase
        .from('profiles')
        .select('id, full_name, role');

    if (error) {
        console.error('Error fetching profiles:', error);
        return;
    }

    console.log('Profiles:', profiles);
}

listUsers();
