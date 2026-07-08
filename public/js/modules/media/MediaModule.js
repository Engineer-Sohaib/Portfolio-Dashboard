import { Module } from '../../core/Module.js';
import { $id, $all, escapeHtml } from '../../utils/dom.js';
import { formatFileSize, formatDate } from '../../utils/format.js';
import { appendCopySuffix } from '../../utils/strings.js';
import { readFileAsDataUrl, handleFileValidation } from '../../utils/files.js';
import { requestDelete } from '../../modules/shell/confirm.js';
import { closeAllCardMenus } from '../../modules/shell/cardMenu.js';
import { openPanel, closePanels, setButtonLoading, registerPanel } from '../../modules/shell/panels.js';
import { PAGE } from '../../core/router.js';
import { eventBus } from '../../core/EventBus.js';

export const FOLDER_META = {
  general: { label: 'General', icon: 'ri-folder-line', color: '#9a9aa0' },
  projects: { label: 'Project Screenshots', icon: 'ri-apps-line', color: '#60a5fa' },
  avatars: { label: 'Avatars & Profile', icon: 'ri-user-3-line', color: '#a78bfa' },
  icons: { label: 'Icons & Logos', icon: 'ri-shapes-line', color: '#34d399' },
  blog: { label: 'Blog Posts', icon: 'ri-article-line', color: '#fb923c' },
  testimonials: { label: 'Testimonials', icon: 'ri-chat-quote-line', color: '#f472b6' },
};

