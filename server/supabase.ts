import { createClient } from '@supabase/supabase-js';

// Verificar se as variáveis de ambiente do Supabase estão definidas
const supabaseUrl = process.env.SUPABASE_URL || 'https://example.supabase.co';
const supabaseKey = process.env.SUPABASE_KEY || 'dummy-key';

if (!process.env.SUPABASE_URL || !process.env.SUPABASE_KEY) {
  console.warn('AVISO: SUPABASE_URL ou SUPABASE_KEY não estão definidos no ambiente. O aplicativo usará versões simuladas temporárias.');
}

// Criar cliente Supabase
export const supabase = createClient(supabaseUrl, supabaseKey);

// Função auxiliar para verificar se o Supabase está disponível
export async function isSupabaseConnected(): Promise<boolean> {
  try {
    const { data, error } = await supabase.from('categories').select('count');
    return !error;
  } catch (err) {
    console.error('Erro ao verificar conexão com Supabase:', err);
    return false;
  }
}