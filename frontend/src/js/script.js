// ===== GLOBAL VARIABLES =====
let currentLanguage = 'pt';
let isScrolling = false;

// ===== PRELOADER UTILITY (Define Early) =====
function hidePreloader() {
    const preloader = document.getElementById('preloader');
    if (preloader) {
        if (preloader.classList.contains('fade-out')) return;
        preloader.classList.add('fade-out');
        setTimeout(() => {
            preloader.style.display = 'none';
            document.body.classList.remove('loading');
        }, 800);
    } else {
        document.body.classList.remove('loading');
    }
}
window.hidePreloader = hidePreloader;

// ===== GLOBAL FILTER STATE =====
window.applyProductFilters = function () {
    // Stub to be replaced by initializeSearch
    console.log("Filters not yet initialized");
};

// ===== PRODUCT SEARCH =====
function initializeSearch() {
    let searchInput = document.getElementById('product-search');
    let clearBtn = document.getElementById('clear-search');
    let productsGrid = document.querySelector('.products-grid');

    // Function that does the actual work
    const applyFilters = () => {
        // Re-find elements if they were replaced or lost
        if (!searchInput) searchInput = document.getElementById('product-search');
        if (!productsGrid) productsGrid = document.querySelector('.products-grid');
        if (!clearBtn) clearBtn = document.getElementById('clear-search');

        if (!searchInput || !productsGrid) return;

        const query = searchInput.value.toLowerCase().trim();
        const activeBtn = document.querySelector('.filter-btn.active');
        const activeCategory = activeBtn ? (activeBtn.dataset.filter || 'all') : 'all';

        const cards = productsGrid.querySelectorAll('.product-card, .gallery-item');
        let hasResults = false;

        cards.forEach(card => {
            if (card.classList.contains('no-results-msg')) return;

            const title = (card.querySelector('.product-name')?.innerText || card.querySelector('h3')?.innerText || '').toLowerCase();
            const desc = (card.querySelector('.product-card-info')?.innerText || card.querySelector('p')?.innerText || '').toLowerCase();
            const category = (card.dataset.category || '').toLowerCase();

            const matchesSearch = query === '' || title.includes(query) || desc.includes(query);
            const matchesCategory = activeCategory === 'all' || category === activeCategory.toLowerCase();

            if (matchesSearch && matchesCategory) {
                card.style.display = 'block';
                // Trigger animation if hidden
                if (card.style.opacity === '0') {
                    setTimeout(() => card.style.opacity = '1', 10);
                } else {
                    card.style.opacity = '1';
                }
                hasResults = true;
            } else {
                card.style.display = 'none';
                card.style.opacity = '0';
            }
        });

        // Manage No Results message
        let noResultsMsg = productsGrid.querySelector('.no-results-msg');
        if (!hasResults && query !== '') {
            if (!noResultsMsg) {
                noResultsMsg = document.createElement('div');
                noResultsMsg.className = 'no-results-msg';
                noResultsMsg.innerHTML = `
                    <i class="fas fa-search" style="font-size: 3rem; color: #ccc; margin-bottom: 1rem;"></i>
                    <h3 style="font-size: 1.5rem; color: #333;">Nenhum produto encontrado</h3>
                    <p style="color: #666;">Tente ajustar sua pesquisa ou trocar a categoria.</p>
                `;
                noResultsMsg.style.cssText = 'grid-column: 1 / -1; text-align: center; padding: 4rem 2rem; width: 100%;';
                productsGrid.appendChild(noResultsMsg);
            }
            noResultsMsg.style.display = 'block';
        } else if (noResultsMsg) {
            noResultsMsg.style.display = 'none';
        }

        // Toggle clear button
        if (clearBtn) {
            if (query.length > 0) {
                clearBtn.classList.add('visible');
                clearBtn.style.opacity = '1';
                clearBtn.style.pointerEvents = 'all';
            } else {
                clearBtn.classList.remove('visible');
                clearBtn.style.opacity = '0';
                clearBtn.style.pointerEvents = 'none';
            }
        }
    };

    // Assign to global
    window.applyProductFilters = applyFilters;

    if (searchInput) {
        // Multi-event support for mobile compatibility
        ['input', 'keyup', 'change', 'search'].forEach(evt => {
            searchInput.addEventListener(evt, applyFilters);
        });

        searchInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                applyFilters();
                searchInput.blur(); // Hide keyboard on mobile
            }
        });
    }

    if (clearBtn) {
        clearBtn.addEventListener('click', () => {
            if (searchInput) {
                searchInput.value = '';
                applyFilters();
                searchInput.focus();
            }
        });
    }

    // Initial run
    applyFilters();
}

