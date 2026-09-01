/**
 * Professional Scroll Reveal Engine
 * High-performance IntersectionObserver with auto-staggering
 */
document.addEventListener('DOMContentLoaded', () => {
    // 1. Auto-tag elements that should reveal on scroll
    const autoRevealConfig = [
        { selector: '.shortener-section .container', effect: 'reveal-zoom', delay: '' },
        { selector: '.features-heading', effect: 'reveal-up', delay: '' },
        { selector: '.features-grid .feature-card', effect: 'reveal-up', stagger: true },
        { selector: '.pricing-heading', effect: 'reveal-up', delay: '' },
        { selector: '.pricing-grid .pricing-card', effect: 'reveal-up', stagger: true },
        { selector: '.about-heading', effect: 'reveal-up', delay: '' },
        { selector: '.about-grid .about-card', effect: 'reveal-up', stagger: true },
        { selector: '.about-stats .stat-box', effect: 'reveal-up', stagger: true },
        { selector: '.about-mission', effect: 'reveal-zoom', delay: 'delay-2' },
        { selector: '.contact-heading', effect: 'reveal-up', delay: '' },
        { selector: '.contact-wrapper', effect: 'reveal-up', delay: 'delay-1' },
        { selector: '.contact-info-card', effect: 'reveal-left', delay: '' },
        { selector: '.contact-form-card', effect: 'reveal-right', delay: '' },
        { selector: '.footer-container', effect: 'reveal-up', delay: '' },
        { selector: '.recent-section', effect: 'reveal-up', delay: '' },
        { selector: '.analytics-card', effect: 'reveal-up', stagger: true }
    ];

    autoRevealConfig.forEach(({ selector, effect, stagger, delay }) => {
        const elements = document.querySelectorAll(selector);
        elements.forEach((el, index) => {
            if (!el.classList.contains('reveal') &&
                !el.classList.contains('reveal-up') &&
                !el.classList.contains('reveal-left') &&
                !el.classList.contains('reveal-right') &&
                !el.classList.contains('reveal-zoom')) {
                
                el.classList.add(effect);

                if (stagger) {
                    const delayClass = `delay-${Math.min((index % 6) + 1, 6)}`;
                    el.classList.add(delayClass);
                } else if (delay) {
                    el.classList.add(delay);
                }
            }
        });
    });

    // 2. Setup IntersectionObserver
    const observerOptions = {
        threshold: 0.12,
        rootMargin: '0px 0px -40px 0px'
    };

    const observer = new IntersectionObserver((entries, obs) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('revealed');
                // Unobserve once revealed for peak performance
                obs.unobserve(entry.target);
            }
        });
    }, observerOptions);

    // 3. Observe all revealable elements
    const allRevealElements = document.querySelectorAll(
        '.reveal, .reveal-up, .reveal-left, .reveal-right, .reveal-zoom'
    );

    allRevealElements.forEach(el => observer.observe(el));
});
