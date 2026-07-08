/**
 * dom.js — tiny DOM query + creation helpers used throughout the app.
 * Centralizing these makes it trivial to add a caching layer later
 * (see "cache DOM queries" in the performance objectives) without
 * touching every module.
 */

const _queryCache = new Map();

/** `querySelector` shorthand. Accepts `#id` fast-path via getElementById. */
export function $(selector, scope = document) {
  if (scope === document && selector.startsWith('#') && !selector.includes(' ')) {
    return document.getElementById(selector.slice(1));
  }
  return scope.querySelector(selector);
}

/** `querySelectorAll` -> real Array (so `.map`/`.filter` work without spreading). */
export function $all(selector, scope = document) {
  return Array.from(scope.querySelectorAll(selector));
}

/**
 * Cached `getElementById` for hot paths (e.g. called on every render tick).
 * Cache is keyed by id; call `clearDomCache()` if you ever swap out large
 * chunks of the DOM outside of normal render flows (rare — most modules
 * fully own their container and can safely cache its children's ids).
 */
export function $id(id) {
  if (_queryCache.has(id)) {
    const cached = _queryCache.get(id);
    if (cached && cached.isConnected) return cached;
    _queryCache.delete(id);
  }
  const el = document.getElementById(id);
  if (el) _queryCache.set(id, el);
  return el;
}

export function clearDomCache() {
  _queryCache.clear();
}

/** Escape a string for safe HTML interpolation (matches legacy `escapeHtml`). */
export function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str == null ? '' : String(str);
  return div.innerHTML;
}

/** Toggle a class based on a boolean, without the ternary noise at call sites. */
export function toggleClass(el, className, force) {
  el?.classList.toggle(className, force);
}

/** Show/hide by toggling the `visible` class used throughout the panel system. */
export function setVisible(el, visible) {
  el?.classList.toggle('visible', visible);
}