// ===== DOM CONTENT LOADED =====
document.addEventListener('DOMContentLoaded', function () {
    initializeWebsite();
});

// ===== INITIALIZE WEBSITE =====
function initializeWebsite() {
    // Initialize all components
    initializeNavigation();
    initializeLanguageSelector();
    initializeScrollAnimations();
    initializeCarousel();
    initializeForms();
    initializeSearch();
    initializeProductFilters();
    initializeGallery();
    initializeTracking();
    initializeReviews();
    initializeScrollEffects();

    // Add loading animation if no preloader
    if (!document.getElementById('preloader')) {
        document.body.classList.add('loading');
    }

    // Fail-safe: Hide preloader after 5 seconds if still stuck
    setTimeout(() => {
        const preloader = document.getElementById('preloader');
        if (preloader && !preloader.classList.contains('fade-out')) {
            console.warn("Preloader stuck for too long. Forcing hide...");
            if (typeof hidePreloader === 'function') {
                hidePreloader();
            } else {
                preloader.style.display = 'none';
            }
        }
    }, 5000);

    // Initialize language
    const savedLanguage = localStorage.getItem('preferred-language') || currentLanguage;
    setLanguage(savedLanguage);
    const currentLangSpan = document.getElementById('current-lang');
    if (currentLangSpan) {
        currentLangSpan.textContent = savedLanguage.toUpperCase();
    }
}

// ===== NAVIGATION =====
function initializeNavigation() {
    const hamburger = document.getElementById('hamburger');
    const navMenu = document.getElementById('nav-menu');
    const header = document.querySelector('.header');

    // Hamburger menu toggle
    if (hamburger && navMenu) {
        hamburger.addEventListener('click', function () {
            hamburger.classList.toggle('active');
            navMenu.classList.toggle('active');
        });

        // Close menu when clicking on links
        const navLinks = document.querySelectorAll('.nav-link');
        navLinks.forEach(link => {
            link.addEventListener('click', function () {
                hamburger.classList.remove('active');
                navMenu.classList.remove('active');
            });
        });
    }

    // Header scroll effect
    if (header) {
        window.addEventListener('scroll', function () {
            if (window.scrollY > 100) {
                header.classList.add('scrolled');
            } else {
                header.classList.remove('scrolled');
            }
        });
    }

    // Smooth scrolling for anchor links
    const anchorLinks = document.querySelectorAll('a[href^="#"]');
    anchorLinks.forEach(link => {
        link.addEventListener('click', function (e) {
            e.preventDefault();
            const targetId = this.getAttribute('href').substring(1);
            const targetElement = document.getElementById(targetId);

            if (targetElement) {
                const headerHeight = header ? header.offsetHeight : 0;
                const targetPosition = targetElement.offsetTop - headerHeight;

                window.scrollTo({
                    top: targetPosition,
                    behavior: 'smooth'
                });
            }
        });
    });
}

// ===== LANGUAGE SELECTOR =====
function initializeLanguageSelector() {
    const langToggle = document.getElementById('lang-toggle');
    const langDropdown = document.getElementById('lang-dropdown');
    const currentLangSpan = document.getElementById('current-lang');

    if (langToggle && langDropdown) {
        // Toggle dropdown
        langToggle.addEventListener('click', function (e) {
            e.stopPropagation();
            langDropdown.classList.toggle('active');
        });

        // Close dropdown when clicking outside
        document.addEventListener('click', function () {
            langDropdown.classList.remove('active');
        });

        // Language selection
        const langButtons = langDropdown.querySelectorAll('button[data-lang]');
        langButtons.forEach(button => {
            button.addEventListener('click', function () {
                const selectedLang = this.getAttribute('data-lang');
                setLanguage(selectedLang);
                langDropdown.classList.remove('active');

                // Update current language display
                if (currentLangSpan) {
                    currentLangSpan.textContent = selectedLang.toUpperCase();
                }
            });
        });
    }
}

