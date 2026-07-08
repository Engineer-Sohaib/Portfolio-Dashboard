import { CrudCardModule } from '../../core/CrudCardModule.js';
import { escapeHtml, $id } from '../../utils/dom.js';
import { isValidCategoryKey } from '../../utils/strings.js';
import { storage } from '../../core/StorageService.js';
import { setButtonLoading, closePanels } from '../../modules/shell/panels.js';

export const DEFAULT_CATEGORY_META = {
  enterprise: { label: 'Enterprise Platform', cls: 'pa-cat-enterprise', desc: 'Large-scale business and enterprise web applications.' },
  educational: { label: 'Educational Platform', cls: 'pa-cat-educational', desc: 'E-learning platforms, portals, and educational tools.' },
  desktop: { label: 'Desktop Application', cls: 'pa-cat-desktop', desc: 'Windows, macOS, or cross-platform desktop software.' },
  medical: { label: 'Medical System', cls: 'pa-cat-medical', desc: 'Healthcare management, patient records, and clinical tools.' },
};

const CATEGORY_ICONS = {
  enterprise: 'ri-building-2-line', educational: 'ri-graduation-cap-line', desktop: 'ri-computer-line',
  medical: 'ri-heart-pulse-line', ecommerce: 'ri-shopping-bag-line', travel: 'ri-flight-takeoff-line',
  web: 'ri-globe-line', nonprofit: 'ri-hand-heart-line',
};
const DEFAULT_CAT_ICON = 'ri-folder-line';

/**
 * Categories are keyed by string slug rather than a numeric id, so this
 * module stores records internally as `{ key, label, cls, desc }` objects
 * (the generic engine's `idField: 'key'`) while persisting to the original
 * `{ [key]: {label,cls,desc} }` map shape for storage compatibility.
 */
export class CategoriesModule extends CrudCardModule {
  constructor() {
    super({
      name: 'Categories',
      storageKey: 'pa_category_meta',
      deleteType: 'category',
      idField: 'key',
      page: 'categories',
      pageSize: Infinity,
      cardIdAttr: 'data-cat-key',
      bulkLabel: 'category',
      tabGroup: null,
      addFocusId: 'catAddKey',
      editFocusId: 'catEditLabel',
      ids: {
        grid: 'paCatGrid', resultCount: 'paCatResultCount',
        paginationBtns: 'paCatPaginationBtns', paginationInfo: 'paCatPaginationInfo',
        pagePrev: 'paCatPagePrev', pageNext: 'paCatPageNext', bodyScroll: 'paCatBody',
        emptyResetBtn: 'paCatEmptyResetBtn', emptyAddBtn: 'paCatEmptyAddBtn',
        addPanel: 'paCatAddPanel', editPanel: 'paCatEditPanel',
        addSubmit: 'paCatAddSubmit', editSubmit: 'paCatEditSubmit', editDelete: null,
        addNewBtn: 'paCatAddNewBtn', addPanelClose: 'paCatAddPanelClose', editPanelClose: 'paCatEditPanelClose',
        addCancel: 'paCatAddCancel', editCancel: 'paCatEditCancel',
      },
      menuActions: { 'copy-key': function copyKey(key) { this.copyCategoryKey(key); } },
    });
  }

  // ---- persistence: map <-> array bridge --------------------------------

  async load() {
    const raw = await storage.get(this.storageKey, null);
    const map = raw && typeof raw === 'object' ? { ...DEFAULT_CATEGORY_META, ...raw } : { ...DEFAULT_CATEGORY_META };
    const records = Object.entries(map).map(([key, meta]) => ({ key, ...meta }));
    this.store.set('records', records);
  }

  async persist() {
    const map = {};
    this.store.get('records').forEach((r) => { map[r.key] = { label: r.label, cls: r.cls, desc: r.desc }; });
    await this.saveRecords(map);
  }

  getProjectCountForCategory(key) {
    // Cross-module read: Categories displays a live project count without
    // importing ProjectsModule — it reads the Projects module's own storage
    // key directly. This is a deliberate, narrow exception to "modules only
    // talk through the bus": it's a read of another module's persisted
    // output, not a call into its runtime code.
    try {
      const raw = localStorage.getItem('pa_projects');
      if (raw) {
        const projects = JSON.parse(raw);
        return Array.isArray(projects) ? projects.filter((p) => p.catKey === key).length : '—';
      }
    } catch { /* ignore */ }
    return '—';
  }

  // ---- CrudCardModule overrides -----------------------------------------

  seedData() { return Object.entries(DEFAULT_CATEGORY_META).map(([key, meta]) => ({ key, ...meta })); }

