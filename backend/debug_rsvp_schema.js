
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = "https://eahrqlfdixqjwuygdkip.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVhaHJxbGZkaXhxand1eWdka2lwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk2Nzg5OTgsImV4cCI6MjA4NTI1NDk5OH0.6_J6lN2BGluF8tcSIxX-BwN8sv69gN6oNhVqzoIsYxU";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function checkSchema() {
    console.log('--- VERIFICANDO ESTADO ATUAL RSVP ---');
    
    // Tenta inserir um teste completo para ver qual campo falha
    const testData = {
        invitation_id: 'a4d3211a-07d0-4636-a984-d8f16b61eab4',
        guest_name: 'Teste Final',
        status: 'confirmed',
        message: 'Teste de confirmação',
        guests_count: 1
    };

    console.log('Tentando inserir:', testData);
    const { data: res, error: err } = await supabase
        .from('invitations_rsvp')
        .insert(testData)
        .select();
    
    if (err) {
        console.log('ERRO NA INSERÇÃO:', err);
        // Se falhar, tenta campo por campo
        console.log('Testando campos individuais...');
        for (const key of Object.keys(testData)) {
            const partial = { invitation_id: testData.invitation_id, guest_name: 'Teste Parcial' };
            partial[key] = testData[key];
            const { error: pErr } = await supabase.from('invitations_rsvp').insert(partial);
            if (pErr) console.log(`Campo [${key}] falhou:`, pErr.message);
            else console.log(`Campo [${key}] OK`);
        }
    } else {
        console.log('INSERÇÃO OK! Colunas na tabela:', Object.keys(res[0]));
    }
}

checkSchema();