// ===== LANGUAGE SWITCHING =====
function setLanguage(lang) {
    currentLanguage = lang;

    // Update all elements with data attributes
    const elements = document.querySelectorAll('[data-pt][data-en]');
    elements.forEach(element => {
        const text = element.getAttribute(`data-${lang}`);
        if (text) {
            if (element.tagName === 'INPUT' && element.type === 'submit') {
                element.value = text;
            } else if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA') {
                element.placeholder = text;
            } else {
                element.textContent = text;
            }
        }
    });

    // Update document language
    document.documentElement.lang = lang;

    // Store language preference
    localStorage.setItem('preferred-language', lang);
}

// ===== SCROLL ANIMATIONS =====
let globalScrollObserver;

function initializeScrollAnimations() {
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    globalScrollObserver = new IntersectionObserver(function (entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
            }
        });
    }, observerOptions);

    // Initial observation
    observeNewElements('.service-card, .team-card, .product-card, .gallery-item, .review-item');
}

function observeNewElements(selectorOrElements) {
    if (!globalScrollObserver) return;

    const elements = typeof selectorOrElements === 'string'
        ? document.querySelectorAll(selectorOrElements)
        : selectorOrElements;

    elements.forEach(element => {
        if (!element.classList.contains('visible')) {
            element.classList.add('fade-in');
            globalScrollObserver.observe(element);
        }
    });
}

// Global exposure
window.observeNewElements = observeNewElements;

// ===== PRELOADER =====
function hidePreloader() {
    const preloader = document.getElementById('preloader');
    if (preloader) {
        if (preloader.classList.contains('fade-out')) return; // Already hiding

        preloader.classList.add('fade-out');
        setTimeout(() => {
            preloader.style.display = 'none';
            document.body.classList.remove('loading');
        }, 800);
    } else {
        document.body.classList.remove('loading');
    }
}
window.hidePreloader = hidePreloader;
window.observeNewElements = observeNewElements;

// ===== CAROUSEL =====
function initializeCarousel() {
    const cards = document.querySelectorAll(".card");
    const dots = document.querySelectorAll(".dot");
    const memberName = document.querySelector(".member-name");
    const memberRole = document.querySelector(".member-role");
    const leftArrow = document.querySelector(".nav-arrow.left");
    const rightArrow = document.querySelector(".nav-arrow.right");

    if (cards.length === 0) return;

    let currentIndex = 0;
    let autoplayInterval;

    function updateCarousel(index) {
        if (cards.length === 0) return;

        // Handle wrap around
        if (index < 0) index = cards.length - 1;
        if (index >= cards.length) index = 0;

        currentIndex = index;

        cards.forEach((card, i) => {
            card.classList.remove("center", "left-1", "right-1", "left-2", "right-2", "hidden");

            const offset = i - currentIndex;
            const absOffset = Math.abs(offset);

            if (offset === 0) {
                card.classList.add("center");
            } else if (offset === -1 || (currentIndex === 0 && i === cards.length - 1)) {
                card.classList.add("left-1");
            } else if (offset === 1 || (currentIndex === cards.length - 1 && i === 0)) {
                card.classList.add("right-1");
            } else if (offset === -2 || (currentIndex === 1 && i === cards.length - 1) || (currentIndex === 0 && i === cards.length - 2)) {
                card.classList.add("left-2");
            } else if (offset === 2 || (currentIndex === cards.length - 2 && i === 0) || (currentIndex === cards.length - 1 && i === 1)) {
                card.classList.add("right-2");
            } else {
                card.classList.add("hidden");
            }
        });

        // Update dots
        if (dots.length > 0) {
            dots.forEach((dot, i) => {
                dot.classList.toggle("active", i === currentIndex);
            });
        }

        /* Removed title/subtitle per user request
        const activeCard = cards[currentIndex];
        if (activeCard) {
            if (memberName) memberName.textContent = activeCard.dataset.name || "";
            if (memberRole) memberRole.textContent = activeCard.dataset.role || "";
        }
        */
    }

    function startAutoplay() {
        stopAutoplay();
        autoplayInterval = setInterval(() => {
            updateCarousel(currentIndex + 1);
        }, 4000);
    }

    function stopAutoplay() {
        if (autoplayInterval) clearInterval(autoplayInterval);
    }

    // Event Listeners
    if (leftArrow) leftArrow.onclick = () => { updateCarousel(currentIndex - 1); startAutoplay(); };
    if (rightArrow) rightArrow.onclick = () => { updateCarousel(currentIndex + 1); startAutoplay(); };

    if (dots.length > 0) {
        dots.forEach((dot, i) => {
            dot.onclick = () => { updateCarousel(i); startAutoplay(); };
        });
    }

    const container = document.querySelector(".carousel-container1");
    if (container) {
        container.onmouseenter = stopAutoplay;
        container.onmouseleave = startAutoplay;
    }

    // Initial call
    updateCarousel(0);
    startAutoplay();

    // Global exposure if needed
    window.updateHeroCarousel = updateCarousel;
}

