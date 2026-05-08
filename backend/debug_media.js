
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = "https://eahrqlfdixqjwuygdkip.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVhaHJxbGZkaXhxand1eWdka2lwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk2Nzg5OTgsImV4cCI6MjA4NTI1NDk5OH0.6_J6lN2BGluF8tcSIxX-BwN8sv69gN6oNhVqzoIsYxU";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function checkData() {
    const slug = 'fauzia-e-kelvin-mmrll4fr';
    console.log(`Verificando dados para o slug: ${slug}`);
    
    // 1. Verificar na tabela de convites
    const { data: inv, error: invErr } = await supabase
        .from('invitations')
        .select('id, slug, music_url, gallery_urls, cover_photo_url, order_id')
        .eq('slug', slug)
        .single();
    
    if (invErr) {
        console.error('Erro ao buscar convite:', invErr);
    } else {
        console.log('--- DADOS DO CONVITE ---');
        console.log('ID:', inv.id);
        console.log('Música:', inv.music_url || 'VAZIO');
        console.log('Capa:', inv.cover_photo_url || 'VAZIO');
        console.log('Galeria (tipo):', typeof inv.gallery_urls);
        console.log('Galeria (conteúdo):', JSON.stringify(inv.gallery_urls));
        
        if (inv.order_id) {
            // 2. Verificar na tabela de pedidos
            const { data: order, error: orderErr } = await supabase
                .from('invitation_orders')
                .select('id, music_url, gallery_urls, cover_photo_url')
                .eq('id', inv.order_id)
                .single();
            
            if (orderErr) {
                console.error('Erro ao buscar pedido:', orderErr);
            } else {
                console.log('--- DADOS DO PEDIDO ORIGINAL ---');
                console.log('Música:', order.music_url || 'VAZIO');
                console.log('Capa:', order.cover_photo_url || 'VAZIO');
                console.log('Galeria:', JSON.stringify(order.gallery_urls));
            }
        }
    }
}

checkData();
