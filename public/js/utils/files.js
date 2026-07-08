/**
 * files.js — file upload helpers: reading, validating, and previewing
 * user-supplied images. Kept side-effect free except for the toast calls,
 * which are the one integration point with the UI layer.
 */
import { showToast } from '../modules/shell/toast.js';

const VALID_IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/webp'];
const MAX_FILE_BYTES = 5 * 1024 * 1024; // 5MB

/** Read a File/Blob as a base64 data URL. */
export function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * Validate a file against the app's image upload rules (type + 5MB size cap),
 * surfacing a toast on failure. Returns true/false so callers can `continue`.
 */
export function handleFileValidation(file) {
  if (!VALID_IMAGE_TYPES.includes(file.type)) {
    showToast(`"${file.name}" — only PNG, JPG, or WebP images are supported.`, 'danger');
    return false;
  }
  if (file.size > MAX_FILE_BYTES) {
    showToast(`"${file.name}" — file exceeds the 5MB limit.`, 'danger');
    return false;
  }
  return true;
}

/**
 * Read + validate a whole FileList, returning `{ url, name }` entries for
 * every file that passed validation. Invalid files are skipped (a toast was
 * already shown for each by `handleFileValidation`).
 */
export async function readValidFiles(fileList) {
  const files = Array.from(fileList || []);
  const results = [];
  for (const file of files) {
    if (!handleFileValidation(file)) continue;
    try {
      const url = await readFileAsDataUrl(file);
      results.push({ url, name: file.name, size: file.size, type: file.type });
    } catch {
      // Unreadable file (corrupt / permission issue) — skip silently, matches legacy behavior.
    }
  }
  return results;
}
