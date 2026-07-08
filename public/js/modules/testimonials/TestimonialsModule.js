import { CrudCardModule } from '../../core/CrudCardModule.js';
import { escapeHtml, $id } from '../../utils/dom.js';
import { formatDate } from '../../utils/format.js';
import { readFileAsDataUrl, handleFileValidation } from '../../utils/files.js';

export const SEED_TESTIMONIALS = [
  { id: 1, name: 'Ayesha Khan', role: 'Product Manager', company: 'Al Tahaluf', quote: "Sohaib delivered our admin platform ahead of schedule and the attention to detail on the Angular front end was outstanding. Communication was clear throughout.", rating: 5, imageUrl: '', imageAlt: '', featured: true, createdAt: '2026-04-02T10:00:00.000Z' },
  { id: 2, name: 'Daniel Reyes', role: 'Founder', company: 'Northwind Studio', quote: "Working with Sohaib on the portfolio rebuild was effortless. He matched our design system perfectly and suggested improvements we hadn't considered.", rating: 5, imageUrl: '', imageAlt: '', featured: true, createdAt: '2026-03-18T10:00:00.000Z' },
  { id: 3, name: 'Maria Lopez', role: 'Marketing Lead', company: 'Bright Path Co.', quote: 'Quick turnaround on the cricket tournament site and very responsive to feedback during revisions.', rating: 4, imageUrl: '', imageAlt: '', featured: false, createdAt: '2026-02-09T10:00:00.000Z' },
];

function renderStars(rating) {
  let html = '';
  for (let i = 1; i <= 5; i++) {
    html += `<i class="${i <= rating ? 'ri-star-fill' : 'ri-star-line'}" style="font-size:12px;color:${i <= rating ? 'var(--pa-yellow)' : 'var(--pa-text-faint)'};"></i>`;
  }
  return html;
}

export class TestimonialsModule extends CrudCardModule {
  constructor() {
    super({
      name: 'Testimonials',
      storageKey: 'pa_testimonials',
      deleteType: 'testimonial',
      page: 'testimonials',
      pageSize: 9,
      cardIdAttr: 'data-testi-id',
      bulkLabel: 'testimonial',
      defaultFilters: { rating: 'all' },
      filterSelectIds: [{ id: 'paTestiRatingFilter', key: 'rating' }],
      addFocusId: 'testiAddName',
      editFocusId: 'testiEditName',
      ids: {
        grid: 'paTestiGrid', resultCount: 'paTestiResultCount',
        paginationBtns: 'paTestiPaginationBtns', paginationInfo: 'paTestiPaginationInfo',
        pagePrev: 'paTestiPagePrev', pageNext: 'paTestiPageNext', bodyScroll: 'paTestiBody',
        emptyResetBtn: 'paTestiEmptyResetBtn', emptyAddBtn: 'paTestiEmptyAddBtn',
        addPanel: 'paTestiAddPanel', editPanel: 'paTestiEditPanel',
        addSubmit: 'paTestiAddSubmit', editSubmit: 'paTestiEditSubmit', editDelete: 'paTestiEditDelete',
        addNewBtn: 'paTestiAddNewBtn', addPanelClose: 'paTestiAddPanelClose', editPanelClose: 'paTestiEditPanelClose',
        addCancel: 'paTestiAddCancel', editCancel: 'paTestiEditCancel',
      },
      menuActions: { 'copy-quote': function copyQuote(id) { this.copyQuote(id); } },
    });
    this.addImageData = null;
    this.editImageData = null;
  }

  seedData() { return SEED_TESTIMONIALS.map((t) => ({ ...t })); }

