
// ==========================================
// AUTHENTICATION CHECK
// ==========================================
async function checkAuth() {
    const { data: { session } } = await supabaseClient.auth.getSession();
    if (!session) {
        window.location.href = 'index.html';
    } else {
        // Load initial data
        loadDashboardData();
        setupAutoLogout(); // Start inactivity timer
    }
}
// Run check on load
document.addEventListener('DOMContentLoaded', () => {
    checkAuth();
    setupEventListeners();
});

async function logout() {
    await supabaseClient.auth.signOut();
    window.location.href = 'index.html';
}

// ==========================================
// NAVIGATION & UI
// ==========================================
function switchTab(tabId) {
    // Buttons
    document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
    document.getElementById(`nav-${tabId}`)?.classList.add('active');

    // Sections
    document.querySelectorAll('.section').forEach(el => el.classList.remove('active'));
    const targetSection = document.getElementById(tabId);
    if (targetSection) {
        targetSection.classList.add('active');
        // Reload data for specific tabs if needed
        if (tabId === 'products') loadProductsAdmin();
        if (tabId === 'categories') loadCategoriesAdmin();
        if (tabId === 'carousel-editor') loadCarouselAdmin();
        if (tabId === 'content-mgmt') {
            loadServicesAdmin();
            loadMomentosAdmin();
        }
        if (tabId.includes('editor') || tabId === 'settings' || tabId === 'marketing') loadSettingsToForms();
    }

    // Close sidebar on mobile after selecting
    if (window.innerWidth <= 768) {
        toggleSidebar(false);
    }
}

function toggleSidebar(force) {
    const sidebar = document.querySelector('.sidebar');
    const overlay = document.querySelector('.sidebar-overlay');

    if (force !== undefined) {
        if (force) {
            sidebar.classList.add('active');
            overlay.classList.add('active');
        } else {
            sidebar.classList.remove('active');
            overlay.classList.remove('active');
        }
        return;
    }

    sidebar.classList.toggle('active');
    overlay.classList.toggle('active');
}

function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    const msg = document.getElementById('toast-msg');

    msg.textContent = message;
    toast.className = `notification show ${type}`;

    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

// ==========================================
// DASHBOARD DATA (ANALYTICS)
// ==========================================
const supabaseClient = window.supabaseClient;

async function loadDashboardData() {
    if (!supabaseClient) return;

    // 1. Total Visits Count (Real)
    try {
        const { count, error } = await supabaseClient
            .from('page_visits')
            .select('*', { count: 'exact', head: true });

        if (!error) {
            document.getElementById('views-count').innerText = count;
        }
    } catch (e) {
        console.error("Error fetching views", e);
    }

    // 2. Count products
    try {
        const { count } = await supabaseClient.from('products').select('*', { count: 'exact', head: true });
        document.getElementById('products-count').innerText = count || 0;
    } catch (e) {
        console.error("Error fetching products", e);
    }

    // 3. Load Charts (Real Data - Last 7 Days)
    fetchChartData();

    // 4. Load Recent Visits Table
    fetchRecentVisits();
}

async function fetchRecentVisits() {
    const tableBody = document.getElementById('visits-table-body');
    if (!tableBody) return;

    try {
        const { data, error } = await supabaseClient
            .from('page_visits')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(10);

        if (error) throw error;

        tableBody.innerHTML = '';
        if (data && data.length > 0) {
            data.forEach(visit => {
                const tr = document.createElement('tr');
                const date = new Date(visit.created_at).toLocaleString('pt-BR');
                tr.innerHTML = `
                    <td style="font-weight: 500;"><i class="fas fa-globe-africa" style="margin-right:8px; color:#457b9d;"></i>${visit.country || 'Local'}</td>
                    <td>${visit.region || visit.city || 'Desconhecido'}</td>
                    <td><i class="fas ${visit.device_type === 'Mobile' ? 'fa-mobile-alt' : 'fa-desktop'}" style="margin-right:8px;"></i>${visit.device_type || 'Desktop'}</td>
                    <td>${date}</td>
                `;
                tableBody.appendChild(tr);
            });
        } else {
            tableBody.innerHTML = '<tr><td colspan="4" style="text-align:center;">Nenhuma visita registrada ainda.</td></tr>';
        }
    } catch (e) {
        console.error("Error fetching recent visits:", e);
        tableBody.innerHTML = '<tr><td colspan="4" style="text-align:center; color:red;">Erro ao carregar visitas.</td></tr>';
    }
}

async function fetchChartData() {
    const today = new Date();
    const lastWeek = new Date(today);
    lastWeek.setDate(today.getDate() - 6); // 7 days inc today

    const { data, error } = await supabaseClient
        .from('page_visits')
        .select('created_at')
        .gte('created_at', lastWeek.toISOString());

    if (error) {
        console.error("Chart data error", error);
        // Fallback to empty chart
        renderVisitorsChart([], []);
        return;
    }

    // Process data: Group by Day
    const counts = {};
    const labels = [];

    // Initialize last 7 days with 0
    for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(today.getDate() - i);
        const dayStr = d.toLocaleDateString('pt-BR', { weekday: 'short' });
        const dateKey = d.toISOString().split('T')[0];

        counts[dateKey] = 0;
        labels.push(dayStr);
    }

    // Count actuals
    data.forEach(visit => {
        const dateKey = visit.created_at.split('T')[0];
        if (counts.hasOwnProperty(dateKey) || counts[dateKey] !== undefined) {
            counts[dateKey] = (counts[dateKey] || 0) + 1;
        } else {
            // Find closest key? Or specific logic. 
            // Simple approach: map keys to label index.
            // Re-loop to fill array
        }
    });

    // Convert object to array sorted by date
    const dataPoints = [];
    // We need to match the labels order (which is last 7 days)
    for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(today.getDate() - i);
        const dateKey = d.toISOString().split('T')[0];
        dataPoints.push(counts[dateKey] || 0);
    }

    renderVisitorsChart(labels, dataPoints);
}

