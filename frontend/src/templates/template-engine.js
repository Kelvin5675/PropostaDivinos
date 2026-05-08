window.templatesCatalog = [
    {
        id: "minimalist-elegance",
        name: "Minimalist Elegance",
        thumbnail: "https://in.limintso.com/wp-content/uploads/2024/10/Black-and-White-Minimalist-Wedding-Monogram-Logo.png", // Imagem temporária baseada na referência
        description: "Um design sofisticado com temas escuros, animações suaves e player de música elegante.",
        path: "../templates/minimalist-elegance.html"
    }
];

/**
 * Motor para baixar e renderizar um template preenchendo as variáveis
 * @param {string} templateId - O ID do template (ex: 'minimalist-elegance')
 * @param {object} formData - Os dados do formulário preenchidos no admin
 * @returns {Promise<string>} O HTML final renderizado
 */
window.generateTemplateHtml = async function (templateId, formData) {
    const templateDef = window.templatesCatalog.find(t => t.id === templateId);
    if (!templateDef) throw new Error("Template não encontrado no catálogo.");

    // Baixa o HTML bruto do arquivo do template respectivo
    const response = await fetch(templateDef.path);
    if (!response.ok) throw new Error(`Falha ao carregar o template HTML de ${templateDef.path}`);
    let html = await response.text();

    // Mapeamento de Variáveis Essenciais
    const dateObj = formData.event_date ? new Date(formData.event_date) : new Date();
    const formattedDate = dateObj.toLocaleDateString('pt-BR', {
        day: '2-digit', month: 'long', year: 'numeric'
    });
    const formattedDayMonth = `${dateObj.getDate().toString().padStart(2, '0')} • ${(dateObj.getMonth() + 1).toString().padStart(2, '0')} • ${dateObj.getFullYear()}`;

    // Substituir as variáveis {{CHAVE}} dentro do HTML
    const replaceMap = {
        '{{BRIDE_NAME}}': formData.bride_name || 'Nome da Noiva',
        '{{GROOM_NAME}}': formData.groom_name || 'Nome do Noivo',
        '{{COUPLE_NAMES}}': `${formData.bride_name || 'Noiva'} & ${formData.groom_name || 'Noivo'}`,
        '{{EVENT_TITLE}}': formData.title || 'Nosso Casamento',
        '{{EVENT_DATE_EXTENDED}}': formattedDate.toUpperCase(),
        '{{EVENT_DATE_NUMBERS}}': formattedDayMonth,
        '{{EVENT_TIME}}': formData.event_time || '16H00',
        '{{LOCATION}}': formData.location || 'Local do Evento',
        '{{MUSIC_URL}}': formData.music_url || 'https://in.limintso.com/wp-content/uploads/2025/07/All-for-Love.Michael-Bolton.mp3'
    };

    // Replace All occurrences in the string
    for (const [key, val] of Object.entries(replaceMap)) {
        // Usa expressão regular global para substituir todas as ocorrências da variável
        const regex = new RegExp(key, 'g');
        html = html.replace(regex, val);
    }

    return html;
};
