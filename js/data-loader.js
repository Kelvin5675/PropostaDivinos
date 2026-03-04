
/**
 * DATA LOADER
 * Responsável por buscar dados do Supabase e preencher o site dinamicamente.
 */

document.addEventListener('DOMContentLoaded', async () => {
    try {
        if (!window.supabaseClient) {
            console.error("Supabase client not found.");
            if (window.hidePreloader) window.hidePreloader();
            return;
        }

        // Carregar Configurações do Site
        await loadSiteSettings();

        // Carregar Outras Seções Dinâmicas
        const isIndex = document.querySelector('.services-grid') || document.getElementById('works-carousel-track');

        if (isIndex) {
            await loadServices();
            await loadNossosTrabalhos();
            await loadMomentos();
            await loadHeroCarousel();
            await loadFeaturedProducts();
        }

        if (document.querySelector('.products-grid')) {
            await loadProducts();
        }

        // Registrar Visita
        trackVisit();

    } catch (err) {
        console.error("Error during data loading:", err);
    } finally {
        // Finalize: Trigger observations and hide preloader
        setTimeout(() => {
            if (window.observeNewElements) {
                window.observeNewElements('.product-card, .service-card');
            }
            if (window.hidePreloader) {
                window.hidePreloader();
            } else {
                const pl = document.getElementById('preloader');
                if (pl) pl.style.display = 'none';
            }
        }, 300);
    }
});

async function loadSiteSettings() {
    try {
        const { data: settings, error } = await supabaseClient
            .from('site_settings')
            .select('*');

        if (error) throw error;
        if (!settings) return;

        const isAdminPath = window.location.pathname.includes('/admin/');

        settings.forEach(setting => {
            const val = setting.value;
            const key = setting.key;
            if (!val) return;

            // Colors
            if (key.startsWith('color_') || key.startsWith('theme_')) {
                const cssVar = '--' + key.replace('theme_', '').replace('color_', '').replace(/_/g, '-');
                document.documentElement.style.setProperty(cssVar, val);
                if (key === 'color_primary' || key === 'theme_primary_color') document.documentElement.style.setProperty('--primary-color', val);
                if (key === 'color_secondary' || key === 'theme_secondary_color') document.documentElement.style.setProperty('--secondary-color', val);
            }

            // Typography
            if (key.startsWith('font_')) {
                const fontVar = '--' + key.replace(/_/g, '-');
                document.documentElement.style.setProperty(fontVar, `'${val}', sans-serif`);
                const fontId = `google-font-${val.replace(/\s+/g, '-').toLowerCase()}`;
                if (!document.getElementById(fontId)) {
                    const link = document.createElement('link');
                    link.id = fontId;
                    link.rel = 'stylesheet';
                    link.href = `https://fonts.googleapis.com/css2?family=${val.replace(/\s+/g, '+')}:wght@300;400;500;600;700&display=swap`;
                    document.head.appendChild(link);
                }
            }

            // Favicon
            let shouldUpdateFavicon = false;
            if (isAdminPath && key === 'admin_favicon') shouldUpdateFavicon = true;
            if (!isAdminPath && key === 'site_favicon') shouldUpdateFavicon = true;
            if (shouldUpdateFavicon) {
                const rels = ['icon', 'shortcut icon', 'apple-touch-icon', 'alternate icon'];
                rels.forEach(rel => {
                    const existing = document.querySelectorAll(`link[rel*="${rel}"]`);
                    existing.forEach(el => el.parentNode.removeChild(el));
                });
                const v = new Date().getTime();
                const finalUrl = val.includes('?') ? `${val}&v=${v}` : `${val}?v=${v}`;
                ['icon', 'shortcut icon', 'apple-touch-icon'].forEach(rel => {
                    const link = document.createElement('link');
                    link.rel = rel;
                    link.href = finalUrl;
                    document.head.appendChild(link);
                });
            }

            // Generic elements
            const elements = document.querySelectorAll(`[data-key="${key}"]`);
            elements.forEach(el => {
                if (el.tagName === 'A') {
                    if (key === 'contact_email') el.href = `mailto:${val}`;
                    else if (key === 'contact_phone' || key === 'whatsapp_number') el.href = `tel:${val.replace(/\s/g, '')}`;
                    else el.href = val;
                } else if (el.tagName === 'IMG') {
                    el.src = val;
                } else {
                    el.innerText = val;
                    if (el.hasAttribute('data-pt')) el.setAttribute('data-pt', val);
                }
                if (key.startsWith('stats_')) {
                    el.setAttribute('data-target', val);
                    el.innerText = '0';
                }
            });

            // Marketing & SEO
            if (key === 'marketing_fb_pixel_id' && val) injectFacebookPixel(val);
            if (key === 'marketing_google_analytics_id' && val) injectGoogleAnalytics(val);
            if (key === 'seo_title' && !isAdminPath) document.title = val;
            if (key === 'seo_description') {
                updateMetaTag('description', val);
                updateMetaTag('og:description', val);
            }
            if (key === 'seo_keywords') updateMetaTag('keywords', val);
        });

        // Carregar configurações de pagamento
        const { data: paymentConfig } = await supabaseClient
            .from('payment_config')
            .select('is_enabled, provider, public_key, currency')
            .maybeSingle();

        if (paymentConfig) {
            window.siteSettings = window.siteSettings || {};
            window.siteSettings.payment = paymentConfig;
        }

    } catch (err) { console.error('Erro ao carregar configurações:', err); }
}

