/* =============================================
   RNS YT4 - Home Page JavaScript
   ============================================= */

document.addEventListener('DOMContentLoaded', function () {
    initParallax();
    initHeroAnimations();
    initTestimonials();
    initBrowserRotator();
});

/* Parallax Scrolling */
function initParallax() {
    const hero = document.querySelector('.hero');
    const parallaxBg = document.querySelector('.parallax-bg');
    const parallaxElements = document.querySelectorAll('.parallax-element');

    if (!hero || !parallaxBg) return;

    window.addEventListener('scroll', function () {
        const scrolled = window.pageYOffset;
        const heroHeight = hero.offsetHeight;

        if (scrolled < heroHeight) {
            // Background parallax
            parallaxBg.style.transform = 'translate3d(0, ' + (scrolled * 0.3) + 'px, 0) scale(1.1)';

            // Floating elements parallax
            parallaxElements.forEach(function (el) {
                const speed = parseFloat(el.getAttribute('data-speed')) || 0.1;
                const direction = el.getAttribute('data-direction') || 'up';
                const yOffset = direction === 'up' ? -(scrolled * speed) : (scrolled * speed);
                el.style.transform = 'translate3d(0, ' + yOffset + 'px, 0)';
            });
        }
    });
}

/* Browser Screenshot Rotator */
function initBrowserRotator() {
    const images = [
        'https://tse4.mm.bing.net/th/id/OIP.rmAy3MvqXaQHDvtSDOIjugAAAA?cb=ucfimg2&ucfimg=1&rs=1&pid=ImgDetMain&o=7&rm=3',
        'https://tse4.mm.bing.net/th/id/OIP.Sj50XUZ8aFnFoYXjnNLzhAHaHa?cb=ucfimg2&ucfimg=1&rs=1&pid=ImgDetMain&o=7&rm=3',
        'https://tse4.mm.bing.net/th/id/OIP.j_tB6epZWlqeAFTARLB7dwHaHa?cb=ucfimg2&ucfimg=1&rs=1&pid=ImgDetMain&o=7&rm=3',
        'https://tse3.mm.bing.net/th/id/OIP.DiJViHndwNPeHV7n6K4IFgHaHa?cb=ucfimg2&ucfimg=1&rs=1&pid=ImgDetMain&o=7&rm=3',
        'https://static.vecteezy.com/system/resources/previews/053/779/341/large_2x/youtube-red-iconic-logo-in-high-resolution-free-png.png',
        'https://vectorseek.com/wp-content/uploads/2023/06/Youtube-Blue-icon-Vector.jpg',
        'https://tse3.mm.bing.net/th/id/OIP.SU-XZu_Bn65-ITJWAm5MVgHaHa?cb=ucfimg2&ucfimg=1&w=512&h=512&rs=1&pid=ImgDetMain&o=7&rm=3',
        'https://worthstartup.com/wp-content/uploads/2023/06/YouTube-Channel-Names.jpg',
        'https://img.freepik.com/premium-photo/youtube-application-3d-social-media-icons-logo-3d-rendering_41204-20290.jpg',
        'https://images.herzindagi.info/her-zindagi-english/images/2025/03/07/template/image/cvnbxhfgj-1741336107165.png',
        'https://tse3.mm.bing.net/th/id/OIP.Qi1RONXpWJWfZBWokkYtigHaFz?cb=ucfimg2&ucfimg=1&w=670&h=525&rs=1&pid=ImgDetMain&o=7&rm=3',
        'https://web3universe.today/wp-content/uploads/2024/03/l-6-1024x512.png',
        'https://tse3.mm.bing.net/th/id/OIP.v9bBH0svkt-cIB3BK2v83AHaHa?cb=ucfimg2&ucfimg=1&w=600&h=600&rs=1&pid=ImgDetMain&o=7&rm=3'
    ];

    const el = document.querySelector('.browser-screenshot');
    if (!el) return;

    // Start with a random index to avoid same initial image on refresh
    let idx = Math.floor(Math.random() * images.length);
    el.src = images[idx];

    setInterval(function () {
        // fade out
        el.classList.add('fade-out');
        setTimeout(function () {
            // choose a different random image
            let next = Math.floor(Math.random() * images.length);
            // ensure a different image is picked
            if (next === idx) {
                next = (next + 1) % images.length;
            }
            idx = next;
            el.src = images[idx];
            // fade in
            el.classList.remove('fade-out');
        }, 420);
    }, 3000);
}

/* Hero Animations */
function initHeroAnimations() {
    // Typing effect for hero title
    const heroTitle = document.querySelector('.hero-title');
    if (heroTitle && heroTitle.getAttribute('data-typing')) {
        typeWriter(heroTitle);
    }

    // Staggered animation for hero content
    const heroContent = document.querySelector('.hero-content');
    if (heroContent) {
        const elements = heroContent.querySelectorAll('h1, p, .hero-buttons, .hero-stats');
        elements.forEach(function (el, index) {
            el.style.opacity = '0';
            el.style.transform = 'translateY(30px)';
            setTimeout(function () {
                el.style.transition = 'all 0.6s cubic-bezier(0.16, 1, 0.3, 1)';
                el.style.opacity = '1';
                el.style.transform = 'translateY(0)';
            }, 200 + (index * 150));
        });
    }
}

