import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Regular client for client-side use (subject to RLS)
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