// ===== FORMS =====
function initializeForms() {
    // Contact form
    const contactForm = document.getElementById('contact-form');
    if (contactForm) {
        contactForm.addEventListener('submit', function (e) {
            e.preventDefault();
            handleContactForm(this);
        });
    }

    // Order form
    const orderForm = document.getElementById('order-form');
    if (orderForm) {
        orderForm.addEventListener('submit', function (e) {
            e.preventDefault();
            handleOrderForm(this);
        });
    }

    // Review form
    const reviewForm = document.getElementById('review-form');
    if (reviewForm) {
        reviewForm.addEventListener('submit', function (e) {
            e.preventDefault();
            handleReviewForm(this);
        });
    }

    // Tracking form
    const trackingForm = document.getElementById('tracking-form');
    if (trackingForm) {
        trackingForm.addEventListener('submit', function (e) {
            e.preventDefault();
            handleTrackingForm(this);
        });
    }
}

// ===== FORM HANDLERS =====
function handleContactForm(form) {
    const formData = new FormData(form);
    const data = Object.fromEntries(formData);

    // Show loading state
    const submitBtn = form.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Enviando...';
    submitBtn.disabled = true;

    // Simulate form submission
    setTimeout(() => {
        showNotification('Mensagem enviada com sucesso! Entraremos em contato em breve.', 'success');
        form.reset();
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
    }, 2000);
}

function handleOrderForm(form) {
    const formData = new FormData(form);
    const data = Object.fromEntries(formData);

    // Show loading state
    const submitBtn = form.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processando...';
    submitBtn.disabled = true;

    // Simulate order processing
    setTimeout(() => {
        const orderCode = 'KSB' + new Date().getFullYear() + String(Math.floor(Math.random() * 1000)).padStart(3, '0');
        showNotification(`Pedido realizado com sucesso! Código de rastreio: ${orderCode}`, 'success');
        form.reset();
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
    }, 3000);
}

function handleReviewForm(form) {
    const formData = new FormData(form);
    const data = Object.fromEntries(formData);

    // Show loading state
    const submitBtn = form.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Enviando...';
    submitBtn.disabled = true;

    // Simulate review submission
    setTimeout(() => {
        showNotification('Avaliação enviada com sucesso! Obrigado pelo seu feedback.', 'success');
        form.reset();

        // Reset rating stars
        const ratingInputs = form.querySelectorAll('input[name="rating"]');
        ratingInputs.forEach(input => input.checked = false);

        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
    }, 2000);
}

function handleTrackingForm(form) {
    const formData = new FormData(form);
    const trackingCode = formData.get('tracking-code');

    // Show loading state
    const submitBtn = form.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Buscando...';
    submitBtn.disabled = true;

    // Simulate tracking lookup
    setTimeout(() => {
        if (trackingCode && trackingCode.toLowerCase().includes('ksb')) {
            showTrackingResults(trackingCode);
        } else {
            showNoResults();
        }

        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
    }, 2000);
}

// ===== PRODUCT FILTERS =====
function initializeProductFilters() {
    const filterButtons = document.querySelectorAll('.filter-btn');
    if (!filterButtons.length) return;

    filterButtons.forEach(button => {
        button.addEventListener('click', function () {
            // Update active button
            filterButtons.forEach(btn => btn.classList.remove('active'));
            this.classList.add('active');

            // Trigger search filter to apply both category and search
            if (window.applyProductFilters) {
                window.applyProductFilters();
            }
        });
    });
}

