// src/core/router.js
/**
 * router.js — resolves the current admin page from the URL, once, at load
 * time. Legacy `app.js` recomputed this via an IIFE constant (`PAGE`); we
 * expose it as a function so it's testable and so `main.js` can decide which
 * module(s) to boot without a giant switch buried in module code.
 */

// NOTE (Next.js migration): routes were originally matched against static
// filenames (index.html, pages/projects.html, ...) because main.js ran from
// three different directory depths on disk. Under Next.js's App Router every
// page is served from a flat, absolute path, so the lookup table below uses
// those paths instead. The page-key values (right-hand side) are UNCHANGED —
// every module keeps checking `PAGE === 'projects'` etc. exactly as before.
const ROUTES = [
  ['/projects', 'projects'],
  ['/categories', 'categories'],
  ['/technologies', 'technologies'],
  ['/media-library', 'media'],
  ['/testimonials', 'testimonials'],
  ['/blog-post', 'blogposts'],
  ['/experience', 'experience'],
  ['/contact-messages', 'contact-messages'],
  ['/settings', 'settings'],
  // Auth routes (these pages use their own modules)
  ['/login', 'login'],
  ['/forget-password', 'forgot-password'],
  ['/reset-password', 'reset-password'],
];

/** @returns {string} the current page key, defaulting to "dashboard". */
export function getCurrentPage(path = window.location.pathname) {
  // Check for auth pages first
  if (path.includes('/login')) return 'login';
  if (path.includes('/forget-password')) return 'forgot-password';
  if (path.includes('/reset-password')) return 'reset-password';

  for (const [needle, page] of ROUTES) {
    if (path.includes(needle)) return page;
  }
  // Root path ("/") is the dashboard.
  return 'dashboard';
}

export const PAGE = getCurrentPage();

/**
 * Resolves the login page path. Next.js serves every route from the root,
 * so this is now a single absolute path rather than a depth-relative one.
 * @returns {string} the path to use for window.location.href
 */
export function getLoginPath() {
  return '/login';
}

/**
 * Get the absolute Next.js path for an auth page based on its original
 * filename, so any existing call sites that still pass e.g. 'login.html'
 * or 'forget-password.html' keep working unchanged.
 * @param {string} page - The auth page filename (e.g., 'login.html')
 * @returns {string} the absolute path to the auth page
 */
export function getAuthPath(page) {
  const map = {
    'login.html': '/login',
    'forget-password.html': '/forget-password',
    'reset-password.html': '/reset-password',
  };
  return map[page] || '/login';
}