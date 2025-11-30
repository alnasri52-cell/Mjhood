const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const userId = 'c707a9c2-c983-4147-bc27-f3b7167666b3';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkRole() {
    console.log(`Checking role for user ${userId}...`);
    const { data, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', userId)
        .single();

    if (error) {
        console.error('Error fetching profile:', error.message);
    } else {
        console.log('Current Role:', data.role);
    }
}

checkRole();
