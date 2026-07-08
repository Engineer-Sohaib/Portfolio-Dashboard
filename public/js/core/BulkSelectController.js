import { $id } from '../utils/dom.js';
import { requestBulkAction } from '../modules/shell/confirm.js';

/**
 * BulkSelectController — the "select mode + bulk action bar" behavior used
 * on the Media Library page, generalized so any feature module (card grid
 * OR table) can opt in with a few lines of config.
 *
 * It owns exactly one thing: a `selectMode` flag + a `Set` of selected ids.
 * It never touches a module's records directly — deleting is delegated back
 * to the module via `onBulkDelete(idsSet)` so each module keeps full control
 * over its own store/persistence/toast copy.
 *
 * Usage in a module:
 *   this.bulkSelect = new BulkSelectController(this, {
 *     containerId: this.config.ids.grid,   // grid or <tbody> id
 *     itemSelector: '.pa-card',            // or 'tr' for a table
 *     idAttr: this.config.cardIdAttr,      // e.g. 'data-blog-id'
 *     label: 'post',                       // used in bar/dialog copy
 *     getVisibleIds: () => this.getFiltered().map((r) => r[this.config.idField]),
 *     onBulkDelete: (ids) => this.bulkDelete(ids),
 *   });
 *
 * In renderCard()/renderRow(): prefix the markup with
 *   this.bulkSelect.checkboxHtml(record.id, `Select ${record.title}`)
 * and add the selected-state class via `this.bulkSelect.cardClass(record.id)`.
 *
 * In render(), after the container's innerHTML is set:
 *   this.bulkSelect.onRender();
 */

const DEFAULT_IDS = {
  selectBtn: 'paSelectModeBtn',
  bar: 'paBulkActionBar',
  count: 'paBulkSelectedCount',
  selectAllBtn: 'paBulkSelectAllBtn',
  clearBtn: 'paBulkClearBtn',
  deleteBtn: 'paBulkDeleteBtn',
};

export class BulkSelectController {
  /**
   * @param {object} module The owning module (needs `.render()`, and optionally `.toast()`).
   * @param {object} opts
   * @param {string} opts.containerId DOM id of the grid/table-body holding the items.
   * @param {string} [opts.itemSelector='.pa-card'] Selector for one selectable item within the container.
   * @param {string} opts.idAttr Attribute on the item element holding its id (e.g. 'data-blog-id').
   * @param {string} [opts.label='item'] Singular noun used in bar/dialog copy.
   * @param {() => Array<string|number>} opts.getVisibleIds Ids currently visible (for "Select All").
   * @param {(ids: Set<string>) => void} opts.onBulkDelete Called with the confirmed id set.
   * @param {object} [opts.ids] Override any of the shared DOM ids (see DEFAULT_IDS).
   */
  constructor(module, opts) {
    this.module = module;
    this.opts = { itemSelector: '.pa-card', label: 'item', ...opts };
    this.ids = { ...DEFAULT_IDS, ...(opts.ids || {}) };
    this.selectMode = false;
    this.selectedIds = new Set();
    this._bound = false;
  }

  isSelectMode() { return this.selectMode; }
  isSelected(id) { return this.selectedIds.has(String(id)); }
  get selectedCount() { return this.selectedIds.size; }

  /** HTML for the per-item checkbox overlay. Hidden (via inline style) outside select mode. */
  checkboxHtml(id, ariaLabel = 'Select item') {
    const selected = this.isSelected(id);
    const hiddenStyle = this.selectMode ? '' : 'display:none;';
    return `<div class="pa-select-checkbox${selected ? ' selected' : ''}" data-select-id="${id}" style="${hiddenStyle}" role="checkbox" aria-checked="${selected}" aria-label="${ariaLabel}" tabindex="0"><i class="${selected ? 'ri-checkbox-fill' : 'ri-checkbox-blank-line'}"></i></div>`;
  }

