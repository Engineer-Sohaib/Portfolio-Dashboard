/**
 * format.js — date/number/file-size formatting helpers. Pure functions,
 * no DOM access, fully unit-testable in isolation.
 */

/** "1.2 MB" / "840 B" / "Unknown size" for falsy/zero input. */
export function formatFileSize(bytes) {
  if (!bytes || bytes <= 0) return 'Unknown size';
  const units = ['B', 'KB', 'MB', 'GB'];
  let i = 0;
  let val = bytes;
  while (val >= 1024 && i < units.length - 1) {
    val /= 1024;
    i++;
  }
  return `${val.toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
}

/** "Jan 5, 2026" / "Unknown" for an invalid ISO date string. */
export function formatDate(iso) {
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return 'Unknown';
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  } catch {
    return 'Unknown';
  }
}

/** "Jul 2026" for a "YYYY-MM" input, used by the Experience module. */
export function formatMonthYear(ym) {
  if (!ym) return '';
  const [y, m] = ym.split('-').map(Number);
  if (!y || !m) return ym;
  const d = new Date(y, m - 1, 1);
  return d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
}

/** "2h ago" / "3d ago" / "5w ago" / formatted date for older values, from an ISO string. */
export function timeAgo(iso) {
  try {
    const then = new Date(iso).getTime();
    if (Number.isNaN(then)) return '';
    const diffMs = Date.now() - then;
    if (diffMs < 0) return formatDate(iso);
    const mins = Math.floor(diffMs / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d ago`;
    const weeks = Math.floor(days / 7);
    if (weeks < 5) return `${weeks}w ago`;
    return formatDate(iso);
  } catch {
    return '';
  }
}

/** Parse a free-text "years of experience" field into a float or null. */
export function parseYearsInput(raw) {
  const trimmed = (raw || '').trim();
  if (trimmed === '') return null;
  const n = parseFloat(trimmed);
  return Number.isNaN(n) ? null : n;
}

/** Parse a sort-order text field into an int, or fall back. */
export function parseSortInput(raw, fallback) {
  const trimmed = (raw || '').trim();
  if (trimmed === '') return fallback;
  const n = parseInt(trimmed, 10);
  return Number.isNaN(n) ? fallback : n;
}

/** CSV-safe field escaping for the Contact Messages export. */
export function csvEscapeField(val) {
  const str = val == null ? '' : String(val);
  if (/[",\n]/.test(str)) return `"${str.replace(/"/g, '""')}"`;
  return str;
}
