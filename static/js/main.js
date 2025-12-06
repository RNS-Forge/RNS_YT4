/* =============================================
   RNS YT4 - Main JavaScript
   ============================================= */

document.addEventListener('DOMContentLoaded', function () {
    initNavigation();
    initScrollEffects();
    initFlashMessages();
});

/* Navigation */
function initNavigation() {
    const navbar = document.querySelector('.navbar');
    const navToggle = document.getElementById('navToggle');
    const navMenu = document.getElementById('navMenu');
    const body = document.body;

    // Scroll behavior
    let lastScroll = 0;
    window.addEventListener('scroll', function () {
        const currentScroll = window.pageYOffset;

        if (currentScroll > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }

        lastScroll = currentScroll;
    });

    // Mobile menu toggle
    if (navToggle && navMenu) {
        navToggle.addEventListener('click', function (e) {
            e.stopPropagation();
            navMenu.classList.toggle('active');
            navToggle.classList.toggle('active');
            body.classList.toggle('mobile-menu-open');
        });

        // Close mobile menu when clicking overlay
        body.addEventListener('click', function (e) {
            if (body.classList.contains('mobile-menu-open') &&
                !navMenu.contains(e.target) &&
                !navToggle.contains(e.target)) {
                navMenu.classList.remove('active');
                navToggle.classList.remove('active');
                body.classList.remove('mobile-menu-open');
            }
        });
    }

    // Close mobile menu on link click
    document.querySelectorAll('.nav-menu a').forEach(function (link) {
        link.addEventListener('click', function () {
            if (navMenu) {
                navMenu.classList.remove('active');
            }
            if (navToggle) {
                navToggle.classList.remove('active');
            }
            body.classList.remove('mobile-menu-open');
        });
    });

    // Close mobile menu on escape key
    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape' && navMenu && navMenu.classList.contains('active')) {
            navMenu.classList.remove('active');
            navToggle.classList.remove('active');
            body.classList.remove('mobile-menu-open');
        }
    });
}

/* Scroll Effects */
function initScrollEffects() {
    // Parallax effect
    const parallaxLayers = document.querySelectorAll('.parallax-layer');

    if (parallaxLayers.length > 0) {
        window.addEventListener('scroll', function () {
            const scrolled = window.pageYOffset;

            parallaxLayers.forEach(function (layer) {
                const speed = layer.getAttribute('data-speed') || 0.5;
                const yPos = -(scrolled * speed);
                layer.style.transform = 'translate3d(0, ' + yPos + 'px, 0)';
            });
        });
    }

    // Fade in on scroll
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    document.querySelectorAll('.fade-in').forEach(function (el) {
        observer.observe(el);
    });

    // Counter animation
    document.querySelectorAll('.stat-number').forEach(function (stat) {
        const target = parseInt(stat.getAttribute('data-count')) || 0;

        const counterObserver = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                if (entry.isIntersecting) {
                    animateCounter(stat, target);
                    counterObserver.unobserve(entry.target);
                }
            });
        }, { threshold: 0.5 });

        counterObserver.observe(stat);
    });
}

/* Counter Animation */
function animateCounter(element, target) {
    let current = 0;
    const increment = target / 50;
    const duration = 2000;
    const stepTime = duration / 50;

    const timer = setInterval(function () {
        current += increment;
        if (current >= target) {
            current = target;
            clearInterval(timer);
        }

        const suffix = element.getAttribute('data-suffix') || '';
        element.textContent = Math.floor(current).toLocaleString() + suffix;
    }, stepTime);
}

/* Flash Messages */
function initFlashMessages() {
    const flashMessages = document.querySelectorAll('.flash-message');

    flashMessages.forEach(function (message) {
        // Auto dismiss after 5 seconds
        setTimeout(function () {
            dismissFlash(message);
        }, 5000);

        // Close button
        const closeBtn = message.querySelector('.flash-close');
        if (closeBtn) {
            closeBtn.addEventListener('click', function () {
                dismissFlash(message);
            });
        }
    });
}

function dismissFlash(message) {
    message.style.opacity = '0';
    message.style.transform = 'translateX(100%)';
    setTimeout(function () {
        message.remove();
    }, 300);
}

