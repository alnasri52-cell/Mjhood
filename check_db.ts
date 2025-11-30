
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!; // Use service role to bypass RLS for checking

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkServices() {
    console.log('Checking services...');
    const { data, error } = await supabase
        .from('services')
        .select('id, title, user_id, deleted_at')
        .order('created_at', { ascending: false })
        .limit(5);

    if (error) {
        console.error('Error:', error);
        return;
    }

    console.table(data);
}

checkServices();
