const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkTable() {
    console.log('Checking reports table...');

    // Try SELECT
    const { error: selectError } = await supabase
        .from('reports')
        .select('count', { count: 'exact', head: true });

    if (selectError) {
        console.error('SELECT Error:', selectError.message);
    } else {
        console.log('SELECT successful.');
    }

    // Try INSERT
    console.log('Attempting INSERT...');
    const { data, error: insertError } = await supabase
        .from('reports')
        .insert({
            target_id: '00000000-0000-0000-0000-000000000000', // Dummy UUID
            target_type: 'service',
            reason: 'Test report from script',
            status: 'pending'
        })
        .select();

    if (insertError) {
        console.error('INSERT Error:', insertError.message);
        console.error('Full Error:', JSON.stringify(insertError, null, 2));
    } else {
        console.log('INSERT successful:', data);

        // Clean up
        if (data && data[0]) {
            await supabase.from('reports').delete().eq('id', data[0].id);
            console.log('Cleaned up test record.');
        }
    }
}

checkTable();