  matchesSearch(record, query) {
    const q = query.trim().toLowerCase();
    return record.key.toLowerCase().includes(q) || record.label.toLowerCase().includes(q) || (record.desc || '').toLowerCase().includes(q);
  }

  getDeleteName(record) { return record.label; }

  renderCard(record, index) {
    const icon = CATEGORY_ICONS[record.key] || DEFAULT_CAT_ICON;
    const count = this.getProjectCountForCategory(record.key);
    const isDefault = record.key in DEFAULT_CATEGORY_META;
    const desc = record.desc || '';
    return `<div class="pa-card${this.bulkSelect?.cardClass(record.key) || ''}" data-cat-key="${escapeHtml(record.key)}" style="animation-delay:${Math.min(index, 12) * 40}ms;"><div class="pa-card-img" style="height:110px;">${this.bulkSelect?.checkboxHtml(record.key, `Select ${escapeHtml(record.label)}`) || ''}<div class="pa-card-img-inner" style="background:var(--pa-bg-card);"><div style="display:flex;flex-direction:column;align-items:center;justify-content:center;gap:6px;width:100%;"><div style="width:52px;height:52px;border-radius:14px;background:var(--pa-bg-chip);border:1px solid var(--pa-border-soft);display:flex;align-items:center;justify-content:center;"><i class="${icon} ${record.cls}" style="font-size:24px;"></i></div><span style="font-family:var(--pa-font-mono);font-size:9.5px;color:var(--pa-text-faint);background:var(--pa-bg-chip);border:1px solid var(--pa-border-soft);border-radius:4px;padding:2px 7px;">${escapeHtml(record.cls)}</span></div></div>${isDefault ? `<span class="pa-featured-badge" style="background:var(--pa-text-ghost);box-shadow:none;">Built-in</span>` : ''}</div><div class="pa-card-body"><div class="pa-card-title" title="${escapeHtml(record.label)}">${escapeHtml(record.label)}</div><div class="pa-card-category ${escapeHtml(record.cls)}">${escapeHtml(record.key)}</div><div class="pa-card-desc">${escapeHtml(desc) || '<em style="color:var(--pa-text-ghost);">No description</em>'}</div><div class="pa-card-tags" style="margin-bottom:0;"><span class="pa-tag mb-10"><i class="ri-apps-line" style="font-size:10px;margin-right:3px;"></i>${escapeHtml(String(count))} project${count === 1 ? '' : 's'}</span></div><div class="pa-card-actions"><button class="pa-action-btn pa-action-edit" data-cat-key="${escapeHtml(record.key)}" title="Edit category" aria-label="Edit ${escapeHtml(record.label)}"><i class="ri-pencil-line"></i></button><button class="pa-action-btn pa-action-delete" data-cat-key="${escapeHtml(record.key)}" title="Delete category" aria-label="Delete ${escapeHtml(record.label)}"><i class="ri-delete-bin-line"></i></button><button class="pa-action-btn pa-action-more" data-cat-key="${escapeHtml(record.key)}" title="More options" aria-label="More options for ${escapeHtml(record.label)}"><i class="ri-more-2-fill"></i></button><div class="pa-card-menu" data-cat-key="${escapeHtml(record.key)}"><div class="pa-card-menu-item" data-action="duplicate" data-cat-key="${escapeHtml(record.key)}"><i class="ri-file-copy-line"></i> Duplicate</div><div class="pa-card-menu-item" data-action="copy-key" data-cat-key="${escapeHtml(record.key)}"><i class="ri-clipboard-line"></i> Copy key</div><div class="pa-card-menu-item danger" data-action="delete" data-cat-key="${escapeHtml(record.key)}"><i class="ri-delete-bin-line"></i> Delete</div></div></div></div></div>`;
  }

  renderPagination() { /* Categories page has no pagination UI in the original design. */ }

  setViewModeFromStore() {
    const mode = this.store.get('viewMode') || 'grid';
    
    // Categories page uses paCatGridViewBtn and paCatListViewBtn
    const gridBtn = $id('paCatGridViewBtn') || $id('paGridViewBtn');
    const listBtn = $id('paCatListViewBtn') || $id('paListViewBtn');
    
    if (gridBtn) {
      gridBtn.classList.toggle('active', mode === 'grid');
    }
    if (listBtn) {
      listBtn.classList.toggle('active', mode === 'list');
    }
    
    document.querySelectorAll('.pa-view-btn[data-view]').forEach(btn => {
      const view = btn.dataset.view;
      if (view === 'grid') {
        btn.classList.toggle('active', mode === 'grid');
      } else if (view === 'list') {
        btn.classList.toggle('active', mode === 'list');
      }
    });
  }

