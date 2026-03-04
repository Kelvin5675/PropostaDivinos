/* =========================================
   CART LOGIC & ANIMATIONS
   ========================================= */

const CART_STORAGE_KEY = 'divinos_cart';
let cart = [];

// Initialize Cart on Load
document.addEventListener('DOMContentLoaded', () => {
    loadCart();
    renderCart();
    setupCartListeners();
});

function loadCart() {
    const saved = localStorage.getItem(CART_STORAGE_KEY);
    if (saved) {
        try {
            cart = JSON.parse(saved);
        } catch (e) {
            console.error("Erro ao carregar carrinho", e);
            cart = [];
        }
    }
}

function saveCart() {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
    renderCart(); // Re-render to update UI & badges
}

/* --- ADD TO CART (Logic + Animation) --- */
function addToCart(product, buttonElem) {
    // 1. Add to state
    const existing = cart.find(item => item.id === product.id);
    if (existing) {
        existing.qty++;
    } else {
        cart.push({ ...product, qty: 1 });
    }
    saveCart();

    // 2. Play Animation if button provided
    if (buttonElem) {
        animateDropToCart(buttonElem);
    }
}

/* --- ANIMATION: Water Drop Effect --- */
function animateDropToCart(startElem) {
    const cartIcon = document.querySelector('.cart-trigger');
    if (!cartIcon) return;

    // Create particle
    const particle = document.createElement('div');
    particle.classList.add('cart-particle');
    document.body.appendChild(particle);

    // Get positions
    const startRect = startElem.getBoundingClientRect();
    const endRect = cartIcon.getBoundingClientRect();

    // Start position (center of button)
    const startX = startRect.left + startRect.width / 2;
    const startY = startRect.top + startRect.height / 2;

    // End position (center of cart icon)
    const endX = endRect.left + endRect.width / 2;
    const endY = endRect.top + endRect.height / 2;

    // Set initial styles
    particle.style.left = `${startX}px`;
    particle.style.top = `${startY}px`;

    // Animate using Web Animations API
    const animation = particle.animate([
        { transform: `translate(0, 0) scale(1) rotate(-45deg)`, opacity: 1 },
        // Midpoint curve (Bezire-ish simulation via offsets)
        { transform: `translate(${endX - startX}px, ${endY - startY}px) scale(0.2) rotate(-45deg)`, opacity: 0.8 }
    ], {
        duration: 700,
        easing: 'cubic-bezier(0.175, 0.885, 0.32, 1.275)' // Bouncy/Elastic feel
    });

    animation.onfinish = () => {
        particle.remove();
        // Ripple/Bump effect on cart icon
        const badge = document.querySelector('.cart-count');
        if (badge) {
            badge.classList.remove('bump');
            void badge.offsetWidth; // trigger reflow
            badge.classList.add('bump');
        }
    };
}

/* --- RENDER UI --- */
function renderCart() {
    // 1. Update Badge
    const totalItems = cart.reduce((sum, item) => sum + item.qty, 0);
    const badge = document.getElementById('cart-count');
    if (badge) badge.innerText = totalItems;

    // 2. Render Items
    const container = document.getElementById('cart-items-container');
    const totalElem = document.getElementById('cart-total-value');

    if (!container) return; // Cart drawer not in DOM yet

    container.innerHTML = '';
    let totalPrice = 0;

    if (cart.length === 0) {
        container.innerHTML = `
            <div class="cart-empty-msg">
                <i class="fas fa-shopping-basket"></i>
                <p>Seu carrinho está vazio</p>
                <button onclick="toggleCart()" style="background:none; border:1px solid #ccc; padding:5px 15px; border-radius:4px; font-size:0.8rem; cursor:pointer;">Continuar comprando</button>
            </div>
        `;
    } else {
        cart.forEach((item, index) => {
            // Price parsing (assuming "500 MT")
            const priceNum = parseFloat(item.price.replace(/[^\d.,]/g, '').replace(',', '.')) || 0;
            totalPrice += priceNum * item.qty;

            const div = document.createElement('div');
            div.className = 'cart-item';
            div.innerHTML = `
                <img src="${item.image_url || 'images/placeholder-product.jpg'}" class="cart-item-img" alt="${item.title}">
                <div class="cart-item-info">
                    <div class="cart-item-title">${item.title}</div>
                    <div class="cart-item-price">${item.price}</div>
                </div>
                <div class="cart-item-controls">
                    <button class="remove-btn" onclick="removeItem(${index})"><i class="fas fa-trash"></i></button>
                    <div class="qty-controls">
                        <button class="qty-btn" onclick="updateQty(${index}, -1)">-</button>
                        <span class="qty-val">${item.qty}</span>
                        <button class="qty-btn" onclick="updateQty(${index}, 1)">+</button>
                    </div>
                </div>
            `;
            container.appendChild(div);
        });
    }

    if (totalElem) {
        totalElem.innerText = totalPrice.toLocaleString('pt-MZ', { style: 'currency', currency: 'MZN' });
    }
}