/* Utility Functions */
function debounce(func, wait) {
    let timeout;
    return function executedFunction() {
        const context = this;
        const args = arguments;
        const later = function () {
            timeout = null;
            func.apply(context, args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

function formatNumber(num) {
    if (num >= 1000000) {
        return (num / 1000000).toFixed(1) + 'M';
    }
    if (num >= 1000) {
        return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
}

function formatDuration(seconds) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
        return hours + ':' + String(minutes).padStart(2, '0') + ':' + String(secs).padStart(2, '0');
    }
    return minutes + ':' + String(secs).padStart(2, '0');
}

/* Smooth Scroll */
document.querySelectorAll('a[href^="#"]').forEach(function (anchor) {
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

/* Form Validation Helper */
function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

function validateURL(url) {
    try {
        new URL(url);
        return true;
    } catch (e) {
        return false;
    }
}

/* Loading State */
function setLoading(button, loading) {
    if (loading) {
        button.disabled = true;
        button.setAttribute('data-original-text', button.innerHTML);
        button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';
    } else {
        button.disabled = false;
        button.innerHTML = button.getAttribute('data-original-text');
    }
}

/* Toast Notifications */
function showToast(message, type) {
    type = type || 'info';

    const toast = document.createElement('div');
    toast.className = 'toast toast-' + type;
    toast.innerHTML = '\
        <i class="fas fa-' + getToastIcon(type) + '"></i>\
        <span>' + message + '</span>\
    ';

    let container = document.querySelector('.toast-container');
    if (!container) {
        container = document.createElement('div');
        container.className = 'toast-container';
        document.body.appendChild(container);
    }

    container.appendChild(toast);

    setTimeout(function () {
        toast.classList.add('show');
    }, 10);

    setTimeout(function () {
        toast.classList.remove('show');
        setTimeout(function () {
            toast.remove();
        }, 300);
    }, 3000);
}

function getToastIcon(type) {
    var icons = {
        success: 'check-circle',
        error: 'times-circle',
        warning: 'exclamation-triangle',
        info: 'info-circle'
    };
    return icons[type] || 'info-circle';
}

/* =============================================
   Slide-in Auth Panel
   ============================================= */
function openAuthPanel(panel) {
    var authOverlay = document.getElementById('authOverlay');
    var authPanel = document.getElementById('authPanel');

    if (authOverlay && authPanel) {
        authOverlay.classList.add('active');
        authPanel.classList.add('active');
        document.body.style.overflow = 'hidden';

        // Show the correct panel
        switchAuthPanel(panel || 'login');
    }
}

function closeAuthPanel() {
    var authOverlay = document.getElementById('authOverlay');
    var authPanel = document.getElementById('authPanel');

    if (authOverlay && authPanel) {
        authOverlay.classList.remove('active');
        authPanel.classList.remove('active');
        document.body.style.overflow = '';

        // Clear forms
        var loginForm = document.getElementById('loginForm');
        var signupForm = document.getElementById('signupForm');
        if (loginForm) loginForm.reset();
        if (signupForm) signupForm.reset();

        // Hide alerts
        hideAuthAlert('loginAlert');
        hideAuthAlert('signupAlert');
    }
}

function switchAuthPanel(panel) {
    var loginPanel = document.getElementById('loginPanel');
    var signupPanel = document.getElementById('signupPanel');

    if (panel === 'login') {
        if (loginPanel) loginPanel.classList.remove('hidden');
        if (signupPanel) signupPanel.classList.add('hidden');
    } else if (panel === 'signup') {
        if (loginPanel) loginPanel.classList.add('hidden');
        if (signupPanel) signupPanel.classList.remove('hidden');
    }
}

function showAuthAlert(alertId, message, type) {
    var alert = document.getElementById(alertId);
    if (alert) {
        alert.textContent = message;
        alert.className = 'auth-alert show ' + type;
    }
}

function hideAuthAlert(alertId) {
    var alert = document.getElementById(alertId);
    if (alert) {
        alert.className = 'auth-alert';
        alert.textContent = '';
    }
}

function handleLogin(event) {
    event.preventDefault();

    var form = event.target;
    var email = form.querySelector('#loginEmail').value.trim();
    var password = form.querySelector('#loginPassword').value;
    var submitBtn = form.querySelector('#loginBtn');

    if (!email || !password) {
        showAuthAlert('loginAlert', 'Please fill in all fields', 'error');
        return;
    }

    // Set loading state
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Signing in...';

    fetch('/api/login', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email: email, password: password })
    })
        .then(function (response) {
            return response.json();
        })
        .then(function (data) {
            submitBtn.disabled = false;
            submitBtn.innerHTML = '<span>Sign In</span><i class="fas fa-arrow-right"></i>';

            if (data.success) {
                showAuthAlert('loginAlert', 'Login successful! Redirecting...', 'success');
                setTimeout(function () {
                    window.location.reload();
                }, 1000);
            } else {
                showAuthAlert('loginAlert', data.error || 'Login failed', 'error');
            }
        })
        .catch(function (error) {
            submitBtn.disabled = false;
            submitBtn.innerHTML = '<span>Sign In</span><i class="fas fa-arrow-right"></i>';
            showAuthAlert('loginAlert', 'An error occurred. Please try again.', 'error');
        });
}

function handleSignup(event) {
    event.preventDefault();

    var form = event.target;
    var username = form.querySelector('#signupUsername').value.trim();
    var email = form.querySelector('#signupEmail').value.trim();
    var password = form.querySelector('#signupPassword').value;
    var confirmPassword = form.querySelector('#signupConfirmPassword').value;
    var submitBtn = form.querySelector('#signupBtn');

    if (!username || !email || !password || !confirmPassword) {
        showAuthAlert('signupAlert', 'Please fill in all fields', 'error');
        return;
    }

    if (username.length < 3) {
        showAuthAlert('signupAlert', 'Username must be at least 3 characters', 'error');
        return;
    }

    if (password.length < 6) {
        showAuthAlert('signupAlert', 'Password must be at least 6 characters', 'error');
        return;
    }

    if (password !== confirmPassword) {
        showAuthAlert('signupAlert', 'Passwords do not match', 'error');
        return;
    }

    // Set loading state
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Creating account...';

    fetch('/api/signup', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            username: username,
            email: email,
            password: password,
            confirm_password: confirmPassword
        })
    })
        .then(function (response) {
            return response.json();
        })
        .then(function (data) {
            submitBtn.disabled = false;
            submitBtn.innerHTML = '<span>Create Account</span><i class="fas fa-arrow-right"></i>';

            if (data.success) {
                showAuthAlert('signupAlert', 'Account created! Redirecting...', 'success');
                setTimeout(function () {
                    window.location.reload();
                }, 1000);
            } else {
                showAuthAlert('signupAlert', data.error || 'Signup failed', 'error');
            }
        })
        .catch(function (error) {
            submitBtn.disabled = false;
            submitBtn.innerHTML = '<span>Create Account</span><i class="fas fa-arrow-right"></i>';
            showAuthAlert('signupAlert', 'An error occurred. Please try again.', 'error');
        });
}

