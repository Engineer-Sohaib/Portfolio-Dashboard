/**
 * errors.js — a tiny error boundary for render/event-handler code so one
 * module's bug shows a toast instead of white-screening the whole admin panel.
 */
import { showToast } from '../modules/shell/toast.js';

/**
 * Wrap a function so thrown errors are caught, logged with module context,
 * and surfaced as a toast instead of propagating and breaking other modules.
 * @param {string} moduleName
 * @param {string} actionName
 * @param {Function} fn
 */
export function guarded(moduleName, actionName, fn) {
  return function guardedFn(...args) {
    try {
      return fn.apply(this, args);
    } catch (err) {
      console.error(`[${moduleName}] ${actionName} failed:`, err);
      showToast(`Something went wrong in ${moduleName} (${actionName}).`, 'danger');
      return undefined;
    }
  };
}

/** Same as `guarded`, but for async functions/promises. */
export function guardedAsync(moduleName, actionName, fn) {
  return async function guardedAsyncFn(...args) {
    try {
      return await fn.apply(this, args);
    } catch (err) {
      console.error(`[${moduleName}] ${actionName} failed:`, err);
      showToast(`Something went wrong in ${moduleName} (${actionName}).`, 'danger');
      return undefined;
    }
  };
}
