
import { createClient } from '@supabase/supabase-js';

// Credenciais fornecidas para o projeto de integração
const supabaseUrl = 'https://nxitvgykntdekhyfahzi.supabase.co';
const supabaseKey = 'sb_publishable_1Mr8bR7QdJDHPLKg5CusiA_PFuY49Hc';

// Inicializa o cliente real do Supabase
export const supabase = createClient(supabaseUrl, supabaseKey);
