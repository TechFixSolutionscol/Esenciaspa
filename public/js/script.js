// Esencia Spa Website JavaScript
console.log('Esencia Spa Website Loaded Successfully');
console.log('Version: 1.0.0');
console.log('Location: Itagüí, Villa Paula');

// WhatsApp contact function
function openWhatsApp() {
    console.log('Opening WhatsApp chat');
    const message = encodeURIComponent('¡Hola! Me interesa conocer más sobre los servicios de Esencia Spa. ¿Podrían darme más información?');
    const phoneNumber = '573023946941'; // Replace with actual WhatsApp number
    const whatsappURL = `https://wa.me/${phoneNumber}?text=${message}`;
    window.open(whatsappURL, '_blank');
}

// Service booking function
function bookService(serviceName, servicePrice = '') {
    console.log(`Booking service: ${serviceName}`);

    // Guardar servicio seleccionado en sessionStorage para auto-completar formulario
    sessionStorage.setItem('selectedService', JSON.stringify({
        nombre: serviceName,
        precio: servicePrice
    }));

    // Redirigir a página de reservas
    window.location.href = 'reservar-cita.html';
}

// Product purchase function
function purchaseProduct(productName, productPrice = '') {
    console.log(`Purchasing product: ${productName}`);
    const priceText = productPrice ? ` (${productPrice})` : '';
    const message = encodeURIComponent(`¡Hola! Me interesa comprar el producto: ${productName}${priceText}. ¿Podrían darme más información sobre disponibilidad y entrega?`);
    const phoneNumber = '573023946941'; // Replace with actual WhatsApp number
    const whatsappURL = `https://wa.me/${phoneNumber}?text=${message}`;
    window.open(whatsappURL, '_blank');
}

// Free consultation function
function requestConsultation() {
    console.log('Requesting free consultation');
    const message = encodeURIComponent('¡Hola! Me interesa la valoración GRATUITA para tratamiento de quiropodia. ¿Cuándo pueden atenderme?');
    const phoneNumber = '573023946941'; // Replace with actual WhatsApp number
    const whatsappURL = `https://wa.me/${phoneNumber}?text=${message}`;
    window.open(whatsappURL, '_blank');
}

// Smooth scroll function
function smoothScrollTo(elementId) {
    const element = document.getElementById(elementId);
    if (element) {
        element.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
        });
    }
}