let visitorsChartInstance = null;

function renderVisitorsChart(labels, dataPoints) {
    const ctx = document.getElementById('visitorsChart').getContext('2d');

    // Destroy previous instance if exists to prevent overlapping
    if (visitorsChartInstance) {
        visitorsChartInstance.destroy();
    }

    visitorsChartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Visitantes',
                data: dataPoints,
                borderColor: '#457b9d',
                backgroundColor: 'rgba(69, 123, 157, 0.1)',
                tension: 0.4,
                fill: true
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false }
            },
            scales: {
                y: { beginAtZero: true, grid: { borderDash: [5, 5] }, ticks: { precision: 0 } },
                x: { grid: { display: false } }
            }
        }
    });
}

// ==========================================
// CATEGORIES MANAGEMENT
// ==========================================
const categoriesTableBody = document.getElementById('categories-table-body');
const prodCategorySelect = document.getElementById('prod-category');

async function loadCategoriesAdmin() {
    if (!categoriesTableBody) return;
    categoriesTableBody.innerHTML = '<tr><td colspan="3" style="text-align:center;">Carregando...</td></tr>';

    const { data, error } = await supabaseClient
        .from('categories')
        .select('*')
        .order('name', { ascending: true });

    if (error) {
        console.error(error);
        categoriesTableBody.innerHTML = '<tr><td colspan="3" style="color:red">Erro ao carregar</td></tr>';
        return;
    }

    categoriesTableBody.innerHTML = '';
    data.forEach(cat => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td style="font-weight: 500;">${cat.name}</td>
            <td>${new Date(cat.created_at).toLocaleDateString()}</td>
            <td>
                <button class="btn btn-primary" onclick="editCategory(${cat.id}, '${cat.name}')" style="padding: 0.4rem 0.8rem; font-size: 0.85rem; margin-right: 5px;"><i class="fas fa-edit"></i></button>
                <button class="btn btn-danger" onclick="deleteCategory(${cat.id})" style="padding: 0.4rem 0.8rem; font-size: 0.85rem;"><i class="fas fa-trash"></i></button>
            </td>
        `;
        categoriesTableBody.appendChild(tr);
    });

    // Also update product form dropdown
    updateProductCategoryDropdown(data);
}

function updateProductCategoryDropdown(categories) {
    if (!prodCategorySelect) return;
    const currentVal = prodCategorySelect.value;
    prodCategorySelect.innerHTML = '<option value="">Selecione...</option>';
    categories.forEach(cat => {
        const opt = document.createElement('option');
        opt.value = cat.name;
        opt.textContent = cat.name;
        prodCategorySelect.appendChild(opt);
    });
    if (currentVal) prodCategorySelect.value = currentVal;
}

function showAddCategoryForm() {
    document.getElementById('category-form-container').style.display = 'block';
    document.getElementById('category-form').reset();
    document.getElementById('cat-id').value = '';
}

function hideCategoryForm() {
    document.getElementById('category-form-container').style.display = 'none';
}

window.editCategory = (id, name) => {
    showAddCategoryForm();
    document.getElementById('cat-id').value = id;
    document.getElementById('cat-name').value = name;
};

window.deleteCategory = async (id) => {
    if (confirm('Atenção: A exclusão de uma categoria não exclui os produtos, mas eles podem perder o vínculo. Deseja continuar?')) {
        const { error } = await supabaseClient.from('categories').delete().eq('id', id);
        if (error) showToast('Erro: ' + error.message, 'error');
        else {
            showToast('Categoria excluída!');
            loadCategoriesAdmin();
        }
    }
};

// Add category form listener in setup
function setupCategoryFormListener() {
    const categoryForm = document.getElementById('category-form');
    if (categoryForm) {
        categoryForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const id = document.getElementById('cat-id').value;
            const name = document.getElementById('cat-name').value;

            let error;
            if (id) {
                const { error: err } = await supabaseClient.from('categories').update({ name }).eq('id', id);
                error = err;
            } else {
                const { error: err } = await supabaseClient.from('categories').insert([{ name }]);
                error = err;
            }

            if (error) showToast('Erro ao salvar: ' + error.message, 'error');
            else {
                showToast('Categoria salva!');
                hideCategoryForm();
                loadCategoriesAdmin();
            }
        });
    }
}


// ==========================================
// PRODUCTS MANAGEMENT
// ==========================================
const productsTableBody = document.getElementById('products-table-body');

// Quill Editor Instances
let shortDescriptionQuill = null;
let longDescriptionQuill = null;

function initializeQuillEditors() {
    // Verificar se os elementos existem antes de inicializar
    const shortDescEl = document.getElementById('short-description-editor');
    const longDescEl = document.getElementById('long-description-editor');

    if (shortDescEl && !shortDescriptionQuill) {
        shortDescriptionQuill = new Quill('#short-description-editor', {
            theme: 'snow',
            placeholder: 'Breve descrição do produto...',
            modules: {
                toolbar: [
                    ['bold', 'italic', 'underline'],
                    [{ 'list': 'ordered' }, { 'list': 'bullet' }],
                    ['link'],
                    ['clean']
                ]
            }
        });
    }

    if (longDescEl && !longDescriptionQuill) {
        longDescriptionQuill = new Quill('#long-description-editor', {
            theme: 'snow',
            placeholder: 'Descrição detalhada com todas as características...',
            modules: {
                toolbar: [
                    [{ 'header': [1, 2, 3, false] }],
                    ['bold', 'italic', 'underline', 'strike'],
                    [{ 'list': 'ordered' }, { 'list': 'bullet' }],
                    [{ 'color': [] }, { 'background': [] }],
                    ['link', 'image'],
                    ['clean']
                ]
            }
        });
    }
}

async function loadProductsAdmin() {
    await loadCategoriesAdmin(); // Refresh categories dropdown before showing products
    if (!productsTableBody) return;
    productsTableBody.innerHTML = '<tr><td colspan="5" style="text-align:center;">Carregando...</td></tr>';

    const { data, error } = await supabaseClient
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) {
        console.error(error);
        productsTableBody.innerHTML = '<tr><td colspan="6" style="color:red">Erro ao carregar</td></tr>';
        return;
    }

    productsTableBody.innerHTML = '';
    if (data.length === 0) {
        productsTableBody.innerHTML = '<tr><td colspan="6" style="text-align:center;">Nenhum produto encontrado.</td></tr>';
        return;
    }

    data.forEach(prod => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>
                <img src="${prod.image_url || '../images/placeholder.jpg'}" 
                     style="width: 50px; height: 50px; object-fit: cover; border-radius: 6px;">
            </td>
            <td style="font-weight: 500;">${prod.title}</td>
            <td><span style="background:#eef2f7; padding: 4px 8px; border-radius: 4px; font-size: 0.85rem;">${prod.category || '-'}</span></td>
            <td>${prod.price || '-'}</td>
            <td style="text-align: center;">
                ${prod.is_featured ? '<i class="fas fa-star" style="color: #f1c40f;" title="Em Destaque"></i>' : '<i class="far fa-star" style="color: #ccc;"></i>'}
            </td>
            <td>
                <button class="btn btn-primary" onclick="editProduct(${prod.id})" style="padding: 0.4rem 0.8rem; font-size: 0.85rem; margin-right: 5px;"><i class="fas fa-edit"></i></button>
                <button class="btn btn-danger" onclick="deleteProduct(${prod.id})" style="padding: 0.4rem 0.8rem; font-size: 0.85rem;"><i class="fas fa-trash"></i></button>
            </td>
        `;
        productsTableBody.appendChild(tr);
    });
}

