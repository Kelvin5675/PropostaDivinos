/**
 * Visual Editor for Digital Invitations (Mini Canva)
 * Handles drag & drop, component management and property editing.
 */

let currentEditorInvitation = null;
let selectedElement = null;

// Initialize Editor
function initEditor() {
    const dropzone = document.getElementById('canvas-dropzone');
    const components = document.querySelectorAll('.comp-item');

    // Drag & Drop Listeners
    components.forEach(comp => {
        comp.addEventListener('dragstart', (e) => {
            e.dataTransfer.setData('type', comp.dataset.type);
        });
    });

    dropzone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropzone.style.background = '#f8fafc';
    });

    dropzone.addEventListener('dragleave', () => {
        dropzone.style.background = 'transparent';
    });

    dropzone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropzone.style.background = 'transparent';
        const type = e.dataTransfer.getData('type');
        addComponentToCanvas(type);
    });
}

function addComponentToCanvas(type, data = null) {
    const dropzone = document.getElementById('canvas-dropzone');

    // Remove empty state if present
    if (dropzone.querySelector('p')) {
        dropzone.innerHTML = '';
    }

    const div = document.createElement('div');
    div.className = 'canvas-element';
    div.dataset.type = type;
    div.style = 'padding: 20px; position: relative; cursor: pointer; border: 2px solid transparent; transition: 0.2s;';

    // HTML based on type
    div.innerHTML = getComponentHTML(type, data);

    // Event Listeners for editing
    div.onclick = (e) => {
        e.stopPropagation();
        selectElement(div);
    };

    dropzone.appendChild(div);
    selectElement(div);
}

function getComponentHTML(type, data) {
    switch (type) {
        case 'hero':
            return `
                <div style="text-align: center;">
                    <h2 style="font-family: 'Poppins'; margin-bottom: 5px;">${data?.names || 'Maria & João'}</h2>
                    <p style="color: #666; font-size: 0.9rem;">${data?.date || '25.12.2025'}</p>
                    <div style="width: 100%; height: 200px; background: #eee; border-radius: 10px; margin-top: 15px; display: flex; align-items: center; justify-content: center;">
                        <i class="fas fa-image fa-2x" style="color: #ccc;"></i>
                    </div>
                </div>
            `;
        case 'text':
            return `<div style="text-align: center; color: #444;">${data?.content || 'Clique para editar este texto de boas-vindas.'}</div>`;
        case 'countdown':
            return `
                <div style="display: flex; justify-content: center; gap: 15px; margin-top: 10px;">
                    <div style="text-align: center;"><div style="font-size: 1.2rem; font-weight: bold;">00</div><div style="font-size: 0.7rem;">Dias</div></div>
                    <div style="text-align: center;"><div style="font-size: 1.2rem; font-weight: bold;">00</div><div style="font-size: 0.7rem;">Horas</div></div>
                    <div style="text-align: center;"><div style="font-size: 1.2rem; font-weight: bold;">00</div><div style="font-size: 0.7rem;">Min</div></div>
                </div>
            `;
        case 'gallery':
            return `
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-top: 10px;">
                    <div style="aspect-ratio: 1; background: #f1f5f9; border-radius: 8px;"></div>
                    <div style="aspect-ratio: 1; background: #f1f5f9; border-radius: 8px;"></div>
                </div>
            `;
        case 'rsvp':
            return `<button style="width: 100%; padding: 12px; background: #334155; color: white; border: none; border-radius: 50px; font-weight: 600; margin-top: 10px;">Confirmar Presença</button>`;
        default:
            return `<div>Componente: ${type}</div>`;
    }
}

function selectElement(el) {
    if (selectedElement) {
        selectedElement.style.borderColor = 'transparent';
        selectedElement.style.boxShadow = 'none';
    }

    selectedElement = el;
    selectedElement.style.borderColor = '#6366f1';
    selectedElement.style.boxShadow = '0 0 0 4px rgba(99, 102, 241, 0.1)';

    showProperties(el.dataset.type);
}

