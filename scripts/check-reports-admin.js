const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
// Use SERVICE ROLE key to bypass RLS
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseKey) {
    console.error("Error: SUPABASE_SERVICE_ROLE_KEY is missing from .env.local");
    console.log("Please add it to run this check.");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkReports() {
    console.log('Checking reports table (Bypassing RLS)...');

    const { count, error } = await supabase
        .from('reports')
        .select('*', { count: 'exact', head: true });

    if (error) {
        console.error('Error:', error.message);
    } else {
        console.log(`Total reports in database: ${count}`);
    }
}

checkReports();
