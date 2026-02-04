/**
 * PRODUCT DETAIL PAGE FUNCTIONALITY
 * Carrega e renderiza dados de um produto específico
 */

// Obter ID do produto via URL parameter
const urlParams = new URLSearchParams(window.location.search);
const productId = urlParams.get('id');

let currentProduct = null;
let selectedSize = null;

// Inicializar quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', async () => {
    if (!productId) {
        alert('Produto não encontrado!');
        window.location.href = 'products.html';
        return;
    }

    if (!window.supabaseClient) {
        console.error('Supabase client não disponível');
        return;
    }

    await loadProductDetails();
    initializeEventListeners();
});

/**
 * Carregar detalhes do produto do Supabase
 */
async function loadProductDetails() {
    try {
        // Buscar produto pelo ID
        const { data: product, error } = await window.supabaseClient
            .from('products')
            .select('*')
            .eq('id', productId)
            .single();

        if (error || !product) {
            console.error('Erro ao buscar produto:', error);
            alert('Produto não encontrado!');
            window.location.href = 'products.html';
            return;
        }

        currentProduct = product;
        renderProductDetails(product);
        await loadRelatedProducts(product.category);

    } catch (e) {
        console.error('Exceção ao carregar produto:', e);
    }
}

/**
 * Renderizar detalhes do produto na página
 */
function renderProductDetails(product) {
    // Título e breadcrumb
    document.getElementById('product-title').textContent = product.title;
    document.getElementById('breadcrumb-product').textContent = product.title;
    document.title = `${product.title} - Divinos Graffic`;

    // Badge (se existir)
    if (product.badge) {
        const badgeEl = document.getElementById('product-badge');
        badgeEl.textContent = product.badge;
        badgeEl.style.display = 'inline-block';
    }

    // Avaliação
    const rating = product.rating || 0;
    const reviewCount = product.review_count || 0;
    renderStars('product-stars', rating);
    document.getElementById('review-count').textContent = `(${reviewCount} ${reviewCount === 1 ? 'Avaliação' : 'Avaliações'})`;

    // Preço
    const price = parseFloat(product.price) || 0;
    const discount = product.discount_percentage || 0;

    document.getElementById('current-price').textContent = `${price} MT`;

    if (discount > 0) {
        const oldPrice = (price / (1 - discount / 100)).toFixed(2);
        const oldPriceEl = document.getElementById('old-price');
        oldPriceEl.textContent = `${oldPrice} MT`;
        oldPriceEl.style.display = 'inline';

        const discountBadge = document.getElementById('discount-percentage');
        discountBadge.textContent = `-${discount}%`;
        discountBadge.style.display = 'inline-block';
    }

    // Descrição curta
    document.getElementById('product-short-desc').textContent = product.description || 'Sem descrição disponível.';

    // Galeria de imagens
    renderGallery(product);

    // Tamanhos (se existir)
    if (product.sizes && Array.isArray(product.sizes) && product.sizes.length > 0) {
        renderSizes(product.sizes);
    }

    // Meta informações
    document.querySelector('#product-sku span').textContent = product.sku || `PRD${String(product.id).padStart(6, '0')}`;
    document.querySelector('#product-category span').textContent = product.category || 'Sem categoria';

    if (product.tags && Array.isArray(product.tags) && product.tags.length > 0) {
        const tagsEl = document.getElementById('product-tags');
        tagsEl.querySelector('span').textContent = product.tags.join(', ');
        tagsEl.style.display = 'block';
    }

    // Descrição longa (tab)
    const longDesc = product.long_description || product.description || 'Sem descrição detalhada.';
    document.getElementById('product-long-description').innerHTML = `<p>${longDesc.replace(/\n/g, '<br>')}</p>`;

    // Informações adicionais (tab)
    renderAdditionalInfo(product);

    // Reviews (tab)
    renderReviews(product);

    // WhatsApp button
    const whatsappBtn = document.getElementById('btn-whatsapp');
    whatsappBtn.onclick = () => {
        const message = `Olá, gostaria de comprar: ${product.title}`;
        window.open(`https://wa.me/258828800311?text=${encodeURIComponent(message)}`, '_blank');
    };

    // Social share
    setupSocialShare(product);
}

/**
 * Renderizar estrelas de avaliação
 */