// Initialize page functionality
document.addEventListener('DOMContentLoaded', function () {
    console.log('DOM Content Loaded - Initializing features');

    // Service buttons event listeners
    const serviceButtons = document.querySelectorAll('.service-btn');
    serviceButtons.forEach(button => {
        button.addEventListener('click', function () {
            const serviceCard = this.closest('.service-card');
            const serviceName = serviceCard.querySelector('h4').textContent;
            const priceElement = serviceCard.querySelector('.price');
            const servicePrice = priceElement ? priceElement.textContent : '';

            // Special handling for consultation services
            if (this.textContent.includes('Valoración Gratuita')) {
                requestConsultation();
            } else {
                bookService(serviceName, servicePrice);
            }
        });
    });

    // Buy buttons event listeners
    const buyButtons = document.querySelectorAll('.buy-btn');
    buyButtons.forEach(button => {
        button.addEventListener('click', function () {
            const productCard = this.closest('.product-card');
            const productName = productCard.querySelector('h4').textContent;
            const priceElement = productCard.querySelector('.product-price');
            const productPrice = priceElement ? priceElement.textContent : '';

            purchaseProduct(productName, productPrice);
        });
    });

    // Additional service cards (if any)
    const additionalCards = document.querySelectorAll('.additional-card');
    additionalCards.forEach(card => {
        card.addEventListener('click', function () {
            const serviceName = this.querySelector('h5').textContent;
            const servicePrice = this.querySelector('.additional-price').textContent;
            bookService(serviceName, servicePrice);
        });
    });

    console.log(`Event listeners added: ${serviceButtons.length} service buttons, ${buyButtons.length} buy buttons`);

    // Add hover effects to cards
    const allCards = document.querySelectorAll('.service-card, .product-card');
    allCards.forEach(card => {
        card.addEventListener('mouseenter', function () {
            this.style.transform = 'translateY(-8px) scale(1.02)';
        });

        card.addEventListener('mouseleave', function () {
            this.style.transform = 'translateY(0) scale(1)';
        });
    });

    // Smooth scrolling for anchor links
    const anchorLinks = document.querySelectorAll('a[href^="#"]');
    anchorLinks.forEach(link => {
        link.addEventListener('click', function (e) {
            e.preventDefault();
            const targetId = this.getAttribute('href').substring(1);
            smoothScrollTo(targetId);
        });
    });

    // Lazy loading for images (future implementation)
    console.log('Image lazy loading ready for implementation');

    // Animation observer for cards on scroll
    if ('IntersectionObserver' in window) {
        const observer = new IntersectionObserver((entries) => {
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

        // Observe all cards
        allCards.forEach(card => {
            card.style.opacity = '0';
            card.style.transform = 'translateY(20px)';
            card.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
            observer.observe(card);
        });
    }
});

// WhatsApp floating button enhancement
document.addEventListener('DOMContentLoaded', function () {
    const whatsappButton = document.querySelector('.whatsapp-float');
    if (whatsappButton) {
        // Add click analytics
        whatsappButton.addEventListener('click', function () {
            console.log('WhatsApp button clicked');
            // Here you could add analytics tracking
            // gtag('event', 'whatsapp_click', { 'event_category': 'contact' });
        });

        // Add tooltip on hover (optional)
        whatsappButton.title = 'Chatea con nosotros por WhatsApp';
    }
});

// Form validation functions (for future forms)
function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

function validatePhone(phone) {
    const re = /^[\+]?[1-9][\d]{0,15}$/;
    return re.test(phone.replace(/\s/g, ''));
}

// Local storage functions (for future shopping cart)
function saveToStorage(key, value) {
    try {
        localStorage.setItem(key, JSON.stringify(value));
        console.log(`Saved to storage: ${key}`);
    } catch (error) {
        console.error('Error saving to storage:', error);
    }
}

function getFromStorage(key) {
    try {
        const item = localStorage.getItem(key);
        return item ? JSON.parse(item) : null;
    } catch (error) {
        console.error('Error reading from storage:', error);
        return null;
    }
}

// Shopping cart functionality (placeholder for future implementation)
const ShoppingCart = {
    items: [],

    add: function (item) {
        this.items.push(item);
        console.log('Item added to cart:', item);
        this.updateUI();
    },

    remove: function (itemId) {
        this.items = this.items.filter(item => item.id !== itemId);
        console.log('Item removed from cart:', itemId);
        this.updateUI();
    },

    getTotal: function () {
        return this.items.reduce((total, item) => total + (item.price * item.quantity), 0);
    },

    updateUI: function () {
        console.log('Cart updated:', this.items);
        // Future: Update cart UI elements
    }
};

// Appointment booking system (placeholder)
const AppointmentSystem = {
    availableSlots: [],

    checkAvailability: function (date) {
        console.log('Checking availability for:', date);
        // Future: Integrate with booking API
        return true;
    },

    bookAppointment: function (appointmentData) {
        console.log('Booking appointment:', appointmentData);
        // Future: Send to booking system
        return { success: true, confirmationId: 'ESP' + Date.now() };
    }
};

// Image gallery functionality (for future product images)
const ImageGallery = {
    currentIndex: 0,
    images: [],

    init: function (images) {
        this.images = images;
        console.log('Gallery initialized with', images.length, 'images');
    },

    next: function () {
        this.currentIndex = (this.currentIndex + 1) % this.images.length;
        this.updateDisplay();
    },

    prev: function () {
        this.currentIndex = (this.currentIndex - 1 + this.images.length) % this.images.length;
        this.updateDisplay();
    },

    updateDisplay: function () {
        console.log('Displaying image:', this.currentIndex);
        // Future: Update gallery UI
    }
};

// Search functionality (for future product/service search)
const SearchSystem = {
    searchTerms: [],

    search: function (query) {
        console.log('Searching for:', query);
        // Future: Implement search logic
        return [];
    },

    filter: function (items, criteria) {
        console.log('Filtering items by:', criteria);
        // Future: Implement filtering logic
        return items;
    }
};

// Analytics tracking (placeholder)
function trackEvent(eventName, eventData = {}) {
    console.log('Analytics Event:', eventName, eventData);
    // Future: Integrate with Google Analytics or similar
    // gtag('event', eventName, eventData);
}

// Error handling
window.addEventListener('error', function (e) {
    console.error('Website Error:', e.error);
    // Future: Send error reports to monitoring service
});

// Performance monitoring
window.addEventListener('load', function () {
    const loadTime = performance.now();
    console.log('Website loaded in:', Math.round(loadTime), 'ms');

    // Track loading performance
    trackEvent('page_load', {
        load_time: Math.round(loadTime),
        page: window.location.pathname
    });
});

// Ready state logging
console.log('Script initialization complete');
console.log('Ready for future implementations:');
console.log('✓ Shopping cart system');
console.log('✓ Appointment booking');
console.log('✓ Image galleries');
console.log('✓ Search and filtering');
console.log('✓ User authentication');
console.log('✓ Payment integration');
console.log('✓ Analytics tracking');
console.log('✓ Email notifications');
console.log('✓ Social media integration');
console.log('✓ Customer reviews system');