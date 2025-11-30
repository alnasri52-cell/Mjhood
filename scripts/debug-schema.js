const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function debugSchema() {
    console.log('--- Debugging Schema ---');

    // Test 1: Select from 'reports' (normal select, no head)
    console.log('\n1. Selecting from "reports"...');
    const { data: reportsData, error: reportsError } = await supabase
        .from('reports')
        .select('*')
        .limit(1);

    if (reportsError) {
        console.log('Error:', reportsError.message, 'Code:', reportsError.code);
    } else {
        console.log('Success. Data:', reportsData);
    }

    // Test 2: Select from 'non_existent_table_xyz'
    console.log('\n2. Selecting from "non_existent_table_xyz"...');
    const { data: fakeData, error: fakeError } = await supabase
        .from('non_existent_table_xyz')
        .select('*')
        .limit(1);

    if (fakeError) {
        console.log('Error:', fakeError.message, 'Code:', fakeError.code);
    } else {
        console.log('Success (Unexpected!). Data:', fakeData);
    }
}

debugSchema();