function renderStars(elementId, rating) {
    const container = document.getElementById(elementId);
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    let html = '';

    for (let i = 0; i < 5; i++) {
        if (i < fullStars) {
            html += '<i class="fas fa-star"></i>';
        } else if (i === fullStars && hasHalfStar) {
            html += '<i class="fas fa-star-half-alt"></i>';
        } else {
            html += '<i class="far fa-star"></i>';
        }
    }

    container.innerHTML = html;
}

/**
 * Renderizar galeria de imagens
 */
function renderGallery(product) {
    const mainImage = document.getElementById('main-product-image');
    const thumbnailsContainer = document.getElementById('image-thumbnails');

    // Processar gallery
    let images = [];
    if (product.image_url) {
        images.push(product.image_url);
    }

    if (product.gallery) {
        if (Array.isArray(product.gallery)) {
            images = images.concat(product.gallery);
        } else if (typeof product.gallery === 'string') {
            try {
                const parsed = JSON.parse(product.gallery);
                if (Array.isArray(parsed)) {
                    images = images.concat(parsed);
                }
            } catch (e) {
                // Se não for JSON, ignorar
            }
        }
    }

    // Se não houver imagens, usar placeholder
    if (images.length === 0) {
        images.push('../images/placeholder.jpg');
    }

    // Definir imagem principal
    mainImage.src = images[0];
    mainImage.alt = product.title;

    // Renderizar thumbnails (se houver mais de 1 imagem)
    if (images.length > 1) {
        thumbnailsContainer.innerHTML = '';
        images.forEach((img, index) => {
            const thumb = document.createElement('img');
            thumb.src = img;
            thumb.alt = `${product.title} - Imagem ${index + 1}`;
            thumb.className = index === 0 ? 'active' : '';
            thumb.onclick = () => {
                mainImage.src = img;
                thumbnailsContainer.querySelectorAll('img').forEach(t => t.classList.remove('active'));
                thumb.classList.add('active');
            };
            thumbnailsContainer.appendChild(thumb);
        });
    } else {
        // Se só tem 1 imagem, esconder thumbnails
        thumbnailsContainer.style.display = 'none';
    }
}

/**
 * Renderizar seletor de tamanhos
 */