  /** Extra class to append to an item's root element so selected items get a highlight. */
  cardClass(id) { return this.isSelected(id) ? ' pa-selected' : ''; }

  /** Call once after render()'s innerHTML assignment: wires buttons + item listeners + updates the bar. */
  onRender() {
    this._bindBar();
    this._attachItemListeners();
    this._updateBar();
  }

  _bindBar() {
    if (this._bound) return; // toolbar/bar buttons live outside the re-rendered container; bind once
    const selectBtn = $id(this.ids.selectBtn);
    if (selectBtn) selectBtn.addEventListener('click', () => this.toggleSelectMode());
    const selectAllBtn = $id(this.ids.selectAllBtn);
    if (selectAllBtn) selectAllBtn.addEventListener('click', () => this.selectAllVisible());
    const clearBtn = $id(this.ids.clearBtn);
    if (clearBtn) clearBtn.addEventListener('click', () => this.clearSelection());
    const deleteBtn = $id(this.ids.deleteBtn);
    if (deleteBtn) deleteBtn.addEventListener('click', () => this.requestBulkDelete());
    this._bound = true;
  }

  _attachItemListeners() {
    const container = $id(this.opts.containerId);
    if (!container) return;
    container.querySelectorAll('[data-select-id]').forEach((box) => {
      box.addEventListener('click', (e) => { e.stopPropagation(); this.toggleSelect(box.dataset.selectId); });
      if (box.tagName !== 'INPUT') {
        box.addEventListener('keydown', (e) => {
          if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); this.toggleSelect(box.dataset.selectId); }
        });
      }
    });
    container.querySelectorAll(this.opts.itemSelector).forEach((item) => {
      item.addEventListener('click', (e) => {
        if (!this.selectMode) return;
        if (e.target.closest('.pa-card-actions, .pa-msg-actions, [data-select-id]')) return;
        const id = item.getAttribute(this.opts.idAttr);
        if (id != null) this.toggleSelect(id);
      });
    });
  }

  toggleSelectMode() {
    this.selectMode = !this.selectMode;
    $id(this.ids.selectBtn)?.classList.toggle('active', this.selectMode);
    if (!this.selectMode) this.selectedIds.clear();
    this.module.render();
  }

  toggleSelect(id) {
    const key = String(id);
    if (this.selectedIds.has(key)) this.selectedIds.delete(key);
    else this.selectedIds.add(key);
    this.module.render();
  }

  selectAllVisible() {
    const visible = this.opts.getVisibleIds();
    visible.forEach((id) => this.selectedIds.add(String(id)));
    this.module.render();
    const n = this.selectedIds.size;
    this.module.toast?.(`Selected ${n} item${n === 1 ? '' : 's'}.`, 'info', 1800);
  }

  clearSelection() {
    this.selectedIds.clear();
    this.module.render();
    this.module.toast?.('Selection cleared.', 'info', 1500);
  }

  _updateBar() {
    const bar = $id(this.ids.bar);
    if (!bar) return;
    const size = this.selectedIds.size;
    if (this.selectMode && size > 0) {
      bar.style.display = 'flex';
      const count = $id(this.ids.count);
      if (count) count.textContent = `${size} selected`;
    } else {
      bar.style.display = 'none';
    }
  }

  requestBulkDelete() {
    const n = this.selectedIds.size;
    if (n === 0) return;
    const label = this.opts.label;
    requestBulkAction({
      title: `Delete selected ${label}${n > 1 ? 's' : ''}?`,
      message: `This will permanently remove <strong>${n}</strong> selected ${label}${n > 1 ? 's' : ''}. This action cannot be undone.`,
      onConfirm: () => this._performBulkDelete(),
    });
  }

  _performBulkDelete() {
    const ids = new Set(this.selectedIds);
    if (ids.size === 0) return;
    this.selectedIds.clear();
    this.opts.onBulkDelete(ids);
  }
}
