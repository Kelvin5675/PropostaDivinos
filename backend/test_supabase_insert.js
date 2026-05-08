require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

async function testInsert() {
    console.log("Testing invitation insertion...");
    const invData = {
        customer_name: "Teste Direto",
        title: "Casamento Teste",
        slug: "casamento-teste-direto",
        plan_id: null,
        event_date: null,
        editor_type: "manual",
        custom_html: "",
        status: "pending_approval",
        is_public: true
    };

    const { data, error } = await supabase.from('invitations').insert([invData]);

    if (error) {
        console.error("ERRO COMPLETO DO SUPABASE:");
        console.error(JSON.stringify(error, null, 2));
    } else {
        console.log("Sucesso!", data);
    }
}

testInsert();
