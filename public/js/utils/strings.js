/**
 * strings.js — string manipulation helpers (slugify, URL validation, etc).
 */

export { escapeHtml } from './dom.js';

/** URL-safe slug: lowercase, non-alphanumerics -> hyphens, trimmed. */
export function slugify(text) {
  return String(text || '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

/** Blog-post slug validity: lowercase letters/digits/hyphens only. */
export function isValidSlug(s) {
  return /^[a-z0-9]+(-[a-z0-9]+)*$/.test(s);
}

/** Category-key validity: starts alphanumeric, then letters/digits/hyphens. */
export function isValidCategoryKey(k) {
  return /^[a-z0-9][a-z0-9-]*$/.test(k);
}

/** true for empty string, or a syntactically valid http(s) URL. */
export function isValidUrl(str) {
  if (!str) return true;
  try {
    const u = new URL(str);
    return u.protocol === 'http:' || u.protocol === 'https:';
  } catch {
    return false;
  }
}

/** "photo.png" -> "photo (copy).png", used when duplicating media items. */
export function appendCopySuffix(filename) {
  const dot = filename.lastIndexOf('.');
  if (dot <= 0) return `${filename} (copy)`;
  return `${filename.slice(0, dot)} (copy)${filename.slice(dot)}`;
}