  // Override render to include view mode sync
  render() {
    const { ids } = this.config;
    const all = this.getFiltered();
    const grid = $id(ids.grid);
    
    if (grid) {
      grid.classList.toggle('list-view', this.store.get('viewMode') === 'list');
      if (all.length === 0) {
        const hasFilters = !!(this.store.get('searchQuery') || '').trim() || Object.values(this.store.get('filters')).some((v) => v && v !== 'all');
        grid.innerHTML = `<div class="pa-empty-state"><i class="ri-folder-open-line"></i><div class="pa-empty-state-title">${hasFilters ? 'No categories match your filters' : 'No categories yet'}</div><div class="pa-empty-state-text">${hasFilters ? "Try adjusting your search or filters to find what you're looking for." : 'Get started by adding your first category.'}</div>${hasFilters ? `<button class="pa-empty-state-btn" id="${ids.emptyResetBtn}">Reset filters</button>` : `<button class="pa-empty-state-btn" id="${ids.emptyAddBtn}">+ Add Category</button>`}</div>`;
        this.on($id(ids.emptyResetBtn), 'click', () => this.resetFilters());
        this.on($id(ids.emptyAddBtn), 'click', () => this.openAddPanel());
      } else {
        grid.innerHTML = all.map((r, i) => this.renderCard(r, i)).join('');
        Array.from(grid.children).forEach((card, i) => {
          card.style.animationDelay = `${Math.min(i, 8) * 35}ms`;
        });
      }
    }

    const resultCount = $id(ids.resultCount);
    const total = this.store.get('records').length;
    if (resultCount) {
      resultCount.textContent = all.length === total ? `${total} total` : `${all.length} of ${total}`;
    }

    this.attachCardListeners();
    this.bulkSelect?.onRender();
    this.onAfterRender();
    this.setViewModeFromStore();
  }

  copyCategoryKey(key) {
    navigator.clipboard?.writeText(key).then(
      () => this.toast(`Copied key "${key}" to clipboard.`, 'success', 2000),
      () => this.toast('Clipboard not available in this context.', 'danger'),
    );
  }

  buildDuplicate(record) {
    let newKey = `${record.key}-copy`;
    let suffix = 2;
    const existingKeys = new Set(this.store.get('records').map((r) => r.key));
    while (existingKeys.has(newKey)) newKey = `${record.key}-copy-${suffix++}`;
    return { key: newKey, label: `${record.label} (Copy)`, cls: record.cls, desc: record.desc || '' };
  }

  duplicateRecord(id) {
    const record = this.findById(id);
    if (!record) return;
    const copy = this.buildDuplicate(record);
    this.store.set('records', this.store.get('records').concat(copy));
    this.persist();
    this.render();
    this.toast(`Duplicated as "${copy.key}". Edit it to customise.`, 'info');
  }

  // ---- forms --------------------------------------------------------------

  resetAddForm() {
    ['catAddKey', 'catAddLabel', 'catAddCls', 'catAddDesc'].forEach((id) => { const el = $id(id); if (el) el.value = ''; });
    $id('catAddDescCount').textContent = '0';
    ['catAddKey', 'catAddLabel', 'catAddCls'].forEach((id) => {
      $id(id + 'Error')?.classList.remove('visible');
      $id(id)?.classList.remove('error');
    });
    this.updateClsPreview('catAdd', '');
  }

  populateEditForm(record) {
    $id('catEditKey').value = record.key;
    $id('catEditLabel').value = record.label;
    $id('catEditCls').value = record.cls;
    $id('catEditDesc').value = record.desc || '';
    $id('catEditDescCount').textContent = (record.desc || '').length;
    ['catEditLabel', 'catEditCls'].forEach((id) => {
      $id(id + 'Error')?.classList.remove('visible');
      $id(id)?.classList.remove('error');
    });
    this.updateClsPreview('catEdit', record.cls, record.label);
  }

  updateClsPreview(prefix, cls, label) {
    const wrap = $id(`${prefix}ClsPreview`);
    const swatch = $id(`${prefix}ClsPreviewLabel`);
    if (!wrap || !swatch) return;
    if (cls) {
      swatch.className = `pa-card-category ${cls}`;
      swatch.textContent = label || cls;
      wrap.style.display = 'block';
    } else {
      wrap.style.display = 'none';
    }
  }

  _setFieldError(id, valid, message) {
    const input = $id(id);
    const err = $id(id + 'Error');
    input?.classList.toggle('error', !valid);
    err?.classList.toggle('visible', !valid);
    if (!valid && message && err) {
      const span = err.querySelector('span');
      if (span) span.textContent = message;
    }
  }

