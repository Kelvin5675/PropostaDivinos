const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const app = express();

// Middlewares de Segurança
app.use(helmet());
app.use(cors({ origin: process.env.FRONTEND_URL || '*' }));
app.use(express.json());

// Limitar Requisições (Antispam)
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 100 // limita cada IP a 100 requisições por janela (windowMs)
});
app.use('/api/', limiter);

// Registo de Rotas Base API
app.get('/api/health', (req, res) => {
    res.status(200).json({ status: 'OK', message: 'API Divinos Graffic Operacional' });
});

// Outras rotas importadas
app.use('/api/v1/products', require('./src/routes/products'));
app.use('/api/v1/invitations', require('./src/routes/invitations'));

// Rota 404
app.use((req, res) => {
    res.status(404).json({ error: 'Endpoint não encontrado' });
});

module.exports = app;
