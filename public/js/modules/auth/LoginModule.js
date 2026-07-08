// src/modules/auth/LoginModule.js
import { AuthModule } from './AuthModule.js';
import { $id } from '../../utils/dom.js';

export class LoginModule extends AuthModule {
  constructor() {
    super({
      name: 'Login',
      storageKey: null, // No persistence needed
    });
  }

  async load() {
    // Nothing to load
  }

  render() {
    // HTML is already in the page
  }

  bindEvents() {
    if (this._boundEvents) return;
    this._boundEvents = true;

    const form = $id('paLoginForm');
    const emailInput = $id('paLoginEmail');
    const passwordInput = $id('paLoginPassword');
    const submitBtn = $id('paLoginSubmit');
    const forgotLink = $id('paForgotPasswordLink');
    const createAccountLink = $id('paCreateAccountLink');

    // Setup password toggle
    this.setupPasswordToggle('paLoginPassword', 'paPassToggle');

    // Clear errors on input
    this.on(emailInput, 'input', () => {
      this.clearFieldError('paLoginEmail', 'paLoginEmailError');
    });
    this.on(passwordInput, 'input', () => {
      this.clearFieldError('paLoginPassword', 'paLoginPasswordError');
    });

    // Handle Enter key
    this.handleEnterSubmit('paLoginPassword', 'paLoginForm');

    // Forgot password link
    this.on(forgotLink, 'click', (e) => {
      e.preventDefault();
      // Next.js migration: absolute route, no depth-relative branching needed.
      window.location.href = '/forget-password';
    });

    // Create account link
    this.on(createAccountLink, 'click', (e) => {
      e.preventDefault();
      this.showToast('Account creation is not available in this demo.', 'info');
    });

    // Form submission
    this.on(form, 'submit', (e) => {
      e.preventDefault();
      this.handleLogin();
    });
  }

  handleLogin() {
    const emailInput = $id('paLoginEmail');
    const passwordInput = $id('paLoginPassword');
    const submitBtn = $id('paLoginSubmit');
    const rememberCheck = $id('paRememberMe');

    let valid = true;

    // Validate email
    const emailValue = emailInput.value.trim();
    if (!emailValue || !this.isValidEmail(emailValue)) {
      this.setFieldError('paLoginEmail', 'paLoginEmailError', true);
      valid = false;
    } else {
      this.clearFieldError('paLoginEmail', 'paLoginEmailError');
    }

    // Validate password
    const passwordValue = passwordInput.value;
    if (!passwordValue || passwordValue.length < 6) {
      this.setFieldError('paLoginPassword', 'paLoginPasswordError', true);
      valid = false;
    } else {
      this.clearFieldError('paLoginPassword', 'paLoginPasswordError');
    }

    if (!valid) {
      const firstInvalid = document.querySelector('#paLoginForm .pa-form-input.error');
      if (firstInvalid) firstInvalid.focus();
      return;
    }

    // Show loading state
    this.setButtonLoading('paLoginSubmit', true);

    // Emit event for future integration
    const form = $id('paLoginForm');
    form.dispatchEvent(new CustomEvent('pa:login-submit', {
      bubbles: true,
      detail: {
        email: emailValue,
        password: passwordValue,
        remember: rememberCheck ? rememberCheck.checked : false,
      },
    }));

    // Simulate API call
    setTimeout(() => {
      this.setButtonLoading('paLoginSubmit', false);
      this.showSuccessToast('Login successful! Redirecting...');
      
      // Redirect to dashboard
      setTimeout(() => {
        this.redirectToDashboard();
      }, 800);
    }, 1200);
  }
}