function updateMetaTag(name, content) {
    let meta = document.querySelector(`meta[name="${name}"]`) || document.querySelector(`meta[property="${name}"]`);
    if (!meta) {
        meta = document.createElement('meta');
        if (name.startsWith('og:')) meta.setAttribute('property', name);
        else meta.setAttribute('name', name);
        document.head.appendChild(meta);
    }
    meta.setAttribute('content', content);
}

function injectFacebookPixel(fbid) {
    if (window.FB_PIXEL_LOADED) return;
    !function (f, b, e, v, n, t, s) {
        if (f.fbq) return; n = f.fbq = function () {
            n.callMethod ?
                n.callMethod.apply(n, arguments) : n.queue.push(arguments)
        }; if (!f._fbq) f._fbq = n;
        n.push = n; n.loaded = !0; n.version = '2.0'; n.queue = []; t = b.createElement(e); t.async = !0;
        t.src = v; s = b.getElementsByTagName(e)[0]; s.parentNode.insertBefore(t, s)
    }(window,
        document, 'script', 'https://connect.facebook.net/en_US/fbevents.js');
    fbq('init', fbid);
    fbq('track', 'PageView');
    window.FB_PIXEL_LOADED = true;
}

function injectGoogleAnalytics(gaid) {
    if (window.GA_LOADED) return;
    const script = document.createElement('script');
    script.async = true; script.src = `https://www.googletagmanager.com/gtag/js?id=${gaid}`;
    document.head.appendChild(script);
    window.dataLayer = window.dataLayer || [];
    function gtag() { dataLayer.push(arguments); }
    gtag('js', new Date()); gtag('config', gaid);
    window.GA_LOADED = true;
}

async function loadServices() {
    try {
        const grid = document.querySelector('.services-grid');
        if (!grid) return;
        const { data: services, error } = await window.supabaseClient.from('site_services').select('*').order('display_order', { ascending: true });
        if (error || !services) return;
        grid.innerHTML = '';
        services.forEach(s => {
            const card = document.createElement('div');
            card.className = 'service-card';
            card.innerHTML = `<div class="service-icon"><i class="${s.icon || 'fas fa-star'}"></i></div>
                <h3 data-pt="${s.title_pt}">${s.title_pt}</h3>
                <p data-pt="${s.description_pt}">${s.description_pt.replace(/\n/g, '<br>')}</p>`;
            grid.appendChild(card);
        });
    } catch (e) { }
}

