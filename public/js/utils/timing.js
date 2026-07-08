/**
 * timing.js — debounce/throttle + rAF batching helpers.
 */

/** Classic trailing-edge debounce. */
export function debounce(fn, wait) {
  let t;
  return function debounced(...args) {
    clearTimeout(t);
    t = setTimeout(() => fn.apply(this, args), wait);
  };
}

/** Trailing-edge throttle: fn runs at most once per `wait` ms. */
export function throttle(fn, wait) {
  let last = 0;
  let pendingArgs = null;
  let timer = null;
  return function throttled(...args) {
    const now = Date.now();
    const remaining = wait - (now - last);
    pendingArgs = args;
    if (remaining <= 0) {
      last = now;
      fn.apply(this, pendingArgs);
      pendingArgs = null;
    } else if (!timer) {
      timer = setTimeout(() => {
        last = Date.now();
        timer = null;
        if (pendingArgs) fn.apply(this, pendingArgs);
        pendingArgs = null;
      }, remaining);
    }
  };
}

/**
 * Coalesce many synchronous `schedule()` calls within the same frame into a
 * single `fn()` invocation via requestAnimationFrame. Use for render calls
 * that might otherwise fire multiple times per event loop tick.
 */
export function rafScheduler(fn) {
  let scheduled = false;
  return function schedule(...args) {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(() => {
      scheduled = false;
      fn.apply(this, args);
    });
  };
}
