const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function testQuery() {
    console.log('Testing frontend query...');

    // This is the query from app/admin/trust/page.tsx
    const { data, error } = await supabase
        .from('reports')
        .select(`
        *,
        reporter:reporter_id (
            full_name
        )
    `)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Query Failed:', error.message);
        console.error('Code:', error.code);
        console.error('Hint:', error.hint);
    } else {
        console.log('Query Successful!');
        console.log('Data:', JSON.stringify(data, null, 2));
    }
}

testQuery();
