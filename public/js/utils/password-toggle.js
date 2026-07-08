// src/utils/password-toggle.js
/**
 * password-toggle.js — Adds show/hide functionality to password input fields.
 * 
 * Usage:
 *   <div class="pa-password-wrap">
 *     <input type="password" id="myPassword" class="pa-form-input" />
 *     <button type="button" class="pa-password-toggle" aria-label="Toggle password visibility">
 *       <i class="ri-eye-line"></i>
 *     </button>
 *   </div>
 * 
 *   import { setupPasswordToggle } from './utils/password-toggle.js';
 *   setupPasswordToggle('myPassword');
 */

/**
 * Set up password toggle for a specific password input.
 * @param {string|HTMLElement} inputId - The ID of the password input or the element itself
 * @param {string} [toggleBtnId] - Optional ID of the toggle button (auto-generated if not provided)
 * @returns {HTMLElement|null} The toggle button element
 */
export function setupPasswordToggle(inputId, toggleBtnId) {
  const input = typeof inputId === 'string' ? document.getElementById(inputId) : inputId;
  if (!input || input.type !== 'password') {
    console.warn('[password-toggle] No password input found for:', inputId);
    return null;
  }

  // Find or create the toggle button
  let toggleBtn = null;
  
  // If toggleBtnId is provided, try to find it
  if (toggleBtnId) {
    toggleBtn = document.getElementById(toggleBtnId);
  }
  
  // If not found, look for .pa-password-toggle inside the parent
  if (!toggleBtn) {
    const parent = input.closest('.pa-password-wrap') || input.parentElement;
    toggleBtn = parent?.querySelector('.pa-password-toggle');
  }
  
  // If still not found, create one
  if (!toggleBtn) {
    const parent = input.parentElement;
    // Check if we're inside a .pa-password-wrap, if not wrap the input
    let wrap = parent?.closest('.pa-password-wrap');
    if (!wrap) {
      wrap = document.createElement('div');
      wrap.className = 'pa-password-wrap';
      if (parent) {
        parent.insertBefore(wrap, input);
        wrap.appendChild(input);
      }
    }
    
    toggleBtn = document.createElement('button');
    toggleBtn.type = 'button';
    toggleBtn.className = 'pa-password-toggle';
    toggleBtn.setAttribute('aria-label', 'Toggle password visibility');
    toggleBtn.innerHTML = '<i class="ri-eye-line"></i>';
    wrap.appendChild(toggleBtn);
  }

  // Add click handler
  const handler = () => {
    const isPassword = input.type === 'password';
    input.type = isPassword ? 'text' : 'password';
    const icon = toggleBtn.querySelector('i');
    if (icon) {
      icon.className = isPassword ? 'ri-eye-off-line' : 'ri-eye-line';
    }
    toggleBtn.setAttribute('aria-label', isPassword ? 'Hide password' : 'Show password');
    // Keep focus on the input
    input.focus();
  };

  toggleBtn.addEventListener('click', handler);

  // Cleanup function
  const cleanup = () => {
    toggleBtn.removeEventListener('click', handler);
  };

  return toggleBtn;
}

/**
 * Set up password toggle for all password inputs in a container.
 * @param {string|HTMLElement} container - Container ID or element
 * @param {string} [selector] - Optional selector for password inputs (default: 'input[type="password"]')
 * @returns {Array} Array of toggle button elements
 */
export function setupAllPasswordToggles(container = document, selector = 'input[type="password"]') {
  const containerEl = typeof container === 'string' ? document.getElementById(container) : container;
  if (!containerEl) {
    console.warn('[password-toggle] Container not found:', container);
    return [];
  }

  const passwordInputs = containerEl.querySelectorAll(selector);
  const toggles = [];

  passwordInputs.forEach((input) => {
    // Skip if already has a toggle
    const existingToggle = input.closest('.pa-password-wrap')?.querySelector('.pa-password-toggle');
    if (existingToggle) {
      toggles.push(existingToggle);
      return;
    }
    
    const toggle = setupPasswordToggle(input);
    if (toggle) toggles.push(toggle);
  });

  return toggles;
}

/**
 * Add CSS styles for password toggle if not already present.
 */
export function injectPasswordToggleStyles() {
  if (document.getElementById('pa-password-toggle-styles')) return;
  
  const style = document.createElement('style');
  style.id = 'pa-password-toggle-styles';
  style.textContent = `
    .pa-password-wrap {
      position: relative;
      width: 100%;
    }

    .pa-password-wrap .pa-form-input {
      width: 100%;
      padding-right: 40px;
    }

    .pa-password-toggle {
      position: absolute;
      right: 10px;
      top: 50%;
      transform: translateY(-50%);
      background: none;
      border: none;
      color: var(--pa-text-faint);
      cursor: pointer;
      font-size: var(--pa-fs-md);
      padding: 4px 6px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: var(--pa-radius-sm);
      transition: color 0.2s, background 0.2s;
      outline: none;
    }

    .pa-password-toggle:hover {
      color: var(--pa-text);
      background: var(--pa-hover-faint);
    }

    .pa-password-toggle:focus-visible {
      outline: 2px solid var(--pa-orange);
      outline-offset: 2px;
    }

    /* For settings page security card */
    .pa-security-card .pa-password-wrap .pa-form-input {
      padding-right: 40px;
    }

    .pa-security-card .pa-password-toggle {
      right: 10px;
    }
  `;
  document.head.appendChild(style);
}