function showAddProductForm() {
    document.getElementById('product-form-container').style.display = 'block';
    document.getElementById('product-form').reset();
    document.getElementById('prod-id').value = '';
    document.getElementById('prod-gallery').value = '[]';
    document.getElementById('gallery-container').innerHTML = '';
    document.getElementById('prod-preview').src = '';
    document.getElementById('prod-preview').style.display = 'none';
    document.getElementById('prod-featured').checked = false;
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function hideProductForm() {
    document.getElementById('product-form-container').style.display = 'none';
}

window.editProduct = async (id) => {
    const { data, error } = await supabaseClient.from('products').select('*').eq('id', id).single();
    if (data) {
        showAddProductForm();

        // Campos básicos
        document.getElementById('prod-id').value = data.id;
        document.getElementById('prod-title').value = data.title;
        document.getElementById('prod-category').value = data.category || '';
        document.getElementById('prod-price').value = data.price;
        document.getElementById('prod-image').value = data.image_url;
        document.getElementById('prod-featured').checked = data.is_featured || false;

        // Novos campos
        document.getElementById('prod-sku').value = data.sku || '';
        document.getElementById('prod-discount').value = data.discount_percentage || 0;
        document.getElementById('prod-rating').value = data.rating || 0;
        document.getElementById('prod-reviews').value = data.review_count || 0;
        document.getElementById('prod-badge').value = data.badge || '';
        document.getElementById('prod-tags').value = (data.tags && Array.isArray(data.tags)) ? data.tags.join(', ') : '';
        document.getElementById('prod-sizes').value = (data.sizes && Array.isArray(data.sizes)) ? data.sizes.join(', ') : '';

        // Descrições com Quill
        if (shortDescriptionQuill) {
            shortDescriptionQuill.root.innerHTML = data.description || '';
        }
        if (longDescriptionQuill) {
            longDescriptionQuill.root.innerHTML = data.long_description || '';
        }

        // Gallery
        let galleryArray = [];
        try {
            galleryArray = typeof data.gallery === 'string' ? JSON.parse(data.gallery) : (data.gallery || []);
        } catch (e) { galleryArray = []; }

        document.getElementById('prod-gallery').value = JSON.stringify(galleryArray);
        renderGalleryUI();

        if (data.image_url) {
            document.getElementById('prod-preview').src = data.image_url;
            document.getElementById('prod-preview').style.display = 'block';
        }
    }
};

async function handleGalleryUpload(input) {
    const file = input.files[0];
    if (!file) return;

    // Show indicator
    showToast('Enviando para galeria...', 'info');

    try {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}_gal.${fileExt}`;

        const { data, error } = await supabaseClient.storage
            .from('products-images')
            .upload(fileName, file);

        if (error) throw error;

        const { data: { publicUrl } } = supabaseClient.storage.from('products-images').getPublicUrl(fileName);

        // Add to array
        let gallery = JSON.parse(document.getElementById('prod-gallery').value || '[]');
        gallery.push(publicUrl);
        document.getElementById('prod-gallery').value = JSON.stringify(gallery);

        renderGalleryUI();
        showToast('Foto adicionada à galeria!');
    } catch (err) {
        console.error(err);
        showToast('Erro no upload da galeria: ' + err.message, 'error');
    }
}

function renderGalleryUI() {
    const container = document.getElementById('gallery-container');
    const gallery = JSON.parse(document.getElementById('prod-gallery').value || '[]');
    container.innerHTML = '';

    gallery.forEach((url, index) => {
        const div = document.createElement('div');
        div.style = 'position: relative; width: 80px; height: 80px;';
        div.innerHTML = `
            <img src="${url}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 6px; border: 1px solid #ddd;">
            <button type="button" onclick="removeFromGallery(${index})" style="position: absolute; top: -5px; right: -5px; background: red; color: white; border: none; border-radius: 50%; width: 20px; height: 20px; cursor: pointer; display: flex; align-items: center; justify-content: center; font-size: 10px;">&times;</button>
        `;
        container.appendChild(div);
    });
}

function removeFromGallery(index) {
    let gallery = JSON.parse(document.getElementById('prod-gallery').value || '[]');
    gallery.splice(index, 1);
    document.getElementById('prod-gallery').value = JSON.stringify(gallery);
    renderGalleryUI();
}

// Globalize helper
window.handleGalleryUpload = handleGalleryUpload;
window.removeFromGallery = removeFromGallery;

window.deleteProduct = async (id) => {
    if (confirm('Tem certeza que deseja excluir este produto?')) {
        const { error } = await supabaseClient.from('products').delete().eq('id', id);
        if (error) showToast('Erro: ' + error.message, 'error');
        else {
            showToast('Produto excluído com sucesso!');
            loadProductsAdmin();
        }
    }
};

document.getElementById('product-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = document.getElementById('prod-id').value;

    // Processar tags e sizes (converter de string para array)
    const tagsInput = document.getElementById('prod-tags').value;
    const sizesInput = document.getElementById('prod-sizes').value;

    const tagsArray = tagsInput ? tagsInput.split(',').map(t => t.trim()).filter(t => t) : [];
    const sizesArray = sizesInput ? sizesInput.split(',').map(s => s.trim()).filter(s => s) : [];

    // Obter conteúdo dos editores Quill
    const shortDesc = shortDescriptionQuill ? shortDescriptionQuill.root.innerHTML : '';
    const longDesc = longDescriptionQuill ? longDescriptionQuill.root.innerHTML : '';

    // Auto-gerar SKU se vazio
    let sku = document.getElementById('prod-sku').value;
    if (!sku && !id) {
        sku = 'PRD' + Date.now().toString().slice(-8);
    }

    const productData = {
        title: document.getElementById('prod-title').value,
        category: document.getElementById('prod-category').value,
        price: document.getElementById('prod-price').value,
        image_url: document.getElementById('prod-image').value,
        description: shortDesc,
        long_description: longDesc,
        gallery: document.getElementById('prod-gallery').value, // JSON String
        is_featured: document.getElementById('prod-featured').checked,
        // Novos campos
        sku: sku,
        discount_percentage: parseInt(document.getElementById('prod-discount').value) || null,
        rating: parseFloat(document.getElementById('prod-rating').value) || null,
        review_count: parseInt(document.getElementById('prod-reviews').value) || 0,
        badge: document.getElementById('prod-badge').value || null,
        tags: tagsArray.length > 0 ? tagsArray : null,
        sizes: sizesArray.length > 0 ? sizesArray : null
    };

    let error;
    if (id) {
        const { error: err } = await supabaseClient.from('products').update(productData).eq('id', id);
        error = err;
    } else {
        const { error: err } = await supabaseClient.from('products').insert([productData]);
        error = err;
    }

    if (error) {
        showToast('Erro ao salvar: ' + error.message, 'error');
    } else {
        showToast('Produto salvo com sucesso!');
        hideProductForm();
        loadProductsAdmin();
    }
});

// ==========================================
// SETTINGS (GENERIC HANDLER)
// ==========================================
// Loads settings into any form input that has name="KEY_IN_DB"
async function loadSettingsToForms() {
    const { data, error } = await supabaseClient.from('site_settings').select('*');
    if (!data) return;

    data.forEach(setting => {
        // Find inputs with this name
        const inputs = document.querySelectorAll(`[name="${setting.key}"]`);
        inputs.forEach(input => {
            input.value = setting.value || '';
        });

        // SPECIAL: Update Header UI with current profile settings
        if (setting.key === 'admin_display_name') {
            document.getElementById('admin-display-name').innerText = setting.value || 'Admin';
        }
        if (setting.key === 'admin_profile_pic') {
            const img = document.getElementById('admin-profile-img');
            const icon = document.getElementById('admin-default-icon');
            if (setting.value) {
                img.src = setting.value;
                img.style.display = 'block';
                icon.style.display = 'none';
            } else {
                img.style.display = 'none';
                icon.style.display = 'block';
            }
        }
        if (setting.key === 'admin_2fa_enabled') {
            const status = document.getElementById('2fa-status');
            const btn = document.getElementById('toggle-2fa-btn');
            if (setting.value === 'true') {
                status.innerText = 'ATIVADO';
                status.style.color = '#2ecc71';
                btn.innerText = 'Desativar';
            } else {
                status.innerText = 'DESATIVADO';
                status.style.color = '#e63946';
                btn.innerText = 'Ativar';
            }
        }
    });
}

async function saveSettingsFromForm(formId) {
    const form = document.getElementById(formId);
    const formData = new FormData(form);
    const updates = [];

    for (const [key, value] of formData.entries()) {
        // Upsert setting: try to update, if not exist insert (requires logic, but our setup.sql uses ON CONFLICT DO NOTHING for inserts, 
        // effectively we should check if exists or use upsert if we had proper constraints. 
        // Since setup.sql defined key as UNIQUE, upsert works good.)

        updates.push(
            supabaseClient.from('site_settings').upsert({
                key: key,
                value: value
            }, { onConflict: 'key' })
        );
    }

    try {
        await Promise.all(updates);
        showToast('Configurações salvas com sucesso!');
    } catch (err) {
        console.error(err);
        showToast('Erro ao salvar configurações.', 'error');
    }
}

function setupEventListeners() {
    setupCategoryFormListener();
    // Attach generic save handlers
    ['hero-form', 'about-form', 'contact-info-form', 'visual-settings-form', 'admin-profile-form', 'marketing-settings-form'].forEach(id => {
        const form = document.getElementById(id);
        if (form) {
            form.addEventListener('submit', async (e) => {
                e.preventDefault();
                await saveSettingsFromForm(id);
                // Refresh specific UI if profile or marketing was saved
                if (id === 'admin-profile-form' || id === 'marketing-settings-form') {
                    loadSettingsToForms();
                }
            });
        }
    });

    // Content Forms
    const serviceForm = document.getElementById('service-form');
    if (serviceForm) {
        serviceForm.addEventListener('submit', saveService);
    }
    const momentoForm = document.getElementById('momento-form');
    if (momentoForm) {
        momentoForm.addEventListener('submit', saveMomento);
    }

    // Password Change Listener ...
    const passForm = document.getElementById('change-password-form');
    if (passForm) {
        passForm.addEventListener('submit', handlePasswordChange);
    }

    // 2FA Toggle Listener ...
    const tfaBtn = document.getElementById('toggle-2fa-btn');
    if (tfaBtn) {
        tfaBtn.addEventListener('click', toggle2FA);
    }

    // New 2FA setup listener
    const setup2FABtn = document.getElementById('setup-2fa-new-btn');
    if (setup2FABtn) {
        setup2FABtn.addEventListener('click', show2FASetup);
    }
}

// ==========================================
// SERVICES MANAGEMENT
// ==========================================
async function loadServicesAdmin() {
    const tableBody = document.getElementById('services-table-body');
    if (!tableBody) return;
    tableBody.innerHTML = '<tr><td colspan="4" style="text-align:center;">Carregando...</td></tr>';

    const { data, error } = await supabaseClient.from('site_services').select('*').order('display_order', { ascending: true });
    if (error) {
        tableBody.innerHTML = '<tr><td colspan="4" style="color:red; text-align:center;">Erro ao carregar dados</td></tr>';
        return;
    }

    tableBody.innerHTML = '';
    data.forEach(s => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${s.display_order}</td>
            <td style="font-weight: 500;">${s.title_pt}</td>
            <td><i class="${s.icon || 'fas fa-star'}"></i></td>
            <td>
                <button class="btn btn-primary" onclick="showServiceModal(${s.id})" style="padding: 0.4rem 0.8rem; font-size: 0.85rem; margin-right: 5px;"><i class="fas fa-edit"></i></button>
                <button class="btn btn-danger" onclick="deleteService(${s.id})" style="padding: 0.4rem 0.8rem; font-size: 0.85rem;"><i class="fas fa-trash"></i></button>
            </td>
        `;
        tableBody.appendChild(tr);
    });
}

