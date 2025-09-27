import { createClient } from '@supabase/supabase-js';

// Use um valor padrão vazio se as variáveis de ambiente não estiverem definidas
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Adicionando logs para depuração
console.log('Supabase Client: Initializing...');
console.log('Supabase Client: VITE_SUPABASE_URL is', supabaseUrl ? 'present' : 'MISSING');
console.log('Supabase Client: VITE_SUPABASE_ANON_KEY is', supabaseAnonKey ? 'present' : 'MISSING');

// Verificação adicional para garantir que as chaves não estejam vazias
if (!supabaseUrl) {
  console.error('Supabase Client Error: VITE_SUPABASE_URL is missing or empty.');
}
if (!supabaseAnonKey) {
  console.error('Supabase Client Error: VITE_SUPABASE_ANON_KEY is missing or empty.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
console.log('Supabase Client: Client created.');