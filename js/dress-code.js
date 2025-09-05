// JavaScript para la página de código de vestimenta - coherente con el codebase principal

document.addEventListener('DOMContentLoaded', function() {
    // Configuración
    const CONFIG = {
        COUPLE: "Daniel & Ana",
        WHATSAPP_PHONE: "573192672199", // sin +, con indicativo país
        RSVP_DEADLINE: "20 de octubre del 2025",
    };

    // Inicializar página
    initDressCodePage(CONFIG);
});

function initDressCodePage(config) {
    // Configurar elementos dinámicos
    setupDynamicContent(config);
    
    // Iniciar animaciones
    initAnimations();
    
    // Configurar WhatsApp
    setupWhatsApp(config);
    
    // Iniciar lluvia de sobres
    initEnvelopeRain();
}

function setupDynamicContent(config) {
    // Actualizar deadline
    const deadlineElement = document.querySelector('.rsvp-deadline');
    if (deadlineElement) {
        deadlineElement.textContent = config.RSVP_DEADLINE;
    }
    
    // Actualizar teléfono de contacto
    const phoneElement = document.getElementById('phoneDisplay');
    if (phoneElement) {
        phoneElement.textContent = config.DISPLAY_PHONE;
    }
}

function setupWhatsApp(config) {
    const whatsappLink = document.getElementById('whatsappLink');
    if (!whatsappLink) return;
    
    // Mensaje predefinido para WhatsApp
    const message = `Hola! Confirmo mi asistencia a la boda de ${config.COUPLE} 💒%0A%0APor favor, envíenme más detalles sobre:%0A• Ubicación exacta del evento%0A• Hora de llegada recomendada%0A• Información sobre el menú%0A• Datos para transferencia (si aplica)%0A%0A¡Muchas gracias! 🎉`;
    
    whatsappLink.href = `https://wa.me/${config.WHATSAPP_PHONE}?text=${message}`;
    whatsappLink.target = '_blank';
    whatsappLink.rel = 'noopener';
    
    // Agregar evento de tracking (opcional)
    whatsappLink.addEventListener('click', function() {
        console.log('WhatsApp RSVP clicked');
        // Aquí podrías agregar analytics si los usas
    });
}

function initAnimations() {
    // Animación de entrada para las cards
    const cards = document.querySelectorAll('.dress-code-grid .card');
    
    // Intersection Observer para animaciones al hacer scroll
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };
    
    const observer = new IntersectionObserver(function(entries) {
        entries.forEach((entry, index) => {
            if (entry.isIntersecting) {
                // Animar con delay progresivo
                setTimeout(() => {
                    entry.target.classList.add('animate-in');
                }, index * 200);
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);
    
    // Observar todas las cards
    cards.forEach(card => {
        observer.observe(card);
    });
}

function initEnvelopeRain() {
    const rainContainer = document.querySelector('.envelope-rain');
    if (!rainContainer) return;
    
    const ENVELOPE_COUNT = 15;
    const colors = [
        { fill: '#f4e4c1', stroke: '#c7a770' },
        { fill: '#e9d9b8', stroke: '#bfa06a' },
        { fill: '#ddd2a7', stroke: '#b8a676' },
        { fill: 'var(--sunflower)', stroke: 'var(--sunflower-center)' }
    ];
    
    // Crear sobres animados
    for (let i = 0; i < ENVELOPE_COUNT; i++) {
        createAnimatedEnvelope(rainContainer, colors, i);
    }
}

function createAnimatedEnvelope(container, colors, index) {
    const envelope = document.createElement('div');
    envelope.className = 'envelope-falling';
    
    // Posición y timing aleatorios
    envelope.style.left = (Math.random() * 90 + 5) + '%';
    envelope.style.animationDuration = (8 + Math.random() * 6) + 's';
    envelope.style.animationDelay = (Math.random() * -12) + 's';
    
    // Color aleatorio
    const colorSet = colors[Math.floor(Math.random() * colors.length)];
    
    // SVG del sobre
    envelope.innerHTML = `
        <svg width="36" height="26" viewBox="0 0 36 26" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
            <rect x="2" y="4" width="32" height="18" rx="3" fill="${colorSet.fill}" stroke="${colorSet.stroke}" stroke-width="1"/>
            <path d="M2 7 L18 16 L34 7" fill="none" stroke="${colorSet.stroke}" stroke-width="2" stroke-linecap="round"/>
            <circle cx="18" cy="13" r="2" fill="${colorSet.stroke}" opacity="0.5"/>
        </svg>
    `;
    
    container.appendChild(envelope);
}

// Funciones de utilidad para futuras mejoras
function addVisualEffects() {
    // Efecto parallax suave en desktop
    if (window.innerWidth > 768) {
        window.addEventListener('scroll', () => {
            const scrolled = window.pageYOffset;
            const envelopes = document.querySelectorAll('.envelope-falling');
            
            envelopes.forEach((envelope, index) => {
                const speed = 0.3 + (index * 0.1);
                const translateY = scrolled * speed;
                envelope.style.transform = `translateY(${translateY}px)`;
            });
        });
    }
}

function handleReducedMotion() {
    // Respetar preferencias de movimiento reducido
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    
    if (prefersReducedMotion) {
        // Deshabilitar animaciones complejas
        const rainContainer = document.querySelector('.envelope-rain');
        if (rainContainer) {
            rainContainer.style.display = 'none';
        }
        
        // Simplificar otras animaciones
        const style = document.createElement('style');
        style.textContent = `
            .dress-code-grid .card {
                opacity: 1 !important;
                transform: none !important;
            }
            .envelope-main-icon {
                animation: none !important;
            }
        `;
        document.head.appendChild(style);
    }
}

// Inicializar efectos adicionales cuando la página esté completamente cargada
window.addEventListener('load', function() {
    addVisualEffects();
    handleReducedMotion();
});

// Debugging/desarrollo - solo en desarrollo
if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    console.log('👰‍♀️ Dress Code Page loaded successfully!');
    console.log('📱 WhatsApp integration ready');
    console.log('💌 Envelope rain animation active');
}