// ===== GALLERY =====
function initializeGallery() {
    const lightbox = document.getElementById('lightbox');
    const lightboxImage = document.getElementById('lightbox-image');
    const lightboxClose = document.querySelector('.lightbox-close');

    if (lightbox && lightboxImage && lightboxClose) {
        // Close lightbox
        lightboxClose.addEventListener('click', closeLightbox);
        lightbox.addEventListener('click', function (e) {
            if (e.target === lightbox) {
                closeLightbox();
            }
        });

        // ESC key to close
        document.addEventListener('keydown', function (e) {
            if (e.key === 'Escape' && lightbox.classList.contains('active')) {
                closeLightbox();
            }
        });
    }
}

function openLightbox(imageSrc) {
    const lightbox = document.getElementById('lightbox');
    const lightboxImage = document.getElementById('lightbox-image');

    if (lightbox && lightboxImage) {
        lightboxImage.src = imageSrc;
        lightbox.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
}

function closeLightbox() {
    const lightbox = document.getElementById('lightbox');

    if (lightbox) {
        lightbox.classList.remove('active');
        document.body.style.overflow = '';
    }
}

// ===== TRACKING =====
function initializeTracking() {
    // This function is called when the page loads
    // The actual tracking form handling is in initializeForms()
}

function showTrackingResults(trackingCode) {
    const trackingResults = document.getElementById('tracking-results');
    const noResults = document.getElementById('no-results');

    if (trackingResults) {
        // Update order code in the results
        const orderCodeElement = document.getElementById('order-code');
        if (orderCodeElement) {
            orderCodeElement.textContent = trackingCode;
        }

        trackingResults.style.display = 'block';
        if (noResults) noResults.style.display = 'none';

        // Scroll to results
        trackingResults.scrollIntoView({ behavior: 'smooth' });
    }
}

function showNoResults() {
    const trackingResults = document.getElementById('tracking-results');
    const noResults = document.getElementById('no-results');

    if (noResults) {
        noResults.style.display = 'block';
        if (trackingResults) trackingResults.style.display = 'none';

        // Scroll to no results
        noResults.scrollIntoView({ behavior: 'smooth' });
    }
}

// ===== REVIEWS =====
function initializeReviews() {
    // Rating stars interaction
    const ratingInputs = document.querySelectorAll('.rating-input input');
    const ratingLabels = document.querySelectorAll('.rating-input label');

    ratingLabels.forEach((label, index) => {
        label.addEventListener('mouseenter', function () {
            highlightStars(index);
        });

        label.addEventListener('mouseleave', function () {
            resetStars();
        });

        label.addEventListener('click', function () {
            const input = this.previousElementSibling;
            if (input) {
                input.checked = true;
                highlightStars(index);
            }
        });
    });

    function highlightStars(index) {
        ratingLabels.forEach((label, i) => {
            if (i >= index) {
                label.style.color = '#ffc107';
            } else {
                label.style.color = '#ddd';
            }
        });
    }

    function resetStars() {
        const checkedInput = document.querySelector('.rating-input input:checked');
        if (checkedInput) {
            const checkedIndex = Array.from(ratingInputs).indexOf(checkedInput);
            highlightStars(checkedIndex);
        } else {
            ratingLabels.forEach(label => {
                label.style.color = '#ddd';
            });
        }
    }
}

// ===== PRODUCT DETAIL =====
// Product Detail functions moved to product-detail.js and cart.js
// Kept empty to prevent reference errors if called from old HTML
function changeMainImage(thumbnail) {
    // Moved to product-detail.js
}

function increaseQuantity() {
    // Moved to product-detail.js
}

function decreaseQuantity() {
    // Moved to product-detail.js
}

function addToCart() {
    // Moved to cart.js
}

// ===== SCROLL EFFECTS =====
function initializeScrollEffects() {
    let ticking = false;

    function updateScrollEffects() {
        const scrolled = window.pageYOffset;
        const parallaxElements = document.querySelectorAll('.hero');

        parallaxElements.forEach(element => {
            const speed = 0.5;
            const yPos = -(scrolled * speed);
            element.style.transform = `translateY(${yPos}px)`;
        });

        ticking = false;
    }

    function requestTick() {
        if (!ticking) {
            requestAnimationFrame(updateScrollEffects);
            ticking = true;
        }
    }

    window.addEventListener('scroll', requestTick);
}

// ===== NOTIFICATIONS =====
function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
            <span>${message}</span>
        </div>
        <button class="notification-close">&times;</button>
    `;

    // Add styles
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === 'success' ? '#4caf50' : type === 'error' ? '#f44336' : '#2196f3'};
        color: white;
        padding: 1rem 1.5rem;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        z-index: 10000;
        transform: translateX(100%);
        transition: transform 0.3s ease;
        max-width: 400px;
        word-wrap: break-word;
    `;

    // Add to page
    document.body.appendChild(notification);

    // Animate in
    setTimeout(() => {
        notification.style.transform = 'translateX(0)';
    }, 100);

    // Close button
    const closeBtn = notification.querySelector('.notification-close');
    closeBtn.addEventListener('click', () => {
        removeNotification(notification);
    });

    // Auto remove after 5 seconds
    setTimeout(() => {
        removeNotification(notification);
    }, 5000);
}

