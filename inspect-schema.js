
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function inspectSchema() {
    const { data, error } = await supabase
        .rpc('get_table_info', { table_name: 'profiles' });
    // RPC might not exist. Let's try direct query if RLS allows, or just select * limit 1 to see keys.

    const { data: rows, error: rowError } = await supabase
        .from('profiles')
        .select('*')
        .limit(1);

    if (rowError) {
        console.error('Error:', rowError);
    } else {
        console.log('Columns:', rows && rows.length > 0 ? Object.keys(rows[0]) : 'No rows found to infer columns');
    }
}

inspectSchema();
