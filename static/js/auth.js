/* =============================================
   RNS YT4 - Auth JavaScript
   ============================================= */

document.addEventListener('DOMContentLoaded', function () {
    initPasswordToggle();
    initPasswordStrength();
    initFormValidation();
});

/* Password Visibility Toggle */
function initPasswordToggle() {
    var toggleButtons = document.querySelectorAll('.toggle-password');

    toggleButtons.forEach(function (btn) {
        btn.addEventListener('click', function () {
            var input = this.previousElementSibling;
            if (!input || input.tagName !== 'INPUT') {
                input = this.parentElement.querySelector('input[type="password"], input[type="text"]');
            }

            if (input) {
                var isPassword = input.type === 'password';
                input.type = isPassword ? 'text' : 'password';

                var icon = this.querySelector('i');
                if (icon) {
                    icon.className = isPassword ? 'fas fa-eye-slash' : 'fas fa-eye';
                }
            }
        });
    });
}

/* Password Strength Indicator */
function initPasswordStrength() {
    var passwordInput = document.querySelector('input[name="password"]');
    var strengthBar = document.querySelector('.password-strength');

    if (!passwordInput || !strengthBar) return;

    passwordInput.addEventListener('input', function () {
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

function calculatePasswordStrength(password) {
    var strength = 0;

    // Length
    if (password.length >= 8) strength++;
    if (password.length >= 12) strength++;

    // Contains lowercase
    if (/[a-z]/.test(password)) strength++;

    // Contains uppercase
    if (/[A-Z]/.test(password)) strength++;

    // Contains numbers
    if (/[0-9]/.test(password)) strength++;

    // Contains special characters
    if (/[^a-zA-Z0-9]/.test(password)) strength++;

    return strength;
}

/* Form Validation */
function initFormValidation() {
    var forms = document.querySelectorAll('.auth-form');

    forms.forEach(function (form) {
        form.addEventListener('submit', function (e) {
            var isValid = validateForm(form);

            if (!isValid) {
                e.preventDefault();
            } else {
                // Show loading state
                var submitBtn = form.querySelector('button[type="submit"]');
                if (submitBtn) {
                    submitBtn.disabled = true;
                    var originalText = submitBtn.innerHTML;
                    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';

                    // Re-enable after timeout (in case of server error)
                    setTimeout(function () {
                        submitBtn.disabled = false;
                        submitBtn.innerHTML = originalText;
                    }, 10000);
                }
            }
        });

        // Real-time validation
        var inputs = form.querySelectorAll('input');
        inputs.forEach(function (input) {
            input.addEventListener('blur', function () {
                validateInput(this);
            });

            input.addEventListener('input', function () {
                // Clear error state on input
                clearInputError(this);
            });
        });
    });
}

function validateForm(form) {
    var inputs = form.querySelectorAll('input[required]');
    var isValid = true;

    inputs.forEach(function (input) {
        if (!validateInput(input)) {
            isValid = false;
        }
    });

    // Check password confirmation
    var password = form.querySelector('input[name="password"]');
    var confirmPassword = form.querySelector('input[name="confirm_password"]');

    if (password && confirmPassword) {
        if (password.value !== confirmPassword.value) {
            showInputError(confirmPassword, 'Passwords do not match');
            isValid = false;
        }
    }

    return isValid;
}

function validateInput(input) {
    var value = input.value.trim();
    var type = input.type;
    var name = input.name;

    // Required check
    if (input.required && !value) {
        showInputError(input, 'This field is required');
        return false;
    }

    // Email validation
    if (type === 'email' && value) {
        if (!isValidEmail(value)) {
            showInputError(input, 'Please enter a valid email address');
            return false;
        }
    }

    // Password validation
    if (name === 'password' && value) {
        if (value.length < 6) {
            showInputError(input, 'Password must be at least 6 characters');
            return false;
        }
    }

    // Username validation
    if (name === 'username' && value) {
        if (value.length < 3) {
            showInputError(input, 'Username must be at least 3 characters');
            return false;
        }
        if (!/^[a-zA-Z0-9_]+$/.test(value)) {
            showInputError(input, 'Username can only contain letters, numbers and underscores');
            return false;
        }
    }

    clearInputError(input);
    return true;
}

function isValidEmail(email) {
    var re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

function showInputError(input, message) {
    var wrapper = input.closest('.form-group') || input.closest('.input-wrapper');

    if (wrapper) {
        wrapper.classList.add('has-error');

        // Remove existing error message
        var existingError = wrapper.querySelector('.error-message');
        if (existingError) {
            existingError.remove();
        }

        // Add error message
        var errorEl = document.createElement('span');
        errorEl.className = 'error-message';
        errorEl.textContent = message;
        wrapper.appendChild(errorEl);
    }

    input.classList.add('error');
}

function clearInputError(input) {
    var wrapper = input.closest('.form-group') || input.closest('.input-wrapper');

    if (wrapper) {
        wrapper.classList.remove('has-error');
        var errorEl = wrapper.querySelector('.error-message');
        if (errorEl) {
            errorEl.remove();
        }
    }

    input.classList.remove('error');
}

/* Remember Me */
function initRememberMe() {
    var rememberCheckbox = document.querySelector('input[name="remember"]');
    var emailInput = document.querySelector('input[name="email"]');

    if (rememberCheckbox && emailInput) {
        // Load saved email
        var savedEmail = localStorage.getItem('rns_yt4_email');
        if (savedEmail) {
            emailInput.value = savedEmail;
            rememberCheckbox.checked = true;
        }

        // Save on form submit
        var form = rememberCheckbox.closest('form');
        if (form) {
            form.addEventListener('submit', function () {
                if (rememberCheckbox.checked) {
                    localStorage.setItem('rns_yt4_email', emailInput.value);
                } else {
                    localStorage.removeItem('rns_yt4_email');
                }
            });
        }
    }
}

// Initialize remember me
initRememberMe();