function showServiceModal(id = null) {
    const modal = document.getElementById('serviceModal');
    const form = document.getElementById('service-form');
    const title = document.getElementById('service-modal-title');

    form.reset();
    document.getElementById('service-id').value = '';
    title.innerText = 'Novo Serviço';

    if (id) {
        title.innerText = 'Editar Serviço';
        fetchServiceData(id);
    }
    modal.style.display = 'block';
}

async function fetchServiceData(id) {
    const { data, error } = await supabaseClient.from('site_services').select('*').eq('id', id).single();
    if (data) {
        const form = document.getElementById('service-form');
        document.getElementById('service-id').value = data.id;
        form.querySelector('[name="title_pt"]').value = data.title_pt;
        form.querySelector('[name="title_en"]').value = data.title_en || '';
        form.querySelector('[name="description_pt"]').value = data.description_pt;
        form.querySelector('[name="description_en"]').value = data.description_en || '';
        form.querySelector('[name="icon"]').value = data.icon || '';
        form.querySelector('[name="display_order"]').value = data.display_order;
    }
}

function hideServiceModal() {
    document.getElementById('serviceModal').style.display = 'none';
}

async function saveService(e) {
    e.preventDefault();
    const formData = new FormData(e.target);
    const id = formData.get('id');
    const data = Object.fromEntries(formData.entries());
    delete data.id;

    let res;
    if (id) res = await supabaseClient.from('site_services').update(data).eq('id', id);
    else res = await supabaseClient.from('site_services').insert([data]);

    if (res.error) showToast('Erro ao salvar serviço: ' + res.error.message, 'error');
    else {
        showToast('Serviço salvo com sucesso!');
        hideServiceModal();
        loadServicesAdmin();
    }
}