function removeNotification(notification) {
    notification.style.transform = 'translateX(100%)';
    setTimeout(() => {
        if (notification.parentNode) {
            notification.parentNode.removeChild(notification);
        }
    }, 300);
}

// ===== UTILITY FUNCTIONS =====
function debounce(func, wait, immediate) {
    let timeout;
    return function executedFunction() {
        const context = this;
        const args = arguments;
        const later = function () {
            timeout = null;
            if (!immediate) func.apply(context, args);
        };
        const callNow = immediate && !timeout;
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
        if (callNow) func.apply(context, args);
    };
}

function throttle(func, limit) {
    let inThrottle;
    return function () {
        const args = arguments;
        const context = this;
        if (!inThrottle) {
            func.apply(context, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    }
}

// ===== PERFORMANCE OPTIMIZATIONS =====
// Lazy loading for images
function initializeLazyLoading() {
    const images = document.querySelectorAll('img[data-src]');

    const imageObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target;
                img.src = img.dataset.src;
                img.classList.remove('lazy');
                imageObserver.unobserve(img);
            }
        });
    });

    images.forEach(img => imageObserver.observe(img));
}

// ===== ERROR HANDLING =====
window.addEventListener('error', function (e) {
    console.error('JavaScript Error:', e.error);
    // You could send this to an error tracking service
});

// ===== ACCESSIBILITY =====
function initializeAccessibility() {
    // Skip link removed - not needed for this site
    /*
    const skipLink = document.createElement('a');
    skipLink.href = '#main';
    skipLink.textContent = 'Skip to main content';
    skipLink.className = 'skip-link';
    skipLink.style.cssText = `
        position: absolute;
        top: -40px;
        left: 6px;
        background: #000;
        color: #fff;
        padding: 8px;
        text-decoration: none;
        z-index: 10000;
        transition: top 0.3s;
    `;

    skipLink.addEventListener('focus', function () {
        this.style.top = '6px';
    });

    skipLink.addEventListener('blur', function () {
        this.style.top = '-40px';
    });

    document.body.insertBefore(skipLink, document.body.firstChild);
    */

    // Keyboard navigation for custom elements
    const customButtons = document.querySelectorAll('.btn, .filter-btn, .gallery-btn');
    customButtons.forEach(button => {
        button.addEventListener('keydown', function (e) {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                this.click();
            }
        });
    });
}

// Language preference is already handled in initializeWebsite or setLanguage
// Service worker is below

// ===== SERVICE WORKER REGISTRATION =====
/* 
if ('serviceWorker' in navigator) {
    window.addEventListener('load', function () {
        navigator.serviceWorker.register('/sw.js')
            .then(function (registration) {
                console.log('ServiceWorker registration successful');
            })
            .catch(function (err) {
                console.log('ServiceWorker registration failed');
            });
    });
}
*/



// ==================== CARROSSEL PRINCIPAL (DEPRECATED IN FAVOR OF INITIALIZECAROUSEL) ====================
// Moving card initialization to initializeCarousel function


