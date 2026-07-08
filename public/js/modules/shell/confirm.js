/**
 * confirm.js — the single shared "are you sure?" dialog (#paConfirmOverlay)
 * used by every feature module's delete action.
 *
 * Decoupling: this file has zero knowledge of Projects/Categories/etc. It
 * just remembers the pending `{ id, type }` and, on confirm, emits
 * `confirm:confirmed` on the event bus. Each CRUD module subscribes to that
 * event and checks `payload.type === 'project'` (etc.) before acting — so
 * adding a new deletable entity type never requires touching this file.
 */
import { $id } from '../../utils/dom.js';
import { eventBus } from '../../core/EventBus.js';
import { closePanels } from './panels.js';

let pendingId = null;
let pendingType = null;

// Bulk-delete uses the SAME shared dialog (#paConfirmOverlay) rather than a
// second overlay per page. `pendingBulkConfirm`, when set, takes priority
// over the id/type flow above and just invokes a callback on confirm.
let pendingBulkConfirm = null;
let bulkTitleBackup = null;

/**
 * Open the confirm dialog.
 * @param {string|number} id
 * @param {string} type Matches the `type` a module listens for on `confirm:confirmed`.
 * @param {string} name Display name interpolated into the confirmation copy.
 * @param {string} [extraInfo] Extra sentence appended (e.g. "This category has 3 projects.").
 */
export function requestDelete(id, type, name, extraInfo = '') {
  pendingId = id;
  pendingType = type;
  let text = `This will permanently remove <strong>${name}</strong>.`;
  if (extraInfo) text += ` ${extraInfo}`;
  text += ' This action cannot be undone.';
  const textEl = $id('paConfirmText');
  if (textEl) textEl.innerHTML = text;
  $id('paConfirmOverlay')?.classList.add('visible');
}

/**
 * Open the same shared confirm dialog for a bulk (multi-item) delete.
 * Used by {@link BulkSelectController} so every page's "Delete Selected"
 * action reuses `#paConfirmOverlay` instead of needing its own bulk dialog.
 * @param {object} opts
 * @param {string} [opts.title] Temporarily replaces the dialog title; restored on close.
 * @param {string} opts.message HTML for the confirmation copy.
 * @param {() => void} opts.onConfirm Called once the user confirms.
 */
export function requestBulkAction({ title, message, onConfirm }) {
  pendingBulkConfirm = onConfirm;
  const titleEl = $id('paConfirmTitle');
  const textEl = $id('paConfirmText');
  if (titleEl && title) {
    if (bulkTitleBackup === null) bulkTitleBackup = titleEl.textContent;
    titleEl.textContent = title;
  }
  if (textEl) textEl.innerHTML = message;
  $id('paConfirmOverlay')?.classList.add('visible');
}

function restoreBulkTitle() {
  if (bulkTitleBackup !== null) {
    const titleEl = $id('paConfirmTitle');
    if (titleEl) titleEl.textContent = bulkTitleBackup;
    bulkTitleBackup = null;
  }
}

export function closeConfirm() {
  $id('paConfirmOverlay')?.classList.remove('visible');
  pendingId = null;
  pendingType = null;
  if (pendingBulkConfirm) {
    pendingBulkConfirm = null;
    restoreBulkTitle();
  }
}

function performDelete() {
  if (pendingBulkConfirm) {
    const cb = pendingBulkConfirm;
    pendingBulkConfirm = null;
    $id('paConfirmOverlay')?.classList.remove('visible');
    restoreBulkTitle();
    cb();
    return;
  }
  if (pendingId == null || pendingType == null) return;
  const { id, type } = { id: pendingId, type: pendingType };
  closeConfirm();
  closePanels();
  eventBus.emit('confirm:confirmed', { id, type });
}

/** Wire the dialog's own buttons once at boot. Called from ShellModule. */
export function initConfirmDialog() {
  $id('paConfirmCancel')?.addEventListener('click', closeConfirm);
  $id('paConfirmOk')?.addEventListener('click', performDelete);
  $id('paConfirmOverlay')?.addEventListener('click', (e) => {
    if (e.target.id === 'paConfirmOverlay') closeConfirm();
  });
}

/** True while the confirm dialog is open — used by the global Escape-key handler. */
export function isConfirmOpen() {
  return !!$id('paConfirmOverlay')?.classList.contains('visible');
}