/* --- ACTIONS --- */
function updateQty(index, change) {
    if (cart[index]) {
        cart[index].qty += change;
        if (cart[index].qty <= 0) {
            cart.splice(index, 1);
        }
        saveCart();
    }
}

function removeItem(index) {
    cart.splice(index, 1);
    saveCart();
}

function clearCart() {
    cart = [];
    saveCart();
}

/* --- DRAWER CONTROLS --- */
function toggleCart() {
    const drawer = document.getElementById('cart-drawer');
    const overlay = document.getElementById('cart-overlay');
    if (drawer && overlay) {
        const isOpen = drawer.classList.toggle('open');
        overlay.classList.toggle('open');

        // Lock/Unlock body scroll
        if (isOpen) {
            document.body.style.overflow = 'hidden';
            // Add a small padding to prevent layout shift if scrollbar disappears
            document.body.style.paddingRight = '0px';
        } else {
            document.body.style.overflow = '';
            document.body.style.paddingRight = '';
        }
    }
}

function setupCartListeners() {
    const trigger = document.getElementById('cart-trigger');
    const closeBtn = document.getElementById('cart-close-btn');
    const overlay = document.getElementById('cart-overlay');

    if (trigger) trigger.addEventListener('click', toggleCart);
    if (closeBtn) closeBtn.addEventListener('click', toggleCart);
    if (overlay) overlay.addEventListener('click', toggleCart);
}

/* --- CHECKOUT WHATSAPP --- */
async function checkoutWhatsApp() {
    if (cart.length === 0) return;

    // Generate Order Code
    const orderCode = 'DVN' + new Date().getFullYear() + String(Math.floor(Math.random() * 10000)).padStart(4, '0');

    // Build Message
    let msg = `*Olá, Divinos Graffic! Gostaria de fazer um pedido pelo site:*\n\n`;
    msg += `📋 *Pedido: ${orderCode}*\n\n`;
    let total = 0;

    const orderItems = cart.map(item => {
        const priceNum = parseFloat(String(item.price).replace(/[^\d.,]/g, '').replace(',', '.')) || 0;
        const subtotal = priceNum * item.qty;
        total += subtotal;

        msg += `📦 *${item.qty}x ${item.title}*\n`;
        msg += `   Preço: ${item.price} (Sub: ${subtotal.toLocaleString('pt-MZ', { style: 'currency', currency: 'MZN' })})\n`;
        if (item.size) msg += `   Tamanho: ${item.size}\n`;
        msg += `\n`;

        return {
            product_id: item.id,
            title: item.title,
            price: priceNum,
            quantity: item.qty,
            size: item.size || null,
            image_url: item.image_url || null
        };
    });

    msg += `---------------------------------\n`;
    msg += `💰 *TOTAL ESTIMADO: ${total.toLocaleString('pt-MZ', { style: 'currency', currency: 'MZN' })}*\n`;
    msg += `\n📝 *Aguardo confirmação e dados para pagamento.*`;

    // Save order to Supabase
    try {
        console.log('Tentando salvar pedido do carrinho:', orderCode);
        console.log('Itens do pedido:', orderItems);

        if (window.supabaseClient) {
            const { data, error } = await window.supabaseClient.from('orders').insert({
                order_code: orderCode,
                items: orderItems,
                total: total,
                channel: 'whatsapp',
                status: 'pendente',
                client_id: localStorage.getItem('divinos_client_id') || null
            });

            if (error) {
                console.error('Erro ao salvar no Supabase (Carrinho):', error);
                alert('Aviso: O pedido será enviado via WhatsApp, mas não pôde ser registrado no sistema. (Erro: ' + error.message + '). Verifique se a tabela "orders" foi criada no Supabase.');
                throw error;
            }
            console.log('Pedido do carrinho salvo com sucesso:', orderCode);
        } else {
            console.warn('supabaseClient não encontrado para salvar pedido do carrinho');
        }
    } catch (e) {
        console.warn('Erro ao salvar pedido (continuando com WhatsApp):', e);
    }

    // Send via WhatsApp
    const phone = "258848800311";
    const url = `https://wa.me/${phone}?text=${encodeURIComponent(msg)}`;
    window.open(url, '_blank');

    // Clear cart after order
    clearCart();
}