function togglePassword(inputId) {
    var input = document.getElementById(inputId);
    var btn = input.parentElement.querySelector('.toggle-password i');

    if (input.type === 'password') {
        input.type = 'text';
        btn.className = 'fas fa-eye-slash';
    } else {
        input.type = 'password';
        btn.className = 'fas fa-eye';
    }
}

// Password strength indicator for signup
document.addEventListener('DOMContentLoaded', function () {
    var signupPassword = document.getElementById('signupPassword');
    var strengthBar = document.getElementById('signupPasswordStrength');

    if (signupPassword && strengthBar) {
        signupPassword.addEventListener('input', function () {
            var password = this.value;
            var strength = calculatePasswordStrength(password);

            strengthBar.className = 'password-strength';

            if (password.length === 0) {
                return;
            }

            if (strength < 3) {
                strengthBar.classList.add('weak');
            } else if (strength < 5) {
                strengthBar.classList.add('medium');
            } else {
                strengthBar.classList.add('strong');
            }
        });
    }
});

function calculatePasswordStrength(password) {
    var strength = 0;

    if (password.length >= 8) strength++;
    if (password.length >= 12) strength++;
    if (/[a-z]/.test(password)) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^a-zA-Z0-9]/.test(password)) strength++;

    return strength;
}

// Close panel on Escape key
document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') {
        closeAuthPanel();
    }
});