function renderSizes(sizes) {
    const sizeSection = document.getElementById('size-selector-section');
    const sizeButtons = document.getElementById('size-buttons');

    sizeButtons.innerHTML = '';
    sizes.forEach((size, index) => {
        const btn = document.createElement('button');
        btn.className = 'size-btn';
        btn.textContent = size;
        btn.onclick = () => {
            sizeButtons.querySelectorAll('.size-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            selectedSize = size;
        };

        // Selecionar primeiro tamanho por padrão
        if (index === 0) {
            btn.classList.add('active');
            selectedSize = size;
        }

        sizeButtons.appendChild(btn);
    });

    sizeSection.style.display = 'block';
}

/**
 * Renderizar informações adicionais
 */
function renderAdditionalInfo(product) {
    const table = document.querySelector('#additional-info-table tbody');
    table.innerHTML = '';

    // Se tiver additional_info em JSON
    if (product.additional_info && typeof product.additional_info === 'object') {
        Object.entries(product.additional_info).forEach(([key, value]) => {
            const row = table.insertRow();
            row.innerHTML = `<td><strong>${key}</strong></td><td>${value}</td>`;
        });
    } else {
        // Info padrão
        const defaultInfo = {
            'SKU': product.sku || `PRD${String(product.id).padStart(6, '0')}`,
            'Categoria': product.category || 'Sem categoria',
            'Disponibilidade': 'Em estoque'
        };

        if (product.sizes && product.sizes.length > 0) {
            defaultInfo['Tamanhos'] = product.sizes.join(', ');
        }

        Object.entries(defaultInfo).forEach(([key, value]) => {
            const row = table.insertRow();
            row.innerHTML = `<td><strong>${key}</strong></td><td>${value}</td>`;
        });
    }
}

/**
 * Renderizar seção de avaliações
 */
function renderReviews(product) {
    const rating = product.rating || 0;
    const reviewCount = product.review_count || 0;

    document.getElementById('avg-rating').textContent = rating.toFixed(1);
    renderStars('avg-stars', rating);
    document.getElementById('total-reviews').textContent = `(${reviewCount} ${reviewCount === 1 ? 'avaliação' : 'avaliações'})`;
}

/**
 * Carregar produtos relacionados (mesma categoria)
 */
async function loadRelatedProducts(category) {
    try {
        const { data: products, error } = await window.supabaseClient
            .from('products')
            .select('*')
            .eq('category', category)
            .neq('id', productId)
            .limit(4);

        if (error || !products || products.length === 0) {
            document.querySelector('.related-products-section').style.display = 'none';
            return;
        }

        const grid = document.getElementById('related-products-grid');
        grid.innerHTML = '';

        products.forEach(p => {
            grid.appendChild(createProductCard(p));
        });

    } catch (e) {
        console.error('Erro ao carregar produtos relacionados:', e);
    }
}

/**
 * Criar card de produto (estilo atualizado)
 */
function createProductCard(product) {
    const div = document.createElement('div');
    div.className = 'product-card new-style fade-in';
    div.setAttribute('data-category', product.category || 'Outros');

    const imgUrl = product.image_url || '../images/placeholder.jpg';
    const price = parseFloat(product.price) || 0;
    const discount = product.discount_percentage || 0;
    const rating = product.rating || 0;

    let priceHTML = `<span class="current-price">${price} MT</span>`;
    let discountBadge = '';

    if (discount > 0) {
        const oldPrice = (price / (1 - discount / 100)).toFixed(2);
        priceHTML = `
            <span class="current-price">${price} MT</span>
            <span class="old-price">${oldPrice} MT</span>
        `;
        discountBadge = `<span class="discount-badge">${discount}% off</span>`;
    }

    div.innerHTML = `
        <div class="product-image-wrapper">
            ${discountBadge}
            <img src="${imgUrl}" alt="${product.title}">
            <div class="product-quick-actions">
                <button class="action-icon wishlist" title="Adicionar aos favoritos">
                    <i class="far fa-heart"></i>
                </button>
                <button class="action-icon quick-view" title="Visualização rápida" onclick="window.location.href='product-detail.html?id=${product.id}'">
                    <i class="fas fa-eye"></i>
                </button>
            </div>
        </div>
        <div class="product-card-info">
            <a href="product-detail.html?id=${product.id}" class="product-name">${product.title}</a>
            <div class="product-rating-compact">
                <span class="stars-compact">${'★'.repeat(Math.floor(rating))}${'☆'.repeat(5 - Math.floor(rating))}</span>
                <span class="rating-value">${rating.toFixed(1)}</span>
            </div>
            <div class="product-price-compact">
                ${priceHTML}
            </div>
        </div>
    `;

    return div;
}

/**
 * Configurar compartilhamento social
 */
function setupSocialShare(product) {
    const url = window.location.href;
    const text = `Confira este produto: ${product.title}`;

    document.getElementById('share-facebook').href = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
    document.getElementById('share-twitter').href = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`;
    document.getElementById('share-whatsapp').href = `https://wa.me/?text=${encodeURIComponent(text + ' ' + url)}`;
}

/**
 * Inicializar event listeners
 */
function initializeEventListeners() {
    // Controle de quantidade
    const qtyInput = document.getElementById('product-quantity');
    const qtyMinus = document.getElementById('qty-minus');
    const qtyPlus = document.getElementById('qty-plus');

    qtyMinus.onclick = () => {
        const current = parseInt(qtyInput.value) || 1;
        if (current > 1) {
            qtyInput.value = current - 1;
        }
    };

    qtyPlus.onclick = () => {
        const current = parseInt(qtyInput.value) || 1;
        qtyInput.value = current + 1;
    };

    // Adicionar ao carrinho
    document.getElementById('btn-add-cart').onclick = () => {
        if (!currentProduct) return;

        const quantity = parseInt(qtyInput.value) || 1;
        const cartItem = {
            id: currentProduct.id,
            title: currentProduct.title,
            price: currentProduct.price,
            image_url: currentProduct.image_url,
            quantity: quantity,
            size: selectedSize
        };

        // Usar função addToCart existente do cart.js
        if (typeof addToCart === 'function') {
            addToCart(cartItem, document.getElementById('btn-add-cart'));
        }
    };

    // Wishlist
    document.getElementById('btn-wishlist').onclick = () => {
        alert('Funcionalidade de favoritos em breve!');
    };

    // Tabs
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabPanes = document.querySelectorAll('.tab-pane');

    tabBtns.forEach(btn => {
        btn.onclick = () => {
            const targetTab = btn.dataset.tab;

            tabBtns.forEach(b => b.classList.remove('active'));
            tabPanes.forEach(p => p.classList.remove('active'));

            btn.classList.add('active');
            document.getElementById(`tab-${targetTab}`).classList.add('active');
        };
    });
}
