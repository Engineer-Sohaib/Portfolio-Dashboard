// src/modules/auth/ForgotPasswordModule.js
import { AuthModule } from './AuthModule.js';
import { $id } from '../../utils/dom.js';

export class ForgotPasswordModule extends AuthModule {
  constructor() {
    super({
      name: 'ForgotPassword',
      storageKey: null,
    });
    this.resendTimer = null;
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

    const form = $id('paForgotForm');
    const emailInput = $id('paForgotEmail');
    const submitBtn = $id('paForgotSubmit');
    const resendBtn = $id('paResendBtn');

    // Clear errors on input
    this.on(emailInput, 'input', () => {
      this.clearFieldError('paForgotEmail', 'paForgotEmailError');
    });

    // Handle Enter key
    this.handleEnterSubmit('paForgotEmail', 'paForgotForm');

    // Form submission
    this.on(form, 'submit', (e) => {
      e.preventDefault();
      this.handleForgotSubmit();
    });

    // Resend button
    this.on(resendBtn, 'click', (e) => {
      e.preventDefault();
      this.handleResend();
    });
  }

  handleForgotSubmit() {
    const emailInput = $id('paForgotEmail');
    const submitBtn = $id('paForgotSubmit');
    const emailValue = emailInput.value.trim();

    // Validate email
    if (!emailValue || !this.isValidEmail(emailValue)) {
      this.setFieldError('paForgotEmail', 'paForgotEmailError', true);
      emailInput.focus();
      return;
    }
    this.clearFieldError('paForgotEmail', 'paForgotEmailError');

    // Show loading state
    this.setButtonLoading('paForgotSubmit', true);

    // Emit event for future integration
    const form = $id('paForgotForm');
    form.dispatchEvent(new CustomEvent('pa:forgot-submit', {
      bubbles: true,
      detail: { email: emailValue },
    }));

    // Simulate API call
    setTimeout(() => {
      this.setButtonLoading('paForgotSubmit', false);
      
      // Show success state
      const successEmail = $id('paSuccessEmail');
      if (successEmail) successEmail.textContent = emailValue;
      
      this.showSuccess('paSuccessBox', 'paForgotForm');
      this.showSuccessToast(`Password reset link sent to ${emailValue}`);
    }, 1200);
  }

  handleResend() {
    const resendBtn = $id('paResendBtn');
    const emailInput = $id('paForgotEmail');
    const emailValue = emailInput.value.trim();

    if (!emailValue || !this.isValidEmail(emailValue)) {
      this.showError('Please enter a valid email address.');
      return;
    }

    this.setButtonLoading('paResendBtn', true);

    // Simulate resend
    setTimeout(() => {
      this.setButtonLoading('paResendBtn', false);
      this.showSuccessToast(`Reset link resent to ${emailValue}`);
    }, 800);
  }

  destroy() {
    if (this.resendTimer) {
      clearTimeout(this.resendTimer);
      this.resendTimer = null;
    }
    super.destroy();
  }
}