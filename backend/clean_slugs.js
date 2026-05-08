
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = "https://eahrqlfdixqjwuygdkip.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVhaHJxbGZkaXhxand1eWdka2lwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk2Nzg5OTgsImV4cCI6MjA4NTI1NDk5OH0.6_J6lN2BGluF8tcSIxX-BwN8sv69gN6oNhVqzoIsYxU";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function cleanSlugs() {
    console.log('--- INICIANDO CORREÇÃO DE LINKS E PORTAS ---');
    
    const { data: invitations, error: fetchErr } = await supabase
        .from('invitations')
        .select('id, slug, guest_link, couple_link');
    
    if (fetchErr) {
        console.error('Erro ao buscar convites:', fetchErr);
        return;
    }

    for (const inv of invitations) {
        let newGuestLink = inv.guest_link || '';
        let newCoupleLink = inv.couple_link || '';

        // Corrigir porta e nome do arquivo
        newGuestLink = newGuestLink.replace(':3000', ':3001').replace('convite-publico.html', 'convite.html');
        newCoupleLink = newCoupleLink.replace(':3000', ':3001').replace('convite-publico.html', 'convite.html');

        if (newGuestLink !== inv.guest_link || newCoupleLink !== inv.couple_link) {
            console.log(`Corrigindo convite ${inv.id}:`);
            console.log(`  GUEST: ${inv.guest_link} -> ${newGuestLink}`);
            console.log(`  COUPLE: ${inv.couple_link} -> ${newCoupleLink}`);

            const { data, error: updErr } = await supabase
                .from('invitations')
                .update({ 
                    guest_link: newGuestLink,
                    couple_link: newCoupleLink
                })
                .eq('id', inv.id)
                .select();
            
            if (updErr) {
                console.error(`Erro ao atualizar convite ${inv.id}:`, updErr);
            } else {
                console.log(`Convite ${inv.id} atualizado. Novo dado no banco:`, data);
            }
        }
    }

    console.log('--- CORREÇÃO CONCLUÍDA ---');
}

cleanSlugs();
