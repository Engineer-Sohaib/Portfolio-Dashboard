/**
 * panels.js — shared slide-over panel plumbing (open/close, overlay, tabs,
 * button loading state). Every Add/Edit/Upload panel in the app is just a
 * `.pa-panel` element with a `.visible` class toggle plus one shared overlay
 * (`#paPanelOverlay`), so this file owns that mechanic once instead of each
 * module reimplementing "close every *other* panel, show mine, show overlay".
 *
 * Extensibility: modules call `registerPanel(id)` when they boot, instead of
 * this file hardcoding a 14-entry id list (as the legacy `anyPanelOpen`/
 * `closePanels` did). Adding a new feature module's panel therefore never
 * requires editing this file — satisfying the "easy to add new features
 * without modifying existing modules" success criterion.
 */
import { $id } from '../../utils/dom.js';

const registeredPanelIds = new Set();

/** Called once per panel id by a module's `bindEvents()`. Idempotent. */
export function registerPanel(id) {
  registeredPanelIds.add(id);
}

export function anyPanelOpen() {
  return Array.from(registeredPanelIds).some((id) => $id(id)?.classList.contains('visible'));
}

/** Hide the overlay and every registered panel. */
export function closePanels() {
  $id('paPanelOverlay')?.classList.remove('visible');
  registeredPanelIds.forEach((id) => $id(id)?.classList.remove('visible'));
}

/**
 * Show one panel (and the shared overlay), hiding any other panel passed in
 * `hidePanelIds` first (typically its Add/Edit sibling).
 * @param {string} panelId
 * @param {string[]} [hidePanelIds]
 */
export function openPanel(panelId, hidePanelIds = []) {
  hidePanelIds.forEach((id) => $id(id)?.classList.remove('visible'));
  $id('paPanelOverlay')?.classList.add('visible');
  $id(panelId)?.classList.add('visible');
}

export function setButtonLoading(btnId, loading) {
  const btn = $id(btnId);
  if (!btn) return;
  btn.classList.toggle('loading', loading);
  btn.disabled = loading;
}

/**
 * Activate a tab within a `data-panel="<panel>"` group (tab buttons +
 * corresponding `.pa-tab-panel` content panes), and scroll the panel body
 * back to the top — matches legacy `activateTab`.
 */
export function activateTab(panel, tab) {
  document.querySelectorAll(`.pa-panel-tab[data-panel="${panel}"]`).forEach((btn) => {
    btn.classList.toggle('active', btn.dataset.tab === tab);
  });
  document.querySelectorAll(`.pa-tab-panel[data-panel="${panel}"]`).forEach((pane) => {
    pane.classList.toggle('active', pane.dataset.content === tab);
  });
  const panelId = document.querySelector(`.pa-panel[data-panel="${panel}"]`)?.id;
  const body = panelId ? document.querySelector(`#${panelId} .pa-panel-body`) : null;
  if (body) body.scrollTop = 0;
}
