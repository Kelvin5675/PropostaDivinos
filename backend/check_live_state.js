const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

async function check() {
    const { data, error } = await supabase
        .from('invitations')
        .select('id, slug, is_live, live_url')
        .eq('is_live', true);

    if (error) {
        console.error('Erro:', error);
        return;
    }

    console.log('--- Convites em Live agora ---');
    console.log(data);
    
    const targetId = '739a1219-aa0b-4fbf-848c-d5b5ca4c6f2d';
    const { data: dTarget } = await supabase
        .from('invitations')
        .select('id, slug, is_live, live_url')
        .eq('id', targetId)
        .single();
    
    console.log('--- Estado do Convite Alvo (Kelly & Eddy) ---');
    console.log(dTarget);
}

check();
