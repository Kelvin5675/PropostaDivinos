// ===== ABOUT PAGE JAVASCRIPT =====

// Language management
let currentLanguage = localStorage.getItem('ksbold_language') || 'pt';

// Animation observers
let countUpObserver;
let fadeInObserver;

// Initialize about page
document.addEventListener('DOMContentLoaded', function() {
    initializeAnimations();
    setupEventListeners();
    applyLanguage();
    initializeCounters();
});

// Setup event listeners
function setupEventListeners() {
    // Language toggle
    const langButtons = document.querySelectorAll('[data-lang]');
    langButtons.forEach(button => {
        button.addEventListener('click', function() {
            switchLanguage(this.dataset.lang);
        });
    });
    
    // Smooth scrolling for internal links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
    
    // Play button functionality (for future video integration)
    const playButton = document.querySelector('.play-button');
    if (playButton) {
        playButton.addEventListener('click', function() {
            // Future: Open video modal or redirect to video
            showNotification(currentLanguage === 'pt' ? 'Vídeo em breve!' : 'Video coming soon!');
        });
    }
}

// Initialize animations
function initializeAnimations() {
    // Intersection Observer for fade-in animations
    fadeInObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    });
    
    // Apply fade-in animation to sections
    const animatedElements = document.querySelectorAll('.mvv-card, .team-member, .timeline-item');
    animatedElements.forEach((el, index) => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(30px)';
        el.style.transition = `opacity 0.8s ease ${index * 0.1}s, transform 0.8s ease ${index * 0.1}s`;
        fadeInObserver.observe(el);
    });
    
    // Parallax effect for hero section
    window.addEventListener('scroll', () => {
        const scrolled = window.pageYOffset;
        const heroContent = document.querySelector('.hero-content');
        if (heroContent && scrolled < window.innerHeight) {
            heroContent.style.transform = `translateY(${scrolled * 0.5}px)`;
        }
    });
}

// Initialize counters
function initializeCounters() {
    const counters = document.querySelectorAll('.stat-number');
    
    const countUpObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const counter = entry.target;
                const target = parseInt(counter.dataset.target);
                animateCounter(counter, target);
                countUpObserver.unobserve(counter);
            }
        });
    }, {
        threshold: 0.5
    });
    
    counters.forEach(counter => {
        countUpObserver.observe(counter);
    });
}

// Animate counter
function animateCounter(element, target) {
    let current = 0;
    const increment = target / 100;
    const duration = 2000; // 2 seconds
    const stepTime = duration / 100;
    
    const timer = setInterval(() => {
        current += increment;
        if (current >= target) {
            current = target;
            clearInterval(timer);
        }
        
        // Add animation class
        element.style.animation = 'countUp 0.1s ease-out';
        element.textContent = Math.floor(current);
        
        // Remove animation class after animation
        setTimeout(() => {
            element.style.animation = '';
        }, 100);
    }, stepTime);
}

// Language switching
function switchLanguage(lang) {
    currentLanguage = lang;
    localStorage.setItem('ksbold_language', lang);
    applyLanguage();
    
    // Update current language display
    const currentLangElement = document.getElementById('current-lang');
    if (currentLangElement) {
        currentLangElement.textContent = lang.toUpperCase();
    }
    
    // Show language change notification
    showNotification(
        lang === 'pt' ? 'Idioma alterado para Português' : 'Language changed to English'
    );
}

// Apply language to page
function applyLanguage() {
    document.querySelectorAll('[data-pt]').forEach(element => {
        const text = currentLanguage === 'pt' ? element.dataset.pt : element.dataset.en;
        if (element.tagName === 'INPUT' && element.type === 'submit') {
            element.value = text;
        } else if (element.tagName === 'INPUT' && element.placeholder) {
            element.placeholder = text;
        } else {
            element.textContent = text;
        }
    });
    
    // Update page title
    document.title = currentLanguage === 'pt' ? 'Sobre Nós - KSBold' : 'About Us - KSBold';
    
    // Update HTML lang attribute
    document.documentElement.lang = currentLanguage;
}

// Show notification
function showNotification(message) {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.innerHTML = `
        <div class="notification-content">
            <i class="fas fa-info-circle"></i>
            <span>${message}</span>
        </div>
    `;
    
    // Add notification styles
    notification.style.cssText = `
        position: fixed;
        top: 100px;
        right: 20px;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        padding: 1rem 1.5rem;
        border-radius: 12px;
        box-shadow: 0 8px 25px rgba(102, 126, 234, 0.3);
        z-index: 10000;
        transform: translateX(400px);
        transition: transform 0.3s ease;
        font-weight: 600;
        max-width: 300px;
    `;
    
    document.body.appendChild(notification);
    
    // Animate in
    setTimeout(() => {
        notification.style.transform = 'translateX(0)';
    }, 100);
    
    // Animate out and remove
    setTimeout(() => {
        notification.style.transform = 'translateX(400px)';
        setTimeout(() => {
            if (document.body.contains(notification)) {
                document.body.removeChild(notification);
            }
        }, 300);
    }, 3000);
}

// Scroll reveal animation
function revealOnScroll() {
    const reveals = document.querySelectorAll('.reveal');
    
    reveals.forEach(reveal => {
        const windowHeight = window.innerHeight;
        const elementTop = reveal.getBoundingClientRect().top;
        const elementVisible = 150;
        
        if (elementTop < windowHeight - elementVisible) {
            reveal.classList.add('active');
        }
    });
}

// Add scroll event listener for reveal animations
window.addEventListener('scroll', revealOnScroll);

// Team member hover effects
document.addEventListener('DOMContentLoaded', function() {
    const teamMembers = document.querySelectorAll('.team-member');
    
    teamMembers.forEach(member => {
        member.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-10px) scale(1.02)';
        });
        
        member.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0) scale(1)';
        });
    });
});

// MVV Cards hover effects
document.addEventListener('DOMContentLoaded', function() {
    const mvvCards = document.querySelectorAll('.mvv-card');
    
    mvvCards.forEach(card => {
        card.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-15px) rotateY(5deg)';
            this.style.boxShadow = '0 25px 50px rgba(0, 0, 0, 0.2)';
        });
        
        card.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0) rotateY(0deg)';
            this.style.boxShadow = '0 10px 30px rgba(0, 0, 0, 0.1)';
        });
    });
});

// Timeline animation on scroll
function animateTimeline() {
    const timelineItems = document.querySelectorAll('.timeline-item');
    
    timelineItems.forEach((item, index) => {
        const rect = item.getBoundingClientRect();
        const isVisible = rect.top < window.innerHeight && rect.bottom > 0;
        
        if (isVisible) {
            setTimeout(() => {
                item.style.opacity = '1';
                item.style.transform = 'translateX(0)';
            }, index * 200);
        }
    });
}

// Initialize timeline animation
document.addEventListener('DOMContentLoaded', function() {
    const timelineItems = document.querySelectorAll('.timeline-item');
    
    timelineItems.forEach(item => {
        item.style.opacity = '0';
        item.style.transform = 'translateX(-50px)';
        item.style.transition = 'opacity 0.8s ease, transform 0.8s ease';
    });
    
    window.addEventListener('scroll', animateTimeline);
    animateTimeline(); // Run once on load
});

// Export functions for global access
window.switchLanguage = switchLanguage;
window.showNotification = showNotification;