async function loadNossosTrabalhos() {
    try {
        const track = document.getElementById('works-track');
        if (!track) return;

        const { data: items, error } = await window.supabaseClient
            .from('nossos_trabalhos')
            .select('*')
            .order('display_order', { ascending: true });

        if (error || !items || items.length === 0) {
            console.log('Usando carousel_items como fallback');
            const fallback = await window.supabaseClient
                .from('carousel_items')
                .select('*')
                .order('display_order', { ascending: true });

            if (fallback.data && fallback.data.length > 0) {
                renderWorksCards(track, fallback.data);
            }
            return;
        }

        renderWorksCards(track, items);

    } catch (e) {
        console.error('Erro ao carregar Nossos Trabalhos:', e);
    }
}

function renderWorksCards(track, items) {
    track.innerHTML = '';

    // Renderizar cards originais
    items.forEach((item, index) => {
        const card = createWorkCard(item, index);
        track.appendChild(card);
    });

    // Duplicar para scroll infinito
    items.forEach((item, index) => {
        const card = createWorkCard(item, index + items.length);
        track.appendChild(card);
    });
}

function createWorkCard(item, index) {
    const card = document.createElement('div');
    card.className = 'work-card';

    card.innerHTML = `
        <img src="${item.image_url}" alt="${item.title || ''}" class="work-card-image" loading="lazy">
        <div class="work-card-overlay">
            <h3 class="work-card-title">${item.title || ''}</h3>
            <p class="work-card-description">${item.subtitle || ''}</p>
        </div>
    `;

    return card;
}

async function loadMomentos() {
    try {
        const grid = document.querySelector('.momentos-grid');
        if (!grid) return;
        const { data: m, error } = await window.supabaseClient.from('site_momentos').select('*').order('display_order', { ascending: true });
        if (error || !m) return;
        grid.innerHTML = '';
        m.forEach(mom => {
            const div = document.createElement('div');
            div.className = 'momento-card';
            div.innerHTML = `<video src="${mom.video_url}" autoplay muted loop playsinline></video>`;
            grid.appendChild(div);
            div.querySelector('video').addEventListener('click', function () {
                const mod = document.getElementById('videoModal'), vid = document.getElementById('modalVideo');
                if (mod && vid) { mod.classList.add('active'); vid.src = this.src; vid.muted = false; vid.play(); }
            });
        });
    } catch (e) { }
}

async function loadProducts() {
    console.log("DEBUG: loadProducts iniciado");
    try {
        if (!window.supabaseClient) {
            console.error("DEBUG: supabaseClient não disponível dentro de loadProducts");
            return;
        }

        console.log("DEBUG: Buscando categorias...");
        const { data: categories, error: catError } = await window.supabaseClient.from('categories').select('*').order('name');

        if (catError) {
            console.error("DEBUG: Erro ao buscar categorias:", catError);
        } else {
            console.log(`DEBUG: Categorias recebidas (${categories ? categories.length : 0})`);
        }

        const productsGrid = document.querySelector('.products-grid');
        const filterContainer = document.querySelector('.filter-buttons');

        if (filterContainer && categories) {
            filterContainer.innerHTML = '<button class="filter-btn active" data-filter="all">Todos</button>';
            categories.forEach(cat => {
                const btn = document.createElement('button');
                btn.className = 'filter-btn'; btn.dataset.filter = cat.name; btn.innerText = cat.name;
                filterContainer.appendChild(btn);
            });
            console.log("DEBUG: Menu de categorias preenchido");
        }

        console.log("DEBUG: Buscando produtos do Supabase...");
        const { data: products, error } = await window.supabaseClient.from('products').select('*').order('created_at', { ascending: false });

        if (error) {
            console.error("DEBUG: Erro do Supabase ao buscar produtos:", error);
            const grid = document.querySelector('.products-grid');
            if (grid) grid.innerHTML = `<p style="grid-column: 1/-1; text-align:center; color: red;">Erro ao carregar produtos: ${error.message}</p>`;
            return;
        }

        console.log(`DEBUG: Sucesso! Produtos encontrados: ${products ? products.length : 0}`);

        if (productsGrid && products) {
            productsGrid.innerHTML = '';
            if (products.length === 0) {
                productsGrid.innerHTML = '<p style="text-align:center; width:100%; grid-column: 1/-1; padding: 2rem;">Nenhum produto cadastrado.</p>';
                console.log("DEBUG: Grid limpa, mas sem produtos no banco.");
            } else {
                products.forEach(p => productsGrid.appendChild(createProductCard(p)));
                console.log(`DEBUG: ${products.length} cards de produtos inseridos no DOM`);
            }

            if (typeof initializeProductFilters === 'function') {
                initializeProductFilters();
                console.log("DEBUG: Filtros inicializados");
            }

            // Inicializar a busca após carregar os produtos
            if (typeof initializeSearch === 'function') {
                initializeSearch();
                console.log("DEBUG: Busca inicializada após carga");
            } else if (window.initializeSearch) {
                window.initializeSearch();
            }
        }
    } catch (e) {
        console.error("DEBUG: Exceção crítica em loadProducts:", e);
    }
}

