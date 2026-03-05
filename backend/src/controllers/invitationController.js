const supabase = require('../config/supabase');

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

// Obter convite público pelo slug (ex: site.com/convite/ana-e-joao -> api/invitations/public/ana-e-joao)
const getPublicInvitation = async (req, res) => {
    try {
        const { slug } = req.params;
        const { data, error } = await supabase
            .from('invitations')
            .select(`
                *,
                details:invitations_details(*),
                gifts:invitations_gifts(*)
            `)
            .eq('slug', slug)
            .eq('status', 'active')
            .single();

        if (error) throw error;
        if (!data) return res.status(404).json({ message: 'Convite não encontrado ou inativo.' });

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

        // Validar dados básicos
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

module.exports = {
    getPlans,
    getPublicInvitation,
    submitRsvp
};
