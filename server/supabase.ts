import { createClient } from '@supabase/supabase-js';

// Verificar se as variáveis de ambiente do Supabase estão definidas
if (!process.env.SUPABASE_URL) {
  throw new Error('SUPABASE_URL não está definido no ambiente');
}

if (!process.env.SUPABASE_KEY) {
  throw new Error('SUPABASE_KEY não está definido no ambiente');
}

// Criar cliente Supabase
export const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);