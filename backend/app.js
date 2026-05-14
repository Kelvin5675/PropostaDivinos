const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const app = express();

// Configurar Helmet de forma mais flexível para permitir redirecionamentos e metatags
app.use(helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false
}));

app.use(cors({ origin: process.env.FRONTEND_URL || '*' }));
app.use(express.json());

// Log de Requisições para Debug
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
});

// Limitar Requisições (Antispam)
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 100 // limita cada IP a 100 requisições por janela (windowMs)
});
app.use('/api/', limiter);

// Rota raiz para monitoramento (UptimeRobot/Render)
app.get('/', (req, res) => {
    res.status(200).send('Divinos Graffic API is running.');
});

// Registo de Rotas Base API
app.get('/api/health', (req, res) => {
    res.status(200).json({ status: 'OK', message: 'API Divinos Graffic Operacional' });
});

// Outras rotas importadas
app.use('/api/v1/products', require('./src/routes/products'));
app.use('/api/v1/invitations', require('./src/routes/invitations'));
app.use('/api/v1/live', require('./src/routes/live'));

// Rota 404
app.use((req, res) => {
    res.status(404).json({ error: 'Endpoint não encontrado' });
});

module.exports = app;