async function deleteService(id) {
    if (confirm('Deseja realmente excluir este serviço?')) {
        const { error } = await supabaseClient.from('site_services').delete().eq('id', id);
        if (error) showToast('Erro ao excluir: ' + error.message, 'error');
        else {
            showToast('Serviço removido!');
            loadServicesAdmin();
        }
    }
}

// ==========================================
// MOMENTOS MANAGEMENT
// ==========================================
async function loadMomentosAdmin() {
    const tableBody = document.getElementById('momentos-table-body');
    if (!tableBody) return;
    tableBody.innerHTML = '<tr><td colspan="3" style="text-align:center;">Carregando...</td></tr>';

    const { data, error } = await supabaseClient.from('site_momentos').select('*').order('display_order', { ascending: true });
    if (error) {
        tableBody.innerHTML = '<tr><td colspan="3" style="color:red; text-align:center;">Erro ao carregar dados</td></tr>';
        return;
    }

    tableBody.innerHTML = '';
    data.forEach(m => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${m.display_order}</td>
            <td style="font-size: 0.85rem; color: #666; max-width: 300px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${m.video_url}</td>
            <td>
                <button class="btn btn-primary" onclick="showMomentoModal(${m.id})" style="padding: 0.4rem 0.8rem; font-size: 0.85rem; margin-right: 5px;"><i class="fas fa-edit"></i></button>
                <button class="btn btn-danger" onclick="deleteMomento(${m.id})" style="padding: 0.4rem 0.8rem; font-size: 0.85rem;"><i class="fas fa-trash"></i></button>
            </td>
        `;
        tableBody.appendChild(tr);
    });
}

function showMomentoModal(id = null) {
    const modal = document.getElementById('momentoModal');
    const form = document.getElementById('momento-form');
    const title = document.getElementById('momento-modal-title');

    form.reset();
    document.getElementById('momento-id').value = '';
    title.innerText = 'Adicionar Vídeo';

    if (id) {
        title.innerText = 'Editar Vídeo';
        fetchMomentoData(id);
    }
    modal.style.display = 'block';
}

async function fetchMomentoData(id) {
    const { data, error } = await supabaseClient.from('site_momentos').select('*').eq('id', id).single();
    if (data) {
        const form = document.getElementById('momento-form');
        document.getElementById('momento-id').value = data.id;
        form.querySelector('[name="video_url"]').value = data.video_url;
        form.querySelector('[name="display_order"]').value = data.display_order;
    }
}

function hideMomentoModal() {
    document.getElementById('momentoModal').style.display = 'none';
}

async function saveMomento(e) {
    e.preventDefault();
    const formData = new FormData(e.target);
    const id = formData.get('id');
    const data = Object.fromEntries(formData.entries());
    delete data.id;

    let res;
    if (id) res = await supabaseClient.from('site_momentos').update(data).eq('id', id);
    else res = await supabaseClient.from('site_momentos').insert([data]);

    if (res.error) showToast('Erro ao salvar vídeo: ' + res.error.message, 'error');
    else {
        showToast('Vídeo salvo com sucesso!');
        hideMomentoModal();
        loadMomentosAdmin();
    }
}

async function deleteMomento(id) {
    if (confirm('Deseja realmente remover este vídeo?')) {
        const { error } = await supabaseClient.from('site_momentos').delete().eq('id', id);
        if (error) showToast('Erro ao remover: ' + error.message, 'error');
        else {
            showToast('Vídeo removido!');
            loadMomentosAdmin();
        }
    }
}


// ==========================================
// IMAGE UPLOAD HANDLER
// ==========================================
async function handleFileUpload(inputElement, targetUrlInputId, previewImgId) {
    const file = inputElement.files[0];
    if (!file) return;

    // Store original button or indicator if needed, but let's just use toast
    showToast('Enviando imagem principal...', 'info');

    try {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}.${fileExt}`;
        const filePath = `${fileName}`;

        const { data, error } = await supabaseClient.storage
            .from('products-images')
            .upload(filePath, file);

        if (error) throw error;

        const { data: { publicUrl } } = supabaseClient.storage.from('products-images').getPublicUrl(filePath);

        const targetInput = document.getElementById(targetUrlInputId);
        if (targetInput) {
            targetInput.value = publicUrl;
        }

        const preview = document.getElementById(previewImgId);
        if (preview) {
            preview.src = publicUrl;
            preview.style.display = 'block';
        }

        showToast('Imagem enviada com sucesso!');

    } catch (err) {
        console.error('Upload Error:', err);
        showToast('Erro no upload: ' + err.message, 'error');
    } finally {
        // Clear file input so it can be used again for same file if needed
        inputElement.value = '';
    }
}

