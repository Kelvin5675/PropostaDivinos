
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = "https://eahrqlfdixqjwuygdkip.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVhaHJxbGZkaXhxand1eWdka2lwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk2Nzg5OTgsImV4cCI6MjA4NTI1NDk5OH0.6_J6lN2BGluF8tcSIxX-BwN8sv69gN6oNhVqzoIsYxU";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function checkSlugs() {
    console.log('--- VERIFICAÇÃO DE LINKS E SLUGS ---');
    const { data, error } = await supabase
        .from('invitations')
        .select('id, slug, guest_link, couple_link, customer_name')
        .order('created_at', { ascending: false });
    
    if (error) {
        console.error('Erro ao buscar convites:', error);
        return;
    }

    console.table(data);
}

checkSlugs();