export const SEED_MEDIA = [
  { id: 1, name: 'altahaluf-dashboard-hero.png', url: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=600&q=60', alt: 'Enterprise dashboard interface screenshot', folder: 'projects', size: 482000, type: 'image/png', uploadedAt: '2026-04-02T10:15:00Z', usageCount: 1 },
  { id: 2, name: 'nsric-education-banner.jpg', url: 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=600&q=60', alt: 'Online education platform banner', folder: 'projects', size: 351000, type: 'image/jpeg', uploadedAt: '2026-04-05T14:30:00Z', usageCount: 1 },
  { id: 3, name: 'admin-avatar-default.png', url: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=300&q=60', alt: 'Default admin user avatar', folder: 'avatars', size: 84000, type: 'image/png', uploadedAt: '2026-03-18T09:00:00Z', usageCount: 1 },
  { id: 4, name: 'react-logo-icon.png', url: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=300&q=60', alt: 'React framework icon', folder: 'icons', size: 12000, type: 'image/png', uploadedAt: '2026-03-20T11:45:00Z', usageCount: 4 },
];

const PAGE_SIZE = 12;

export class MediaModule extends Module {
  constructor() {
    super({
      name: 'Media',
      storageKey: 'pa_media_library',
      initialState: {
        records: [], searchQuery: '', folderFilter: 'all', viewMode: 'grid', page: 1,
        selectMode: false, selectedIds: new Set(),
      },
    });
    this.nextId = 1;
    this.currentEditId = null;
    this.stagedFiles = [];
  }

  async load() {
    const records = await this.loadRecords(() => SEED_MEDIA.map((m) => ({ ...m })));
    this.nextId = Math.max(0, ...records.map((m) => m.id)) + 1;
    this.store.set('records', records);
  }

  async persist() { await this.saveRecords(this.store.get('records')); }

  getFiltered() {
    const { records, searchQuery, folderFilter } = this.store._raw;
    let result = records.slice().sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt));
    if (folderFilter !== 'all') result = result.filter((m) => m.folder === folderFilter);
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      result = result.filter(
        (m) => m.name.toLowerCase().includes(q) || (m.alt || '').toLowerCase().includes(q) || (FOLDER_META[m.folder]?.label || m.folder).toLowerCase().includes(q),
      );
    }
    return result;
  }

  findById(id) { return this.store.get('records').find((m) => m.id === id); }

  // ---- rendering ------------------------------------------------------------

  buildCard(item, index) {
    const fm = FOLDER_META[item.folder] || FOLDER_META.general;
    const selectMode = this.store.get('selectMode');
    const isSelected = this.store.get('selectedIds').has(item.id);
    const checkboxHtml = `<div class="pa-star-btn" data-select-id="${item.id}" style="left:10px;right:auto;${selectMode ? '' : 'display:none;'}${isSelected ? 'color:var(--pa-orange);border-color:rgba(255,102,0,0.5);' : ''}" role="checkbox" aria-checked="${isSelected}" aria-label="Select ${escapeHtml(item.name)}" tabindex="0"><i class="${isSelected ? 'ri-checkbox-fill' : 'ri-checkbox-blank-line'}"></i></div>`;
    return `<div class="pa-card" data-media-id="${item.id}" style="animation-delay:${Math.min(index, 11) * 35}ms;${isSelected ? 'border-color:var(--pa-orange);background: var(--pa-orange-dim)' : ''}"><div class="pa-card-img"><div class="pa-card-img-inner" style="padding:0;"><img class="pa-thumb-img" src="${escapeHtml(item.url)}" alt="${escapeHtml(item.alt || item.name)}" loading="lazy" /></div>${checkboxHtml}<span class="pa-featured-badge" style="background:${escapeHtml(fm.color)};box-shadow:none;"><i class="${escapeHtml(fm.icon)}" style="font-size:9px;margin-right:3px;vertical-align:-1px;"></i>${escapeHtml(fm.label)}</span></div><div class="pa-card-body"><div class="pa-card-title" title="${escapeHtml(item.name)}">${escapeHtml(item.name)}</div><div class="pa-card-category" style="color:var(--pa-text-faint);font-weight:500;">${escapeHtml(formatFileSize(item.size))} · ${escapeHtml((item.type || '').replace('image/', '').toUpperCase() || 'IMG')}</div><div class="pa-card-desc" style="-webkit-line-clamp:1;">${item.alt ? escapeHtml(item.alt) : '<em style="color:var(--pa-text-ghost);">No alt text set</em>'}</div><div class="pa-card-tags"><span class="pa-tag"><i class="ri-calendar-line" style="font-size:9px;margin-right:3px;"></i>${escapeHtml(formatDate(item.uploadedAt))}</span>${item.usageCount > 0 ? `<span class="pa-tag"><i class="ri-links-line" style="font-size:9px;margin-right:3px;"></i>Used ×${item.usageCount}</span>` : `<span class="pa-tag"><i class="ri-links-line" style="font-size:9px;margin-right:3px;"></i>Unused</span>`}</div><div class="pa-card-actions"><button class="pa-action-btn pa-action-view" data-media-id="${item.id}" title="View full size" aria-label="View ${escapeHtml(item.name)} full size"><i class="ri-eye-line"></i></button><button class="pa-action-btn pa-action-edit" data-media-id="${item.id}" title="Edit details" aria-label="Edit details for ${escapeHtml(item.name)}"><i class="ri-pencil-line"></i></button><button class="pa-action-btn pa-action-delete" data-media-id="${item.id}" title="Delete" aria-label="Delete ${escapeHtml(item.name)}"><i class="ri-delete-bin-line"></i></button><button class="pa-action-btn pa-action-more" data-media-id="${item.id}" title="More options" aria-label="More options for ${escapeHtml(item.name)}"><i class="ri-more-2-fill"></i></button><div class="pa-card-menu" data-media-id="${item.id}"><div class="pa-card-menu-item" data-action="copy-url" data-media-id="${item.id}"><i class="ri-links-line"></i> Copy URL</div><div class="pa-card-menu-item" data-action="download" data-media-id="${item.id}"><i class="ri-download-2-line"></i> Download</div><div class="pa-card-menu-item" data-action="duplicate" data-media-id="${item.id}"><i class="ri-file-copy-line"></i> Duplicate entry</div><div class="pa-card-menu-item danger" data-action="delete" data-media-id="${item.id}"><i class="ri-delete-bin-line"></i> Delete</div></div></div></div></div>`;
  }

  render() {
    const all = this.getFiltered();
    const totalItems = all.length;
    const totalPages = Math.max(1, Math.ceil(totalItems / PAGE_SIZE));
    let page = this.store.get('page');
    if (page > totalPages) page = totalPages;
    if (page < 1) page = 1;
    this.store.set('page', page);

    const start = (page - 1) * PAGE_SIZE;
    const pageItems = all.slice(start, start + PAGE_SIZE);
    const grid = $id('paMediaGrid');
    if (grid) {
      grid.classList.toggle('list-view', this.store.get('viewMode') === 'list');
      if (pageItems.length === 0) {
        const hasFilters = this.store.get('searchQuery').trim() || this.store.get('folderFilter') !== 'all';
        grid.innerHTML = `<div class="pa-empty-state"><i class="ri-image-line"></i><div class="pa-empty-state-title">${hasFilters ? 'No media matches your filters' : 'No media files yet'}</div><div class="pa-empty-state-text">${hasFilters ? "Try adjusting your search or folder filter to find what you're looking for." : 'Upload your first image to start building your media library.'}</div>${hasFilters ? `<button class="pa-empty-state-btn" id="paMediaEmptyResetBtn">Reset filters</button>` : `<button class="pa-empty-state-btn" id="paMediaEmptyUploadBtn">+ Upload Media</button>`}</div>`;
        this.on($id('paMediaEmptyResetBtn'), 'click', () => this.resetFilters());
        this.on($id('paMediaEmptyUploadBtn'), 'click', () => this.openUploadPanel());
      } else {
        grid.innerHTML = pageItems.map((m, i) => this.buildCard(m, i)).join('');
        Array.from(grid.children).forEach((card, i) => { card.style.animationDelay = `${Math.min(i, 11) * 35}ms`; });
      }
    }

    const resultCount = $id('paResultCount');
    const total = this.store.get('records').length;
    if (resultCount) resultCount.textContent = totalItems === total ? `${total} total` : `${totalItems} of ${total}`;

    this.renderPagination(totalItems, totalPages, page);
    this.attachCardListeners();
    this.updateBulkBar();
    this.setViewModeFromStore();
  }

  setViewModeFromStore() {
    const mode = this.store.get('viewMode') || 'grid';
    
    const gridBtn = $id('paGridViewBtn');
    const listBtn = $id('paListViewBtn');
    
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

  renderPagination(totalItems, totalPages, page) {
    const btnsWrap = $id('paMediaPaginationBtns');
    const info = $id('paMediaPaginationInfo');
    if (!btnsWrap || !info) return;
    if (totalItems === 0) { btnsWrap.innerHTML = ''; info.textContent = 'Showing 0 results'; return; }
    if (totalPages <= 1) { btnsWrap.innerHTML = ''; info.textContent = `${totalItems} ${totalItems === 1 ? 'file' : 'files'}`; return; }

    let html = `<div class="pa-page-nav ${page === 1 ? 'disabled' : ''}" id="paMediaPagePrev" role="button" aria-label="Previous page"><i class="ri-arrow-left-s-line"></i></div>`;
    let lastShown = 0;
    for (let p = 1; p <= totalPages; p++) {
      const show = p === 1 || p === totalPages || Math.abs(p - page) <= 1;
      if (!show) continue;
      if (p - lastShown > 1) html += `<span style="color:var(--pa-text-faint);padding:0 4px;font-size:12px;">…</span>`;
      html += `<button class="pa-page-btn ${p === page ? 'active' : ''}" data-page="${p}">${p}</button>`;
      lastShown = p;
    }
    html += `<div class="pa-page-nav ${page === totalPages ? 'disabled' : ''}" id="paMediaPageNext" role="button" aria-label="Next page"><i class="ri-arrow-right-s-line"></i></div>`;
    btnsWrap.innerHTML = html;

    const startN = (page - 1) * PAGE_SIZE + 1;
    const endN = Math.min(page * PAGE_SIZE, totalItems);
    info.textContent = `Showing ${startN}–${endN} of ${totalItems}`;

    btnsWrap.querySelectorAll('.pa-page-btn').forEach((btn) => {
      btn.addEventListener('click', () => { this.store.set('page', parseInt(btn.dataset.page, 10)); this.render(); $id('paMediaBody')?.scrollTo({ top: 0, behavior: 'smooth' }); });
    });
    const prev = $id('paMediaPagePrev');
    const next = $id('paMediaPageNext');
    if (prev && !prev.classList.contains('disabled')) prev.addEventListener('click', () => { this.store.set('page', page - 1); this.render(); });
    if (next && !next.classList.contains('disabled')) next.addEventListener('click', () => { this.store.set('page', page + 1); this.render(); });
  }

  resetFilters() {
    this.store.batch(() => {
      this.store.set('searchQuery', '');
      this.store.set('folderFilter', 'all');
      this.store.set('page', 1);
    });
    const searchInput = $id('paSearchInput');
    if (searchInput) { searchInput.value = ''; $id('paSearchWrap')?.classList.remove('has-value'); }
    const folderFilter = $id('paFolderFilter');
    if (folderFilter) folderFilter.value = 'all';
    this.render();
  }

  attachCardListeners() {
    const grid = $id('paMediaGrid');
    if (!grid) return;
    $all('.pa-action-view', grid).forEach((btn) => {
      btn.addEventListener('click', () => {
        const m = this.findById(parseInt(btn.dataset.mediaId, 10));
        if (m) { this.toast(`Opening "${m.name}" in a new tab…`, 'info', 1800); window.open(m.url, '_blank', 'noopener'); }
      });
    });
    $all('.pa-action-edit', grid).forEach((btn) => btn.addEventListener('click', () => this.openMediaEditPanel(parseInt(btn.dataset.mediaId, 10))));
    $all('.pa-action-delete', grid).forEach((btn) => {
      btn.addEventListener('click', () => {
        const m = this.findById(parseInt(btn.dataset.mediaId, 10));
        if (m) requestDelete(m.id, 'media', m.name);
      });
    });
    $all('.pa-action-more', grid).forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = btn.dataset.mediaId;
        const menu = grid.querySelector(`.pa-card-menu[data-media-id="${CSS.escape(id)}"]`);
        grid.querySelectorAll('.pa-card-menu.open').forEach((m) => { if (m !== menu) m.classList.remove('open'); });
        menu?.classList.toggle('open');
      });
    });
    $all('.pa-card-menu-item', grid).forEach((item) => {
      item.addEventListener('click', (e) => {
        e.stopPropagation();
        const action = item.dataset.action;
        const id = parseInt(item.dataset.mediaId, 10);
        closeAllCardMenus();
        if (action === 'delete') { const m = this.findById(id); if (m) requestDelete(id, 'media', m.name); }
        else if (action === 'duplicate') this.duplicateMedia(id);
        else if (action === 'copy-url') this.copyMediaUrl(id);
        else if (action === 'download') this.downloadMedia(id);
      });
    });
    $all('[data-select-id]', grid).forEach((box) => {
      box.addEventListener('click', (e) => { e.stopPropagation(); this.toggleSelect(parseInt(box.dataset.selectId, 10)); });
      box.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); this.toggleSelect(parseInt(box.dataset.selectId, 10)); } });
    });
    $all('.pa-card', grid).forEach((card) => {
      card.addEventListener('click', (e) => {
        if (!this.store.get('selectMode')) return;
        if (e.target.closest('.pa-card-actions') || e.target.closest('[data-select-id]')) return;
        this.toggleSelect(parseInt(card.dataset.mediaId, 10));
      });
    });
  }

  toggleSelect(id) {
    const set = this.store.get('selectedIds');
    set.has(id) ? set.delete(id) : set.add(id);
    this.render();
  }

  toggleSelectMode() {
    const next = !this.store.get('selectMode');
    this.store.set('selectMode', next);
    $id('paSelectModeBtn')?.classList.toggle('active', next);
    if (!next) {
      this.store.get('selectedIds').clear();
      this.updateBulkBar();
    }
    this.render();
  }

  selectAllVisible() {
    const set = this.store.get('selectedIds');
    const visible = this.getFiltered();
    visible.forEach((m) => set.add(m.id));
    this.updateBulkBar();
    this.render();
    this.toast(`Selected ${set.size} item${set.size === 1 ? '' : 's'}.`, 'info', 1800);
  }

  clearSelection() {
    this.store.get('selectedIds').clear();
    this.updateBulkBar();
    this.render();
    this.toast('Selection cleared.', 'info', 1500);
  }

  updateBulkBar() {
    const bar = $id('paBulkActionBar');
    if (!bar) return;
    const size = this.store.get('selectedIds').size;
    const selectMode = this.store.get('selectMode');
    
    // Show the bar when selectMode is true AND there are selected items
    if (selectMode && size > 0) {
      bar.style.display = 'flex';
      const count = $id('paBulkSelectedCount');
      if (count) count.textContent = `${size} selected`;
    } else {
      bar.style.display = 'none';
    }
  }

  requestBulkDelete() {
    const n = this.store.get('selectedIds').size;
    if (n === 0) return;
    const overlay = $id('paBulkConfirmOverlay');
    const text = $id('paBulkConfirmText');
    if (text) {
      text.innerHTML = `This will permanently remove <strong>${n}</strong> selected file${n > 1 ? 's' : ''}. This action cannot be undone.`;
    }
    if (overlay) overlay.classList.add('visible');
  }

  closeBulkConfirm() {
    const overlay = $id('paBulkConfirmOverlay');
    if (overlay) overlay.classList.remove('visible');
  }

  performBulkDelete() {
    const ids = this.store.get('selectedIds');
    const n = ids.size;
    if (n === 0) { 
      this.closeBulkConfirm(); 
      return; 
    }
    this.store.set('records', this.store.get('records').filter((m) => !ids.has(m.id)));
    ids.clear();
    this.persist();
    this.closeBulkConfirm();
    this.updateBulkBar();
    this.render();
    this.toast(`${n} file${n > 1 ? 's' : ''} deleted.`, 'danger');
    this.notify(`${n} media file${n > 1 ? 's' : ''} deleted in bulk.`, 'ri-delete-bin-line');
  }

  duplicateMedia(id) {
    const m = this.findById(id);
    if (!m) return;
    const copy = { ...m, id: this.nextId++, name: appendCopySuffix(m.name), uploadedAt: new Date().toISOString(), usageCount: 0 };
    this.store.set('records', this.store.get('records').concat(copy));
    this.persist();
    this.render();
    this.toast(`Duplicated as "${copy.name}".`, 'info');
  }

  copyMediaUrl(id) {
    const m = this.findById(id);
    if (!m) return;
    navigator.clipboard?.writeText(m.url).then(() => this.toast('URL copied to clipboard.', 'success', 2000), () => this.toast('Clipboard not available.', 'danger'));
  }

  downloadMedia(id) {
    const m = this.findById(id);
    if (!m) return;
    const a = document.createElement('a');
    a.href = m.url;
    a.download = m.name;
    a.target = '_blank';
    a.rel = 'noopener';
    document.body.appendChild(a);
    a.click();
    a.remove();
    this.toast(`Downloading "${m.name}"…`, 'info', 1800);
  }

  deleteById(id) {
    const m = this.findById(id);
    if (!m) return;
    this.store.set('records', this.store.get('records').filter((x) => x.id !== id));
    this.persist();
    closePanels();
    this.render();
    this.toast(`"${m.name}" was deleted.`, 'danger');
    this.notify(`"${m.name}" was deleted.`, 'ri-delete-bin-line');
  }

  // ---- upload panel (staged files) ------------------------------------------

  openUploadPanel() {
    if (PAGE !== 'media') return;
    this.stagedFiles = [];
    this.renderStagedGrid();
    $id('paUploadFolder').value = 'general';
    $id('paUploadAlt').value = '';
    $id('paUploadFilesError').classList.remove('visible');
    $id('paUploadDropzone').classList.remove('error');
    setButtonLoading('paUploadSubmit', false);
    openPanel('paUploadPanel', ['paEditDetailsPanel']);
    setTimeout(() => $id('paUploadDropzone')?.focus(), 320);
  }

  renderStagedGrid() {
    const grid = $id('paUploadStagedGrid');
    if (!grid) return;
    grid.innerHTML = this.stagedFiles
      .map((sf, i) => `<div class="pa-gallery-thumb"><img src="${sf.dataUrl}" alt="${escapeHtml(sf.name)}" /><div class="pa-gallery-thumb-remove" data-i="${i}" role="button" aria-label="Remove ${escapeHtml(sf.name)}"><i class="ri-close-line"></i></div></div>`)
      .join('');
    grid.querySelectorAll('.pa-gallery-thumb-remove').forEach((btn) => {
      btn.addEventListener('click', () => { this.stagedFiles.splice(parseInt(btn.dataset.i, 10), 1); this.renderStagedGrid(); });
    });
    if (this.stagedFiles.length > 0) {
      $id('paUploadFilesError')?.classList.remove('visible');
      $id('paUploadDropzone')?.classList.remove('error');
    }
  }

  async stageFiles(fileList) {
    const files = Array.from(fileList || []);
    let accepted = 0;
    for (const file of files) {
      if (!handleFileValidation(file)) continue;
      try {
        const dataUrl = await readFileAsDataUrl(file);
        this.stagedFiles.push({ file, dataUrl, name: file.name, size: file.size, type: file.type });
        accepted++;
      } catch {
        this.toast(`Could not read "${file.name}".`, 'danger');
      }
    }
    this.renderStagedGrid();
    if (accepted > 0) this.toast(`${accepted} file${accepted > 1 ? 's' : ''} ready to upload.`, 'success', 2000);
  }

  setupUploadDropzone() {
    const dropzone = $id('paUploadDropzone');
    const fileInput = $id('paUploadFileInput');
    if (!dropzone || !fileInput) return;
    this.on(dropzone, 'click', () => fileInput.click());
    this.on(dropzone, 'keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); fileInput.click(); } });
    dropzone.setAttribute('tabindex', '0');
    dropzone.setAttribute('role', 'button');
    this.on(fileInput, 'change', async () => { await this.stageFiles(fileInput.files); fileInput.value = ''; });
    ['dragenter', 'dragover'].forEach((evt) => this.on(dropzone, evt, (e) => { e.preventDefault(); dropzone.classList.add('dragover'); }));
    ['dragleave', 'drop'].forEach((evt) => this.on(dropzone, evt, (e) => { e.preventDefault(); dropzone.classList.remove('dragover'); }));
    this.on(dropzone, 'drop', async (e) => { const files = e.dataTransfer?.files; if (files && files.length) await this.stageFiles(files); });
  }

  handleUploadSubmit() {
    if (PAGE !== 'media' || this.stagedFiles.length === 0) {
      $id('paUploadFilesError')?.classList.add('visible');
      $id('paUploadDropzone')?.classList.add('error');
      this.toast('Please select at least one file to upload.', 'danger');
      return;
    }
    setButtonLoading('paUploadSubmit', true);
    const folder = $id('paUploadFolder').value;
    const altBase = $id('paUploadAlt').value.trim();
    setTimeout(() => {
      const uploadedNames = [];
      const newRecords = this.stagedFiles.map((sf) => {
        const record = { id: this.nextId++, name: sf.name, url: sf.dataUrl, alt: altBase, folder, size: sf.size, type: sf.type, uploadedAt: new Date().toISOString(), usageCount: 0 };
        uploadedNames.push(record.name);
        return record;
      });
      this.store.set('records', this.store.get('records').concat(newRecords));
      this.persist();
      setButtonLoading('paUploadSubmit', false);
      closePanels();
      this.resetFilters();
      this.render();
      const count = uploadedNames.length;
      this.toast(`${count} file${count > 1 ? 's' : ''} uploaded successfully!`, 'success');
      this.notify(count === 1 ? `"${uploadedNames[0]}" was uploaded.` : `${count} files were uploaded.`, 'ri-upload-cloud-2-line');
    }, 500);
  }

  openMediaEditPanel(id) {
    if (PAGE !== 'media') return;
    const m = this.findById(id);
    if (!m) return;
    this.currentEditId = id;
    $id('paEditPreviewImg').src = m.url;
    $id('paEditPreviewImg').alt = m.alt || m.name;
    $id('paEditFileName').value = m.name;
    $id('paEditAlt').value = m.alt || '';
    $id('paEditFolder').value = m.folder;
    $id('paEditFileSize').textContent = formatFileSize(m.size);
    $id('paEditFileDate').textContent = formatDate(m.uploadedAt);
    $id('paEditFileUsage').textContent = m.usageCount > 0 ? `${m.usageCount} place${m.usageCount > 1 ? 's' : ''}` : 'Not currently used';
    $id('paEditFileNameError').classList.remove('visible');
    $id('paEditFileName').classList.remove('error');
    setButtonLoading('paEditDetailsSubmit', false);
    openPanel('paEditDetailsPanel', ['paUploadPanel']);
    setTimeout(() => $id('paEditFileName')?.focus(), 320);
  }

  handleMediaEditSubmit() {
    if (PAGE !== 'media' || this.currentEditId == null) return;
    const name = $id('paEditFileName').value.trim();
    if (!name) {
      $id('paEditFileName').classList.add('error');
      $id('paEditFileNameError').classList.add('visible');
      this.toast('Please fill in all required fields.', 'danger');
      return;
    }
    $id('paEditFileName').classList.remove('error');
    $id('paEditFileNameError').classList.remove('visible');
    setButtonLoading('paEditDetailsSubmit', true);
    setTimeout(() => {
      const m = this.findById(this.currentEditId);
      if (!m) { setButtonLoading('paEditDetailsSubmit', false); return; }
      m.name = name;
      m.alt = $id('paEditAlt').value.trim();
      m.folder = $id('paEditFolder').value;
      this.persist();
      setButtonLoading('paEditDetailsSubmit', false);
      closePanels();
      this.render();
      this.toast(`"${m.name}" updated successfully!`, 'success');
      this.notify(`"${m.name}" details were updated.`, 'ri-pencil-line');
    }, 400);
  }

  // ---- events ---------------------------------------------------------------

  bindEvents() {
    registerPanel('paUploadPanel');
    registerPanel('paEditDetailsPanel');
    this.setupUploadDropzone();

    this.on($id('paUploadNewBtn') || $id('paMediaAddNewBtn'), 'click', () => this.openUploadPanel());
    this.on($id('paUploadPanelClose'), 'click', () => closePanels());
    this.on($id('paEditDetailsPanelClose'), 'click', () => closePanels());
    this.on($id('paUploadCancel'), 'click', () => closePanels());
    this.on($id('paEditDetailsCancel'), 'click', () => closePanels());
    this.on($id('paUploadSubmit'), 'click', () => this.handleUploadSubmit());
    this.on($id('paEditDetailsSubmit'), 'click', () => this.handleMediaEditSubmit());
    this.on($id('paEditDetailsDelete'), 'click', () => {
      const m = this.findById(this.currentEditId);
      if (m) requestDelete(m.id, 'media', m.name);
    });

    const searchInput = $id('paSearchInput');
    if (searchInput) {
      this.on(searchInput, 'input', () => {
        this.store.set('searchQuery', searchInput.value);
        this.store.set('page', 1);
        $id('paSearchWrap')?.classList.toggle('has-value', !!searchInput.value);
        this.render();
      });
    }
    this.on($id('paSearchClear'), 'click', () => { if (searchInput) { searchInput.value = ''; this.store.set('searchQuery', ''); this.render(); } });
    this.on($id('paFolderFilter'), 'change', (e) => { this.store.update({ folderFilter: e.target.value, page: 1 }); this.render(); });

    // FIX: View mode toggle with proper active class handling
    const gridBtn = $id('paGridViewBtn');
    const listBtn = $id('paListViewBtn');
    
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

    // FIX: Select mode toggle
    const selectModeBtn = $id('paSelectModeBtn');
    if (selectModeBtn) {
      this.on(selectModeBtn, 'click', () => this.toggleSelectMode());
    }

    // FIX: Bulk action buttons - Select All, Clear, Delete
    const selectAllBtn = $id('paBulkSelectAllBtn');
    if (selectAllBtn) {
      this.on(selectAllBtn, 'click', () => this.selectAllVisible());
    }

    const clearBtn = $id('paBulkClearBtn');
    if (clearBtn) {
      this.on(clearBtn, 'click', () => this.clearSelection());
    }

    const bulkDeleteBtn = $id('paBulkDeleteBtn');
    if (bulkDeleteBtn) {
      this.on(bulkDeleteBtn, 'click', () => this.requestBulkDelete());
    }

    // FIX: Bulk confirm dialog - Cancel and OK buttons
    const bulkCancel = $id('paBulkConfirmCancel');
    if (bulkCancel) {
      this.on(bulkCancel, 'click', () => this.closeBulkConfirm());
    }

    const bulkOk = $id('paBulkConfirmOk');
    if (bulkOk) {
      this.on(bulkOk, 'click', () => this.performBulkDelete());
    }

    // Close bulk confirm on overlay click
    const overlay = $id('paBulkConfirmOverlay');
    if (overlay) {
      this.on(overlay, 'click', (e) => {
        if (e.target.id === 'paBulkConfirmOverlay') {
          this.closeBulkConfirm();
        }
      });
    }

    this.onBus('bulk-confirm:close', () => this.closeBulkConfirm());
    this.onBus('confirm:confirmed', ({ id, type }) => { if (type === 'media') this.deleteById(id); });
    this.onBus('shortcut:new-item', ({ page }) => { if (page === PAGE) this.openUploadPanel(); });
  }
}