require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY; // Em prod, usar a SERVICE_ROLE_KEY se necessário

if (!supabaseUrl || !supabaseKey) {
    console.error("ERRO: Faltam variáveis de ambiente SUPABASE_URL ou SUPABASE_ANON_KEY");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

module.exports = supabase;
