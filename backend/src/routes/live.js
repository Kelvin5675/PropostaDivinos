const express = require('express');
const router = express.Router();
const { AccessToken } = require('livekit-server-sdk');

router.post('/token', async (req, res) => {
    try {
        const { roomName, participantName, isPublisher } = req.body;

        if (!roomName || !participantName) {
            return res.status(400).json({ error: 'roomName e participantName são obrigatórios' });
        }

        // Caso as variáveis de ambiente não estejam configuradas, devolvemos erro limpo
        if (!process.env.LIVEKIT_API_KEY || !process.env.LIVEKIT_API_SECRET) {
            return res.status(500).json({ 
                error: 'Configuração do LiveKit em falta no servidor', 
                setupRequired: true 
            });
        }

        // Criar o token de acesso
        const at = new AccessToken(
            process.env.LIVEKIT_API_KEY,
            process.env.LIVEKIT_API_SECRET,
            {
                identity: participantName + '-' + Math.random().toString(36).substring(7),
                name: participantName,
            }
        );

        // Definir permissões de vídeo
        at.addGrant({
            roomJoin: true,
            room: roomName,
            canPublish: isPublisher === true,
            canSubscribe: true,
            canPublishData: true,
        });

        const token = await at.toJwt();

        res.status(200).json({ 
            token, 
            url: process.env.LIVEKIT_URL 
        });
    } catch (error) {
        console.error('Erro ao gerar token do LiveKit:', error);
        res.status(500).json({ error: 'Erro interno ao gerar token' });
    }
});

module.exports = router;