function showProperties(type) {
    const emptyState = document.getElementById('prop-empty-state');
    const controls = document.getElementById('prop-controls');

    emptyState.style.display = 'none';
    controls.style.display = 'block';

    controls.innerHTML = `
        <div style="margin-bottom: 15px;">
            <label style="display: block; font-size: 0.8rem; margin-bottom: 5px;">Ações</label>
            <button class="btn btn-danger btn-sm" onclick="removeSelectedElement()" style="width: 100%;"><i class="fas fa-trash"></i> Remover</button>
        </div>
        <hr style="border: 0; border-top: 1px solid #eee; margin: 15px 0;">
        <p style="font-size: 0.8rem; color: #666;">Propriedades específicas para <b>${type}</b> em breve.</p>
    `;
}

function removeSelectedElement() {
    if (selectedElement) {
        selectedElement.remove();
        selectedElement = null;
        document.getElementById('prop-empty-state').style.display = 'block';
        document.getElementById('prop-controls').style.display = 'none';
    }
}

// Global functions for Tab switching
function openVisualEditor(invitationId = null) {
    switchTab('invitation-editor');
    initEditor();

    if (invitationId) {
        loadInvitationToEditor(invitationId);
    } else {
        currentEditorInvitation = null;
        document.getElementById('canvas-dropzone').innerHTML = `
            <div style="text-align: center; color: #cbd5e1; padding-top: 200px; pointer-events: none;">
                <i class="fas fa-plus-circle fa-3x"></i>
                <p style="margin-top: 15px;">Arraste componentes para aqui</p>
            </div>
        `;
    }
}

async function loadInvitationToEditor(id) {
    try {
        const { data, error } = await supabaseClient
            .from('invitations')
            .select('*, sections:invitations_sections(*)')
            .eq('id', id)
            .single();

        if (error) throw error;

        currentEditorInvitation = data;
        const dropzone = document.getElementById('canvas-dropzone');
        dropzone.innerHTML = '';

        if (data.sections && data.sections.length > 0) {
            // Sort by sort_order
            data.sections.sort((a, b) => a.sort_order - b.sort_order);
            data.sections.forEach(sec => {
                addComponentToCanvas(sec.section_type, sec.content);
            });
        }

        showToast('Convite carregado no editor.');
    } catch (err) {
        console.error(err);
        showToast('Erro ao carregar convite: ' + err.message, 'error');
    }
}

async function saveEditorInvitation() {
    if (!currentEditorInvitation && !confirm('Deseja criar um novo convite com este design? (Você precisará preencher os dados básicos primeiro)')) {
        return;
    }

    const dropzone = document.getElementById('canvas-dropzone');
    const elements = dropzone.querySelectorAll('.canvas-element');
    const sections = Array.from(elements).map((el, index) => ({
        type: el.dataset.type,
        content: {}, // TODO: Extrair conteúdo real dos elementos
        sort_order: index
    }));

    if (!currentEditorInvitation) {
        // Fluxo para novo convite a partir do editor
        showAddInvitationModal();
        document.getElementById('inv-editor-type').value = 'manual';
        // TODO: Passar as seções para o salvamento final
        window.pendingEditorSections = sections;
        return;
    }

    // Salvar seções no backend
    try {
        showToast('Salvando alterações...', 'info');

        // 1. Limpar seções antigas (estratégia simples: delete & insert)
        await supabaseClient.from('invitations_sections').delete().eq('invitation_id', currentEditorInvitation.id);

        // 2. Inserir novas
        const { error } = await supabaseClient.from('invitations_sections').insert(
            sections.map(s => ({
                invitation_id: currentEditorInvitation.id,
                section_type: s.type,
                content: s.content,
                sort_order: s.sort_order
            }))
        );

        if (error) throw error;
        showToast('Design salvo com sucesso!');
    } catch (err) {
        console.error(err);
        showToast('Erro ao salvar design: ' + err.message, 'error');
    }
}

function showPreviewModal() {
    if (!currentEditorInvitation && !selectedElement) {
        showToast('Adicione algo ao convite para ver o preview.', 'info');
        return;
    }

    // Abrir a página pública em uma nova aba/popup simulando celular
    const slug = currentEditorInvitation?.slug || 'preview';
    const win = window.open(`/invitation/?slug=${slug}&preview=true`, '_blank', 'width=375,height=667');
}

window.openVisualEditor = openVisualEditor;
window.removeSelectedElement = removeSelectedElement;
window.saveEditorInvitation = saveEditorInvitation;
window.showPreviewModal = showPreviewModal;
