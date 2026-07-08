// src/modules/auth/ResetPasswordModule.js
import { AuthModule } from './AuthModule.js';
import { $id } from '../../utils/dom.js';

export class ResetPasswordModule extends AuthModule {
  constructor() {
    super({
      name: 'ResetPassword',
      storageKey: null,
    });
    this.passwordValid = false;
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

    const form = $id('paResetForm');
    const passwordInput = $id('paNewPassword');
    const confirmInput = $id('paConfirmPassword');
    const submitBtn = $id('paResetSubmit');

    // Setup password toggles
    this.setupPasswordToggle('paNewPassword', 'paPassToggle');
    this.setupPasswordToggle('paConfirmPassword', 'paConfirmPassToggle');

    // Setup password strength indicator
    this.setupPasswordStrength(
      'paNewPassword',
      'paPasswordRequirements',
      'paPasswordStrength',
      'paStrengthLabel'
    );

    // Validate password on input
    this.on(passwordInput, 'input', () => {
      const password = passwordInput.value;
      this.passwordValid = this.isPasswordValid(password);
      
      this.clearFieldError('paNewPassword', 'paNewPasswordError');
      
      // Check confirm match
      if (confirmInput.value && password !== confirmInput.value) {
        this.setFieldError('paConfirmPassword', 'paConfirmPasswordError', true);
      } else if (confirmInput.value) {
        this.clearFieldError('paConfirmPassword', 'paConfirmPasswordError');
      }
    });

    // Validate confirm on input
    this.on(confirmInput, 'input', () => {
      if (confirmInput.value && confirmInput.value !== passwordInput.value) {
        this.setFieldError('paConfirmPassword', 'paConfirmPasswordError', true);
      } else {
        this.clearFieldError('paConfirmPassword', 'paConfirmPasswordError');
      }
    });

    // Form submission
    this.on(form, 'submit', (e) => {
      e.preventDefault();
      this.handleResetSubmit();
    });
  }

  handleResetSubmit() {
    const passwordInput = $id('paNewPassword');
    const confirmInput = $id('paConfirmPassword');
    const submitBtn = $id('paResetSubmit');

    let valid = true;
    const password = passwordInput.value;
    const confirm = confirmInput.value;

    // Validate password
    if (!password || !this.isPasswordValid(password)) {
      this.setFieldError('paNewPassword', 'paNewPasswordError', true);
      valid = false;
    } else {
      this.clearFieldError('paNewPassword', 'paNewPasswordError');
    }

    // Validate confirm
    if (!confirm || confirm !== password) {
      this.setFieldError('paConfirmPassword', 'paConfirmPasswordError', true);
      valid = false;
    } else {
      this.clearFieldError('paConfirmPassword', 'paConfirmPasswordError');
    }

    if (!valid) {
      const firstInvalid = document.querySelector('#paResetForm .pa-form-input.error');
      if (firstInvalid) firstInvalid.focus();
      return;
    }

    // Show loading state
    this.setButtonLoading('paResetSubmit', true);

    // Emit event for future integration
    const form = $id('paResetForm');
    form.dispatchEvent(new CustomEvent('pa:reset-submit', {
      bubbles: true,
      detail: { password },
    }));

    // Simulate API call
    setTimeout(() => {
      this.setButtonLoading('paResetSubmit', false);
      
      // Show success state
      this.showSuccess('paSuccessBox', 'paResetForm');
      this.showSuccessToast('Password reset successfully!');
    }, 1200);
  }
}