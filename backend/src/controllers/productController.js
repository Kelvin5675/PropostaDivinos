const supabase = require('../config/supabase');

const getAllProducts = async (req, res) => {
    try {
        const { featured, limit } = req.query;
        let query = supabase.from('products').select('*');

        if (featured === 'true') {
            query = query.eq('is_featured', true);
        }

        query = query.order('created_at', { ascending: false });

        if (limit) {
            query = query.limit(parseInt(limit, 10));
        }

        const { data, error } = await query;

        if (error) throw error;
        res.status(200).json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const getProductById = async (req, res) => {
    try {
        const { id } = req.params;
        const { data, error } = await supabase
            .from('products')
            .select('*')
            .eq('id', id)
            .single();

        if (error) throw error;
        if (!data) return res.status(404).json({ message: 'Produto não encontrado' });

        res.status(200).json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

module.exports = {
    getAllProducts,
    getProductById
};