// ==================== CARROSSEL DE PORTFÓLIO ====================
const portfolioTrack = document.querySelector(".portfolio-track");
const prevBtn = document.querySelector(".carousel-nav.prev");
const nextBtn = document.querySelector(".carousel-nav.next");

if (portfolioTrack && prevBtn && nextBtn) {
    prevBtn.addEventListener("click", () => {
        portfolioTrack.scrollBy({
            left: -320,
            behavior: "smooth"
        });
    });

    nextBtn.addEventListener("click", () => {
        portfolioTrack.scrollBy({
            left: 320,
            behavior: "smooth"
        });
    });
}

// ==================== SCROLL REVEAL ====================
const observerOptions = {
    threshold: 0.1,
    rootMargin: "0px 0px -100px 0px"
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add("active");
        }
    });
}, observerOptions);

// Aplicar scroll reveal aos elementos
document.querySelectorAll(".about-card").forEach(card => {
    card.classList.add("scroll-reveal");
    observer.observe(card);
});

document.querySelectorAll(".gallery-item").forEach(item => {
    item.classList.add("scroll-reveal");
    observer.observe(item);
});

// ==================== NAVBAR MOBILE ====================
const hamburger = document.querySelector(".hamburger");
const navMenu = document.querySelector(".navbar-menu");

hamburger.addEventListener("click", () => {
    navMenu.classList.toggle("active");
    hamburger.classList.toggle("active");
});

// Fechar menu ao clicar em um link
document.querySelectorAll(".nav-link").forEach(link => {
    link.addEventListener("click", () => {
        navMenu.classList.remove("active");
        hamburger.classList.remove("active");
    });
});

// ==================== SMOOTH SCROLL ====================
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener("click", function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute("href"));
        if (target) {
            target.scrollIntoView({
                behavior: "smooth",
                block: "start"
            });
        }
    });
});
// ==================== PRODUCT MODAL ====================
function openModal(btn) {
    if (!btn) return;

    const nome = btn.dataset.nome;
    const preco = btn.dataset.preco;
    const descricao = btn.dataset.descricao;
    const galleryString = btn.dataset.gallery || "";
    const imagens = galleryString ? galleryString.split("|") : ["images/placeholder.jpg"];
    const whatsapp = btn.dataset.whatsapp;

    // Elements
    const modalNome = document.getElementById("modalNome");
    const modalPreco = document.getElementById("modalPreco");
    const modalDescricao = document.getElementById("modalDescricao");
    const modalWhatsapp = document.getElementById("modalWhatsapp");
    const mainImage = document.getElementById("modalMainImage");
    const thumbs = document.getElementById("modalThumbs");
    const modal = document.getElementById("productModal");

    if (!modal) return;

    // Populate Texto
    if (modalNome) modalNome.textContent = nome;
    if (modalPreco) modalPreco.textContent = preco + (preco && !preco.toLowerCase().includes('mt') ? ' MT' : '');
    if (modalDescricao) modalDescricao.innerHTML = descricao;
    if (modalWhatsapp) modalWhatsapp.href = whatsapp;

    // Main Image
    if (mainImage) mainImage.src = imagens[0];

    // Thumbnails
    if (thumbs) {
        thumbs.innerHTML = "";
        if (imagens.length > 1) {
            imagens.forEach(img => {
                const thumb = document.createElement("img");
                thumb.src = img;
                thumb.style.cursor = "pointer";
                thumb.onclick = () => {
                    mainImage.src = img;
                };
                thumbs.appendChild(thumb);
            });
            thumbs.style.display = "flex";
        } else {
            thumbs.style.display = "none";
        }
    }

    // Show modal
    modal.style.display = "flex";
    document.body.style.overflow = "hidden"; // Lock scroll
}

function closeModal() {
    const modal = document.getElementById("productModal");
    if (modal) {
        modal.style.display = "none";
        document.body.style.overflow = ""; // Unlock scroll
    }
}

// Global exposure
window.openModal = openModal;
window.closeModal = closeModal;

// Chamar inicialização no final do arquivo
document.addEventListener('DOMContentLoaded', () => {
    initializeScrollAnimations();
    initializeSearch();
    initializeCarousel();
    initializeForms();
    initializeGallery();
    initializeAccessibility();
});
