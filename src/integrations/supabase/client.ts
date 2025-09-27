import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Adicionando logs para depuração
console.log('Supabase Client: Initializing...');
console.log('Supabase Client: VITE_SUPABASE_URL is', supabaseUrl ? 'present' : 'MISSING');
console.log('Supabase Client: VITE_SUPABASE_ANON_KEY is', supabaseAnonKey ? 'present' : 'MISSING');

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
console.log('Supabase Client: Client created.');