// ==========================================
// CAROUSEL MANAGEMENT
// ==========================================
const carouselTableBody = document.getElementById('carousel-table-body');

async function loadCarouselAdmin() {
    if (!carouselTableBody) return;
    carouselTableBody.innerHTML = '<tr><td colspan="5" style="text-align:center;">Carregando...</td></tr>';

    const { data, error } = await supabaseClient
        .from('carousel_items')
        .select('*')
        .order('display_order', { ascending: true });

    if (error) {
        console.error(error);
        carouselTableBody.innerHTML = `<tr><td colspan="5" style="color:red; text-align:center; padding: 20px;">
            <i class="fas fa-exclamation-triangle"></i> Erro ao acessar banco de dados.<br>
            <small>${error.message}</small><br>
            <small style="display:block; margin-top:10px;">Verifique se criou a tabela 'carousel_items' no Supabase usando o arquivo 'carousel_setup.sql'.</small>
        </td></tr>`;
        return;
    }

    carouselTableBody.innerHTML = '';
    if (data.length === 0) {
        carouselTableBody.innerHTML = `<tr><td colspan="5" style="text-align:center; padding: 20px;">
            <p>Nenhum item encontrado.</p>
            <button class="btn btn-secondary" onclick="seedCarouselData()" style="font-size: 0.8rem; margin-top: 10px;">
                <i class="fas fa-magic"></i> Gerar Itens Iniciais Padrão
            </button>
        </td></tr>`;
        return;
    }

    data.forEach(item => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>
                <img src="${item.image_url}" style="width: 50px; height: 50px; object-fit: cover; border-radius: 6px;">
            </td>
            <td style="font-weight: 500;">${item.title || '-'}</td>
            <td>${item.subtitle || '-'}</td>
            <td>${item.display_order}</td>
            <td>
                <button class="btn btn-primary" onclick="editCarouselItem(${item.id})" style="padding: 0.4rem 0.8rem; font-size: 0.85rem; margin-right: 5px;"><i class="fas fa-edit"></i></button>
                <button class="btn btn-danger" onclick="deleteCarouselItem(${item.id})" style="padding: 0.4rem 0.8rem; font-size: 0.85rem;"><i class="fas fa-trash"></i></button>
            </td>
        `;
        carouselTableBody.appendChild(tr);
    });
}

function showAddCarouselForm() {
    document.getElementById('carousel-form-container').style.display = 'block';
    document.getElementById('carousel-form').reset();
    document.getElementById('car-id').value = '';
    document.getElementById('car-preview').style.display = 'none';
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function hideCarouselForm() {
    document.getElementById('carousel-form-container').style.display = 'none';
}

window.editCarouselItem = async (id) => {
    const { data, error } = await supabaseClient.from('carousel_items').select('*').eq('id', id).single();
    if (data) {
        showAddCarouselForm();
        document.getElementById('car-id').value = data.id;
        document.getElementById('car-title').value = data.title;
        document.getElementById('car-subtitle').value = data.subtitle;
        document.getElementById('car-order').value = data.display_order;
        document.getElementById('car-image').value = data.image_url;

        if (data.image_url) {
            document.getElementById('car-preview').src = data.image_url;
            document.getElementById('car-preview').style.display = 'block';
        }
    }
};

window.deleteCarouselItem = async (id) => {
    if (confirm('Tem certeza que deseja remover este item do carrossel?')) {
        const { error } = await supabaseClient.from('carousel_items').delete().eq('id', id);
        if (error) showToast('Erro: ' + error.message, 'error');
        else {
            showToast('Item removido!');
            loadCarouselAdmin();
        }
    }
};

const carouselForm = document.getElementById('carousel-form');
if (carouselForm) {
    carouselForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const id = document.getElementById('car-id').value;

        const carouselData = {
            title: document.getElementById('car-title').value,
            subtitle: document.getElementById('car-subtitle').value,
            display_order: parseInt(document.getElementById('car-order').value),
            image_url: document.getElementById('car-image').value
        };

        let result;
        if (id) {
            result = await supabaseClient.from('carousel_items').update(carouselData).eq('id', id);
        } else {
            result = await supabaseClient.from('carousel_items').insert([carouselData]);
        }

        if (result.error) {
            showToast('Erro ao salvar: ' + result.error.message, 'error');
        } else {
            showToast('Carrossel atualizado!');
            hideCarouselForm();
            loadCarouselAdmin();
        }
    });
}

// Migração automática/Seed data helper
async function seedCarouselData() {
    const defaultItems = [
        { title: 'Produto 1', subtitle: 'Mais vendido', display_order: 1, image_url: 'images/Exposição principal/exposição (1).jpg' },
        { title: 'Produto 2', subtitle: 'Tendência', display_order: 2, image_url: 'images/Exposição principal/exposição (2).jpg' },
        { title: 'Produto 3', subtitle: 'Novo no site', display_order: 3, image_url: 'images/Exposição principal/exposição (3).jpg' },
        { title: 'Produto 4', subtitle: 'Destaque', display_order: 4, image_url: 'images/Exposição principal/exposição (4).jpg' },
        { title: 'Produto 5', subtitle: 'Edição Limitada', display_order: 5, image_url: 'images/Exposição principal/exposição (5).jpg' }
    ];

    showToast('Iniciando migração de dados...', 'info');
    const { error } = await supabaseClient.from('carousel_items').insert(defaultItems);

    if (error) showToast('Erro na migração: ' + error.message, 'error');
    else {
        showToast('Dados iniciais criados!');
        loadCarouselAdmin();
    }
}

// ==========================================
// SECURITY & PROFILE HELPERS
// ==========================================

// 1. Inactivity Logout (1 hour)
function setupAutoLogout() {
    let timeout;
    const INACTIVITY_LIMIT = 60 * 60 * 1000; // 1 hour

    function resetTimer() {
        clearTimeout(timeout);
        timeout = setTimeout(() => {
            showToast('Logout por inatividade...', 'info');
            logout();
        }, INACTIVITY_LIMIT);
    }

    // Events to reset timer
    ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'].forEach(evt => {
        document.addEventListener(evt, resetTimer, true);
    });

    resetTimer(); // Start initially
}

// 2. Password Change
async function handlePasswordChange(e) {
    e.preventDefault();
    const newPass = document.getElementById('new-password').value;
    const confirmPass = document.getElementById('confirm-password').value;

    if (newPass !== confirmPass) {
        showToast('As senhas não coincidem!', 'error');
        return;
    }

    showToast('Atualizando senha...', 'info');
    const { error } = await supabaseClient.auth.updateUser({ password: newPass });

    if (error) {
        showToast('Erro: ' + error.message, 'error');
    } else {
        showToast('Senha alterada com sucesso!');
        document.getElementById('change-password-form').reset();
    }
}

// 3. 2FA Configuration
let pending2FASecret = '';

function generateBase32Secret(length = 16) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
    let secret = '';
    for (let i = 0; i < length; i++) {
        secret += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return secret;
}

async function show2FASetup() {
    const setupArea = document.getElementById('2fa-setup-area');
    const qrContainer = document.getElementById('2fa-qrcode');
    const secretText = document.getElementById('2fa-secret-text');

    // Generate new secret
    pending2FASecret = generateBase32Secret();
    secretText.innerText = pending2FASecret.match(/.{1,4}/g).join(' '); // Format with spaces

    // Clear previous QR
    qrContainer.innerHTML = '';

    // Generate QR Code
    const label = 'Admin';
    const issuer = 'DivinosGraffic';
    const otpauth = `otpauth://totp/${issuer}:${label}?secret=${pending2FASecret}&issuer=${issuer}`;

    new QRCode(qrContainer, {
        text: otpauth,
        width: 180,
        height: 180,
        colorDark: "#000000",
        colorLight: "#ffffff",
        correctLevel: QRCode.CorrectLevel.H
    });

    setupArea.style.display = 'block';
    setupArea.scrollIntoView({ behavior: 'smooth' });
}

function hide2FASetup() {
    document.getElementById('2fa-setup-area').style.display = 'none';
    pending2FASecret = '';
}

async function confirm2FASetup() {
    if (!pending2FASecret) return;

    showToast('Salvando configuração 2FA...', 'info');

    // 1. Save Secret
    const { error: err1 } = await supabaseClient.from('site_settings').upsert({
        key: 'admin_2fa_secret',
        value: pending2FASecret
    }, { onConflict: 'key' });

    // 2. Enable 2FA
    const { error: err2 } = await supabaseClient.from('site_settings').upsert({
        key: 'admin_2fa_enabled',
        value: 'true'
    }, { onConflict: 'key' });

    if (err1 || err2) {
        showToast('Erro ao salvar configuração 2FA', 'error');
    } else {
        showToast('2FA Configurado e Ativado!');
        hide2FASetup();
        loadSettingsToForms(); // Refresh UI to show "ATIVADO"
    }
}

async function toggle2FA() {
    const statusEl = document.getElementById('2fa-status');
    const isCurrentlyOn = statusEl.innerText === 'ATIVADO';

    if (!isCurrentlyOn) {
        // If turning ON, show setup instead of just toggling
        show2FASetup();
        return;
    }

    // If turning OFF
    if (!confirm('Deseja realmente desativar o Google Authenticator? Seu login ficará menos seguro.')) return;

    showToast('Desativando 2FA...', 'info');

    const { error } = await supabaseClient.from('site_settings').upsert({
        key: 'admin_2fa_enabled',
        value: 'false'
    }, { onConflict: 'key' });

    if (error) {
        showToast('Erro ao atualizar 2FA', 'error');
    } else {
        loadSettingsToForms();
        showToast('2FA Desativado!');
    }
}

// Global scope for inline events
window.switchTab = switchTab;
window.handleFileUpload = handleFileUpload;
window.logout = logout;
window.showAddProductForm = showAddProductForm;
window.hideProductForm = hideProductForm;
window.showAddCategoryForm = showAddCategoryForm;
window.hideCategoryForm = hideCategoryForm;
window.loadCategoriesAdmin = loadCategoriesAdmin;
window.showAddCarouselForm = showAddCarouselForm;
window.hideCarouselForm = hideCarouselForm;
window.loadCarouselAdmin = loadCarouselAdmin;
window.seedCarouselData = seedCarouselData;
window.toggleSidebar = toggleSidebar;
window.toggle2FA = toggle2FA;
window.show2FASetup = show2FASetup;
window.hide2FASetup = hide2FASetup;
window.confirm2FASetup = confirm2FASetup;

// New Content & Analytics Exports
window.fetchRecentVisits = fetchRecentVisits;
window.loadServicesAdmin = loadServicesAdmin;
window.showServiceModal = showServiceModal;
window.hideServiceModal = hideServiceModal;
window.deleteService = deleteService;
window.loadMomentosAdmin = loadMomentosAdmin;
window.showMomentoModal = showMomentoModal;
window.hideMomentoModal = hideMomentoModal;
window.deleteMomento = deleteMomento;
