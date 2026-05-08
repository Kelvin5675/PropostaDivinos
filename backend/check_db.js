const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = "https://eahrqlfdixqjwuygdkip.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVhaHJxbGZkaXhxand1eWdka2lwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk2Nzg5OTgsImV4cCI6MjA4NTI1NDk5OH0.6_J6lN2BGluF8tcSIxX-BwN8sv69gN6oNhVqzoIsYxU";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function checkEverything() {
    console.log('--- VERIFICANDO INVITATIONS ---');
    const { data: invs, error: invErr } = await supabase
        .from('invitations')
        .select('id, slug, status, is_public, customer_name');

    if (invErr) console.error('Erro invitations:', invErr);
    else console.table(invs);

    console.log('\n--- VERIFICANDO INVITATION_ORDERS ---');
    const { data: orders, error: orderErr } = await supabase
        .from('invitation_orders')
        .select('id, couple_names, status, invitation_id');

    if (orderErr) console.error('Erro orders:', orderErr);
    else console.table(orders);
}

checkEverything();