/* Typing Effect */
function typeWriter(element) {
    const text = element.textContent;
    element.textContent = '';
    element.style.opacity = '1';

    var i = 0;
    var cursor = document.createElement('span');
    cursor.className = 'typing-cursor';
    cursor.textContent = '|';
    element.appendChild(cursor);

    function type() {
        if (i < text.length) {
            element.insertBefore(document.createTextNode(text.charAt(i)), cursor);
            i++;
            setTimeout(type, 50);
        } else {
            cursor.style.animation = 'blink 1s infinite';
            setTimeout(function () {
                cursor.remove();
            }, 2000);
        }
    }

    setTimeout(type, 500);
}

/* Testimonials Slider */
function initTestimonials() {
    const slider = document.querySelector('.testimonials-slider');
    if (!slider) return;

    const track = slider.querySelector('.testimonials-track');
    const cards = slider.querySelectorAll('.testimonial-card');
    const prevBtn = slider.querySelector('.slider-prev');
    const nextBtn = slider.querySelector('.slider-next');
    const dots = slider.querySelector('.slider-dots');

    if (!track || cards.length === 0) return;

    var currentIndex = 0;
    var cardWidth = cards[0].offsetWidth + 32; // Including gap
    var autoSlideInterval;

    // Create dots
    if (dots) {
        cards.forEach(function (card, index) {
            var dot = document.createElement('button');
            dot.className = 'slider-dot' + (index === 0 ? ' active' : '');
            dot.setAttribute('aria-label', 'Go to slide ' + (index + 1));
            dot.addEventListener('click', function () {
                goToSlide(index);
            });
            dots.appendChild(dot);
        });
    }

    function goToSlide(index) {
        if (index < 0) index = cards.length - 1;
        if (index >= cards.length) index = 0;

        currentIndex = index;
        track.style.transform = 'translateX(-' + (index * cardWidth) + 'px)';

        // Update dots
        var allDots = dots.querySelectorAll('.slider-dot');
        allDots.forEach(function (dot, i) {
            dot.classList.toggle('active', i === currentIndex);
        });
    }

    function nextSlide() {
        goToSlide(currentIndex + 1);
    }

    function prevSlide() {
        goToSlide(currentIndex - 1);
    }

    // Event listeners
    if (prevBtn) prevBtn.addEventListener('click', prevSlide);
    if (nextBtn) nextBtn.addEventListener('click', nextSlide);

    // Auto slide
    function startAutoSlide() {
        autoSlideInterval = setInterval(nextSlide, 5000);
    }

    function stopAutoSlide() {
        clearInterval(autoSlideInterval);
    }

    startAutoSlide();

    slider.addEventListener('mouseenter', stopAutoSlide);
    slider.addEventListener('mouseleave', startAutoSlide);

    // Touch support
    var touchStartX = 0;
    var touchEndX = 0;

    track.addEventListener('touchstart', function (e) {
        touchStartX = e.changedTouches[0].screenX;
        stopAutoSlide();
    });

    track.addEventListener('touchend', function (e) {
        touchEndX = e.changedTouches[0].screenX;
        handleSwipe();
        startAutoSlide();
    });

    function handleSwipe() {
        var diff = touchStartX - touchEndX;
        if (Math.abs(diff) > 50) {
            if (diff > 0) {
                nextSlide();
            } else {
                prevSlide();
            }
        }
    }

    // Recalculate on resize
    window.addEventListener('resize', debounce(function () {
        cardWidth = cards[0].offsetWidth + 32;
        goToSlide(currentIndex);
    }, 250));
}

/* Stats Counter Animation */
function initStatsAnimation() {
    const stats = document.querySelectorAll('.stat-number');

    stats.forEach(function (stat) {
        var observer = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                if (entry.isIntersecting) {
                    animateStat(stat);
                    observer.unobserve(stat);
                }
            });
        }, { threshold: 0.5 });

        observer.observe(stat);
    });
}

function animateStat(element) {
    var target = parseInt(element.getAttribute('data-count')) || 0;
    var suffix = element.getAttribute('data-suffix') || '';
    var duration = 2000;
    var start = 0;
    var startTime = null;

    function animate(currentTime) {
        if (!startTime) startTime = currentTime;
        var progress = Math.min((currentTime - startTime) / duration, 1);

        // Easing function
        var easeOut = 1 - Math.pow(1 - progress, 3);
        var current = Math.floor(easeOut * target);

        element.textContent = current.toLocaleString() + suffix;

        if (progress < 1) {
            requestAnimationFrame(animate);
        } else {
            element.textContent = target.toLocaleString() + suffix;
        }
    }

    requestAnimationFrame(animate);
}

/* Scroll Reveal */
function initScrollReveal() {
    var revealElements = document.querySelectorAll('.reveal');

    var observer = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
            if (entry.isIntersecting) {
                entry.target.classList.add('revealed');
                observer.unobserve(entry.target);
            }
        });
    }, {
        threshold: 0.15,
        rootMargin: '0px 0px -50px 0px'
    });

    revealElements.forEach(function (el) {
        observer.observe(el);
    });
}

/* Debounce utility */
function debounce(func, wait) {
    var timeout;
    return function () {
        var context = this;
        var args = arguments;
        clearTimeout(timeout);
        timeout = setTimeout(function () {
            func.apply(context, args);
        }, wait);
    };
}
