const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkTables() {
    const { data, error } = await supabase
        .from('reviews')
        .select('id')
        .limit(1);

    if (error) {
        console.log('Reviews table check error:', error.message);
    } else {
        console.log('Reviews table exists.');
    }
}

checkTables();