async function loadFeaturedProducts() {
    try {
        const grid = document.getElementById('featured-products-grid');
        if (!grid) return;

        console.log("DEBUG: Buscando produtos em destaque...");
        const { data: products, error } = await window.supabaseClient.from('products').select('*').eq('is_featured', true).order('created_at', { ascending: false }).limit(10);

        if (error) {
            console.error("DEBUG: Erro ao buscar produtos em destaque:", error);
            return;
        }

        console.log(`DEBUG: Produtos em destaque encontrados: ${products ? products.length : 0}`);
        grid.innerHTML = '';
        if (products && products.length > 0) {
            products.forEach(p => grid.appendChild(createProductCard(p)));
        } else {
            grid.innerHTML = '<p style="text-align:center; width:100%; grid-column: 1/-1;">Nenhum produto em destaque.</p>';
        }
    } catch (e) {
        console.error("Exceção em loadFeaturedProducts:", e);
    }
}

function createProductCard(product) {
    const div = document.createElement('div');
    div.className = 'product-card new-style fade-in';
    div.setAttribute('data-category', product.category || 'Outros');

    // Ajustar caminho da imagem placeholder dependendo da página
    const isAdminPath = window.location.pathname.includes('/admin/');
    const isPagesPath = window.location.pathname.includes('/pages/');
    let placeholder = 'images/placeholder.jpg';
    if (isPagesPath || isAdminPath) {
        placeholder = '../images/placeholder.jpg';
    }

    const imgUrl = product.image_url || placeholder;

    // Calcular preços e desconto
    const price = parseFloat(product.price) || 0;
    const discount = product.discount_percentage || 0;
    const rating = product.rating || 0;
    const reviewCount = product.review_count || 0;

    // Link para página de detalhes - Use hash to avoid server URL rewriting
    // Hash (#) is client-side only and won't be stripped by 'npx serve'
    const detailLink = isPagesPath
        ? `product-detail.html#${product.id}`
        : `pages/product-detail.html#${product.id}`;
    console.log(`DEBUG: Generated Link for ${product.title} (ID: ${product.id}): ${detailLink}`);

    // HTML do preço
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

    // Badge do produto (New, Sale, Hot, etc)
    let productBadge = '';
    if (product.badge) {
        productBadge = `<span class="product-badge-card">${product.badge}</span>`;
    }

    // Renderizar estrelas
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    let starsHTML = '';
    for (let i = 0; i < 5; i++) {
        if (i < fullStars) {
            starsHTML += '★';
        } else if (i === fullStars && hasHalfStar) {
            starsHTML += '★'; // Pode usar ⯨ para meia estrela se preferir
        } else {
            starsHTML += '☆';
        }
    }

    div.innerHTML = `
        <div class="product-image-wrapper">
            ${discountBadge}
            ${productBadge}
            <a href="${detailLink}">
                <img src="${imgUrl}" alt="${product.title}">
            </a>
            <div class="product-quick-actions">
                <button class="action-icon wishlist" title="Adicionar aos favoritos" onclick="event.stopPropagation(); alert('Funcionalidade em breve!');">
                    <i class="far fa-heart"></i>
                </button>
                <button class="action-icon quick-view" title="Ver detalhes" onclick="event.stopPropagation(); window.location.href='${detailLink}';">
                    <i class="fas fa-eye"></i>
                </button>
                <button class="action-icon add-cart" title="Adicionar ao carrinho" onclick="event.stopPropagation(); addToCart({id:'${product.id}', title:'${product.title}', price:'${price}', image_url:'${imgUrl}'}, this);">
                    <i class="fas fa-shopping-cart"></i>
                </button>
                ${(window.siteSettings?.payment?.is_enabled) ?
            `<button class="action-icon buy-now" title="Pagar Agora" onclick="event.stopPropagation(); window.location.href='checkout.html?product=${product.id}'" style="background: #28a745; color: white;">
                    <i class="fas fa-credit-card"></i>
                </button>` : ''}
            </div>
        </div>
        <div class="product-card-info">
            <a href="${detailLink}" class="product-name">${product.title}</a>
            <div class="product-rating-compact">
                <span class="stars-compact">${starsHTML}</span>
                <span class="rating-value">${rating.toFixed(1)}</span>
            </div>
            <div class="product-price-compact">
                ${priceHTML}
            </div>
        </div>
    `;

    return div;
}

