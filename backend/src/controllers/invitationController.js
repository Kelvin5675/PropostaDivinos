const supabase = require('../config/supabase');
const { GoogleGenerativeAI } = require("@google/generative-ai");

// Obter os planos disponíveis para convites digitais
const getPlans = async (req, res) => {
    try {
        const { data, error } = await supabase.from('invitation_plans').select('*').order('price', { ascending: true });
        if (error) throw error;
        res.status(200).json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Obter convite público pelo slug
const getPublicInvitation = async (req, res) => {
    try {
        const { slug } = req.params;
        const { data, error } = await supabase
            .from('invitations')
            .select(`
                *,
                plan:invitation_plans(*),
                details:invitations_details(*),
                sections:invitations_sections(*),
                messages:invitations_messages(*)
            `)
            .eq('slug', slug)
            .eq('status', 'active')
            .single();

        if (error) throw error;
        if (!data) return res.status(404).json({ message: 'Convite não encontrado ou inativo.' });

        // Ordenar seções se existirem
        if (data.sections) {
            data.sections.sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
        }

        res.status(200).json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Confirmar presença (RSVP)
const submitRsvp = async (req, res) => {
    try {
        const { invitation_id } = req.params;
        const { guest_name, email, phone, is_attending, adult_count, child_count, message } = req.body;

        if (!guest_name || is_attending === undefined) {
            return res.status(400).json({ error: 'Nome do convidado e status de presença são obrigatórios.' });
        }

        const { data, error } = await supabase
            .from('invitations_rsvp')
            .insert([{
                invitation_id,
                guest_name,
                email,
                phone,
                is_attending,
                adult_count: adult_count || (is_attending ? 1 : 0),
                child_count: child_count || 0,
                message
            }]);

        if (error) throw error;
        res.status(201).json({ message: 'Presença confirmada com sucesso!' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// --- NOVAS FUNÇÕES DA PLATAFORMA PROFISSIONAL ---

// Criar Pedido de Convite (Checkout)
const createOrder = async (req, res) => {
    try {
        const { customer_name, customer_email, customer_phone, event_type, event_date, plan_id } = req.body;

        const order_code = 'INV' + Date.now().toString().slice(-6);

        const { data, error } = await supabase
            .from('invitations_orders')
            .insert([{
                order_code,
                customer_name,
                customer_email,
                customer_phone,
                event_type,
                event_date,
                plan_id,
                payment_status: 'pending',
                order_status: 'new'
            }])
            .select();

        if (error) throw error;
        res.status(201).json(data[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Listar Pedidos (Admin)
const getOrders = async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('invitations_orders')
            .select('*, plan:invitation_plans(*)')
            .order('created_at', { ascending: false });

        if (error) throw error;
        res.status(200).json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Gerar com IA (Gemini)
const generateWithIA = async (req, res) => {
    try {
        const { bride_name, groom_name, event_type, event_date, location, message, plan_name } = req.body;

        if (!process.env.GEMINI_API_KEY) {
            return res.status(500).json({ error: 'GEMINI_API_KEY não configurada no servidor.' });
        }

        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });

        const prompt = `Gere uma estrutura de convite digital para um ${event_type} de ${bride_name} e ${groom_name}.
        Data: ${event_date}. Local: ${location}. Mensagem base: ${message}. Plano: ${plan_name}.
        Retorne APENAS um JSON com os campos: title, summary_text, color_palette (array de hex), suggested_sections (array de objetos {type, title, default_content}).
        O tom deve ser elegante e condizente com o plano ${plan_name}.`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        // Limpar possíveis markdown do Gemini
        const jsonStr = text.replace(/```json|```/g, '').trim();
        res.status(200).json(JSON.parse(jsonStr));
    } catch (error) {
        console.error('ERRO AO GERAR COM IA:', error);
        res.status(500).json({ error: error.message });
    }
};

// Salvar Convite Finalizado (Admin)
const createInvitation = async (req, res) => {
    try {
        const { slug, title, event_date, plan_id, editor_type, details, sections, custom_html } = req.body;

        // 1. Criar entrada na tabela invitations
        const { data: invData, error: invError } = await supabase
            .from('invitations')
            .insert([{
                slug,
                title,
                event_date,
                plan_id,
                editor_type,
                status: 'active',
                couple_token: Math.random().toString(36).substring(2, 10).toUpperCase(),
                custom_html: editor_type === 'code' ? custom_html : null
            }])
            .select();

        if (invError) throw invError;
        const invitationId = invData[0].id;

        // 2. Criar Detalhes
        if (details) {
            const { error: detError } = await supabase
                .from('invitations_details')
                .insert([{ invitation_id: invitationId, ...details }]);
            if (detError) throw detError;
        }

        // 3. Criar Seções (Se for Manual ou IA)
        if (sections && sections.length > 0) {
            const sectionsWithId = sections.map((s, i) => ({
                invitation_id: invitationId,
                section_type: s.type,
                content: s.content,
                sort_order: i
            }));
            const { error: secError } = await supabase
                .from('invitations_sections')
                .insert(sectionsWithId);
            if (secError) throw secError;
        }

        res.status(201).json(invData[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Obter Dados do Dashboard dos Noivos (via Token)
const getDashboardData = async (req, res) => {
    try {
        const { token } = req.params;

        // 1. Verificar Token e pegar ID do convite
        const { data: invData, error: invError } = await supabase
            .from('invitations')
            .select('id, slug, title, event_date, plan:invitation_plans(*)')
            .eq('couple_token', token)
            .single();

        if (invError || !invData) {
            return res.status(404).json({ error: 'Token inválido ou convite não encontrado.' });
        }

        // 2. Pegar RSVPs
        const { data: rsvpData, error: rsvpError } = await supabase
            .from('invitations_rsvp')
            .select('*')
            .eq('invitation_id', invData.id)
            .order('created_at', { ascending: false });

        // 3. Pegar Mensagens
        const { data: msgData, error: msgError } = await supabase
            .from('invitations_messages')
            .select('*')
            .eq('invitation_id', invData.id)
            .order('created_at', { ascending: false });

        res.status(200).json({
            invitation: invData,
            rsvps: rsvpError ? [] : rsvpData,
            messages: msgError ? [] : msgData
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

module.exports = {
    getPlans,
    getPublicInvitation,
    submitRsvp,
    createOrder,
    getOrders,
    generateWithIA,
    createInvitation,
    getDashboardData
};