  sortRecords(records) { return records.slice().sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)); }

  matchesFilters(record, filters) {
    if (filters.rating !== 'all' && record.rating !== parseInt(filters.rating, 10)) return false;
    return true;
  }

  matchesSearch(record, query) {
    const q = query.trim().toLowerCase();
    return (
      record.name.toLowerCase().includes(q) ||
      (record.role || '').toLowerCase().includes(q) ||
      (record.company || '').toLowerCase().includes(q) ||
      (record.quote || '').toLowerCase().includes(q)
    );
  }

  renderCard(t, index) {
    const initials = (t.name || '?').split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase();
    const avatar = t.imageUrl
      ? `<img src="${escapeHtml(t.imageUrl)}" alt="${escapeHtml(t.imageAlt || t.name)}" style="width:100%;height:100%;object-fit:cover;display:block;" />`
      : `<span>${escapeHtml(initials)}</span>`;
    const roleLine = [t.role, t.company].filter(Boolean).join(' · ');
    const featuredBadge = t.featured ? `<span class="pa-featured-badge">Featured</span>` : '';
    return `<div class="pa-card${this.bulkSelect?.cardClass(t.id) || ''}" data-testi-id="${t.id}" style="animation-delay:${Math.min(index, 11) * 35}ms;"><div class="pa-card-img" style="height:auto;padding:18px 15px 0;">${this.bulkSelect?.checkboxHtml(t.id, `Select ${escapeHtml(t.name)}`) || ''}<div style="display:flex;align-items:center;gap:11px;width:100%;"><div class="pa-avatar" style="width:46px;height:46px;flex-shrink:0;">${avatar}</div><div style="min-width:0;"><div class="pa-card-title" style="margin:0;font-size:14px;" title="${escapeHtml(t.name)}">${escapeHtml(t.name)}</div>${roleLine ? `<div style="font-size:11px;color:var(--pa-text-mute);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${escapeHtml(roleLine)}</div>` : ''}</div></div>${featuredBadge}</div><div class="pa-card-body"><div style="margin:2px 0 9px;">${renderStars(t.rating)}</div><div class="pa-card-desc" style="-webkit-line-clamp:4;"><i class="ri-double-quotes-l" style="color:var(--pa-text-ghost);margin-right:3px;"></i>${escapeHtml(t.quote)}</div><div class="pa-card-tags"><span class="pa-tag"><i class="ri-calendar-line" style="font-size:9px;margin-right:3px;"></i>${escapeHtml(formatDate(t.createdAt))}</span></div><div class="pa-card-actions"><button class="pa-action-btn pa-action-edit" data-testi-id="${t.id}" title="Edit testimonial" aria-label="Edit ${escapeHtml(t.name)}"><i class="ri-pencil-line"></i></button><button class="pa-action-btn pa-action-delete" data-testi-id="${t.id}" title="Delete testimonial" aria-label="Delete ${escapeHtml(t.name)}"><i class="ri-delete-bin-line"></i></button><button class="pa-action-btn pa-action-more" data-testi-id="${t.id}" title="More options" aria-label="More options for ${escapeHtml(t.name)}"><i class="ri-more-2-fill"></i></button><div class="pa-card-menu" data-testi-id="${t.id}"><div class="pa-card-menu-item" data-action="duplicate" data-testi-id="${t.id}"><i class="ri-file-copy-line"></i> Duplicate</div><div class="pa-card-menu-item" data-action="copy-quote" data-testi-id="${t.id}"><i class="ri-clipboard-line"></i> Copy quote</div><div class="pa-card-menu-item danger" data-action="delete" data-testi-id="${t.id}"><i class="ri-delete-bin-line"></i> Delete</div></div></div></div></div>`;
  }

  copyQuote(id) {
    const t = this.findById(id);
    if (!t) return;
    navigator.clipboard?.writeText(t.quote).then(
      () => this.toast('Copied quote to clipboard.', 'success', 2000),
      () => this.toast('Clipboard not available.', 'danger'),
    );
  }

  buildDuplicate(record, newId) {
    return { ...record, id: newId, name: `${record.name} (Copy)`, featured: false, createdAt: new Date().toISOString() };
  }

  // ---- avatar dropzone -----------------------------------------------------

  setAvatarPreview(prefix, dataUrl, alt) {
    const wrap = $id(`${prefix}AvatarPreviewWrap`);
    const img = $id(`${prefix}AvatarPreviewImg`);
    const dz = $id(`${prefix}AvatarDropzone`);
    if (dataUrl) {
      if (img) { img.src = dataUrl; img.alt = alt || ''; }
      if (wrap) wrap.style.display = 'block';
      if (dz) dz.style.display = 'none';
    } else {
      if (wrap) wrap.style.display = 'none';
      if (dz) dz.style.display = 'block';
    }
  }

  setupAvatarDropzone(prefix) {
    const dropzone = $id(`${prefix}AvatarDropzone`);
    const fileInput = $id(`${prefix}AvatarFileInput`);
    const removeBtn = $id(`${prefix}AvatarRemoveBtn`);
    if (!dropzone || !fileInput || dropzone._wired) return;
    dropzone._wired = true;

    const setData = (dataUrl) => {
      if (prefix === 'testiAdd') this.addImageData = dataUrl; else this.editImageData = dataUrl;
      this.setAvatarPreview(prefix, dataUrl);
    };

    this.on(dropzone, 'click', () => fileInput.click());
    this.on(dropzone, 'keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); fileInput.click(); } });
    dropzone.setAttribute('tabindex', '0');
    dropzone.setAttribute('role', 'button');

    this.on(fileInput, 'change', async () => {
      const file = fileInput.files?.[0];
      fileInput.value = '';
      if (!file || !handleFileValidation(file)) return;
      setData(await readFileAsDataUrl(file));
    });

    ['dragenter', 'dragover'].forEach((evt) => this.on(dropzone, evt, (e) => { e.preventDefault(); dropzone.classList.add('dragover'); }));
    ['dragleave', 'drop'].forEach((evt) => this.on(dropzone, evt, (e) => { e.preventDefault(); dropzone.classList.remove('dragover'); }));
    this.on(dropzone, 'drop', async (e) => {
      const file = e.dataTransfer?.files?.[0];
      if (!file || !handleFileValidation(file)) return;
      setData(await readFileAsDataUrl(file));
    });

    this.on(removeBtn, 'click', (e) => { e.stopPropagation(); setData(null); });
  }

  bindEvents() {
    super.bindEvents();
    this.setupAvatarDropzone('testiAdd');
    this.setupAvatarDropzone('testiEdit');
  }

  // ---- forms ----------------------------------------------------------------

  resetAddForm() {
    ['testiAddName', 'testiAddRole', 'testiAddCompany', 'testiAddQuote', 'testiAddAlt'].forEach((id) => { const el = $id(id); if (el) el.value = ''; });
    $id('testiAddQuoteCount').textContent = '0';
    $id('testiAddRating').value = '5';
    $id('testiAddFeatured').value = '0';
    this.addImageData = null;
    this.setAvatarPreview('testiAdd', null);
    ['Name', 'Quote'].forEach((f) => {
      $id(`testiAdd${f}Error`)?.classList.remove('visible');
      $id(`testiAdd${f}`)?.classList.remove('error');
    });
  }

  populateEditForm(t) {
    $id('testiEditName').value = t.name;
    $id('testiEditRole').value = t.role || '';
    $id('testiEditCompany').value = t.company || '';
    $id('testiEditQuote').value = t.quote;
    $id('testiEditQuoteCount').textContent = (t.quote || '').length;
    $id('testiEditRating').value = String(t.rating || 5);
    $id('testiEditAlt').value = t.imageAlt || '';
    $id('testiEditFeatured').value = t.featured ? '1' : '0';
    this.editImageData = t.imageUrl || null;
    this.setAvatarPreview('testiEdit', t.imageUrl || null, t.imageAlt);
    ['Name', 'Quote'].forEach((f) => {
      $id(`testiEdit${f}Error`)?.classList.remove('visible');
      $id(`testiEdit${f}`)?.classList.remove('error');
    });
  }

  validateForm(prefix) {
    let valid = true;
    const name = $id(`${prefix}Name`).value.trim();
    if (!name) { $id(`${prefix}Name`).classList.add('error'); $id(`${prefix}NameError`).classList.add('visible'); valid = false; }
    else { $id(`${prefix}Name`).classList.remove('error'); $id(`${prefix}NameError`).classList.remove('visible'); }

    const quote = $id(`${prefix}Quote`).value.trim();
    if (!quote) { $id(`${prefix}Quote`).classList.add('error'); $id(`${prefix}QuoteError`).classList.add('visible'); valid = false; }
    else { $id(`${prefix}Quote`).classList.remove('error'); $id(`${prefix}QuoteError`).classList.remove('visible'); }

    return { valid, name, quote };
  }

  buildNewRecord(result) {
    return {
      name: result.name,
      role: $id('testiAddRole').value.trim(),
      company: $id('testiAddCompany').value.trim(),
      quote: result.quote,
      rating: parseInt($id('testiAddRating').value, 10),
      imageUrl: this.addImageData || '',
      imageAlt: $id('testiAddAlt').value.trim(),
      featured: $id('testiAddFeatured').value === '1',
      createdAt: new Date().toISOString(),
    };
  }

  applyEditToRecord(record, result) {
    record.name = result.name;
    record.role = $id('testiEditRole').value.trim();
    record.company = $id('testiEditCompany').value.trim();
    record.quote = result.quote;
    record.rating = parseInt($id('testiEditRating').value, 10);
    record.imageUrl = this.editImageData || '';
    record.imageAlt = $id('testiEditAlt').value.trim();
    record.featured = $id('testiEditFeatured').value === '1';
  }
}