function truncateText(t, l) { return t && t.length > l ? t.substring(0, l) + '...' : t || ''; }

async function loadHeroCarousel() {
    const track = document.querySelector('.carousel-track1'), dots = document.querySelector('.dots');
    try {
        const { data: items, error } = await supabaseClient.from('carousel_items').select('*').order('display_order');
        if (!error && items && track) {
            track.innerHTML = ''; if (dots) dots.innerHTML = '';
            items.forEach((item, i) => {
                const card = document.createElement('div');
                card.className = 'card'; card.innerHTML = `<img src="${item.image_url}" alt="">`;
                track.appendChild(card);
                if (dots) { const dot = document.createElement('span'); dot.className = 'dot'; dots.appendChild(dot); }
            });
            if (typeof initializeCarousel === 'function') initializeCarousel();
        }
    } catch (e) { }
}

async function trackVisit() {
    if (!window.supabaseClient) return;
    const sessionKey = 'dv_sess_' + new Date().toISOString().split('T')[0];
    if (sessionStorage.getItem(sessionKey)) return;
    try {
        const ua = navigator.userAgent;
        let device = /Mobi|Android/i.test(ua) ? 'Mobile' : (/Tablet|iPad/i.test(ua) ? 'Tablet' : 'Desktop');
        let geoData = { country: 'Local', region: 'Unknown', city: 'Unknown' };
        try {
            const geoRes = await fetch('https://ipapi.co/json/').then(r => r.json());
            if (geoRes && geoRes.country_name) geoData = { country: geoRes.country_name, region: geoRes.region || geoRes.city, city: geoRes.city };
        } catch (e) { }
        await window.supabaseClient.from('page_visits').insert({
            page_url: window.location.pathname, user_agent: ua, device_type: device,
            browser: getBrowserName(ua), os: getOSName(ua),
            country: geoData.country, region: geoData.region, city: geoData.city
        });
        sessionStorage.setItem(sessionKey, 'true');
    } catch (e) { }
}

function getBrowserName(ua) {
    if (ua.includes('Chrome')) return 'Chrome'; if (ua.includes('Firefox')) return 'Firefox';
    if (ua.includes('Safari') && !ua.includes('Chrome')) return 'Safari'; return 'Other';
}

function getOSName(ua) {
    if (ua.includes('Windows')) return 'Windows'; if (ua.includes('Mac')) return 'MacOS';
    if (ua.includes('Android')) return 'Android'; if (ua.includes('iPhone')) return 'iOS'; return 'Other';
}