  validateForm(prefix) {
    const isAdd = prefix === 'add';
    let valid = true;
    let key = isAdd ? $id('catAddKey').value.trim() : this.currentEditId;

    if (isAdd) {
      if (!key) {
        this._setFieldError('catAddKey', false, 'Category key is required');
        valid = false;
      } else if (!isValidCategoryKey(key)) {
        this._setFieldError('catAddKey', false, 'Key must be lowercase letters, digits, or hyphens (e.g. "my-cat")');
        valid = false;
      } else if (this.findById(key)) {
        this._setFieldError('catAddKey', false, `Key "${key}" already exists`);
        valid = false;
      } else {
        this._setFieldError('catAddKey', true);
      }
    }

    const p = isAdd ? 'catAdd' : 'catEdit';
    const label = $id(`${p}Label`).value.trim();
    if (!label) { this._setFieldError(`${p}Label`, false); valid = false; } else { this._setFieldError(`${p}Label`, true); }

    const cls = $id(`${p}Cls`).value;
    if (!cls) { this._setFieldError(`${p}Cls`, false); valid = false; } else { this._setFieldError(`${p}Cls`, true); }

    const desc = $id(`${p}Desc`).value.trim();
    return { valid, key, label, cls, desc };
  }

  buildNewRecord(fields) {
    return { key: fields.key, label: fields.label, cls: fields.cls, desc: fields.desc };
  }

  applyEditToRecord(record, fields) {
    record.label = fields.label;
    record.cls = fields.cls;
    record.desc = fields.desc;
  }

  // handleAddSubmit override: category id is the key itself, not an auto-increment.
  handleAddSubmit() {
    const result = this.validateForm('add');
    if (!result.valid) { this.toast('Please fill in all required fields', 'danger'); return; }
    setButtonLoading('paCatAddSubmit', true);
    setTimeout(() => {
      this.store.set('records', this.store.get('records').concat(this.buildNewRecord(result)));
      this.persist();
      setButtonLoading('paCatAddSubmit', false);
      closePanels();
      this.render();
      this.toast(`Category "${result.label}" added successfully.`, 'success');
      this.notify(`New category "${result.label}" was added.`, 'ri-folder-add-line');
    }, 400);
  }

  handleEditSubmit() {
    const result = this.validateForm('edit');
    if (!result.valid) { this.toast('Please fill in all required fields', 'danger'); return; }
    setButtonLoading('paCatEditSubmit', true);
    setTimeout(() => {
      const record = this.findById(this.currentEditId);
      if (record) this.applyEditToRecord(record, result);
      this.persist();
      setButtonLoading('paCatEditSubmit', false);
      closePanels();
      this.render();
      this.toast(`Category "${result.label}" updated.`, 'success');
      this.currentEditId = null;
    }, 350);
  }

  // ---- events ---------------------------------------------------------------

  bindEvents() {
    super.bindEvents();
    
    // Categories uses custom search IDs, so we need to handle them separately
    const searchInput = $id('paCatSearchInput');
    if (searchInput) {
      this.on(searchInput, 'input', () => {
        this.store.set('searchQuery', searchInput.value);
        this.store.set('page', 1);
        $id('paCatSearchWrap')?.classList.toggle('has-value', !!searchInput.value);
        this.render();
      });
    }
    this.on($id('paCatSearchClear'), 'click', () => {
      if (!searchInput) return;
      searchInput.value = '';
      this.store.set('searchQuery', '');
      $id('paCatSearchWrap')?.classList.remove('has-value');
      this.render();
    });

    // FIX: View mode toggle with proper active class handling for Categories
    const gridBtn = $id('paCatGridViewBtn') || $id('paGridViewBtn');
    const listBtn = $id('paCatListViewBtn') || $id('paListViewBtn');
    
    // Remove existing listeners by cloning
    if (gridBtn) {
      const parent = gridBtn.parentNode;
      const newGridBtn = gridBtn.cloneNode(true);
      parent.replaceChild(newGridBtn, gridBtn);
      this.on(newGridBtn, 'click', () => { 
        this.store.set('viewMode', 'grid'); 
        this.setViewModeFromStore();
        this.render(); 
      });
    }
    
    if (listBtn) {
      const parent = listBtn.parentNode;
      const newListBtn = listBtn.cloneNode(true);
      parent.replaceChild(newListBtn, listBtn);
      this.on(newListBtn, 'click', () => { 
        this.store.set('viewMode', 'list'); 
        this.setViewModeFromStore();
        this.render(); 
      });
    }
  }
}