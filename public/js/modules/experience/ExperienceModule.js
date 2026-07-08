import { CrudCardModule } from '../../core/CrudCardModule.js';
import { escapeHtml, $id } from '../../utils/dom.js';
import { formatMonthYear, parseSortInput } from '../../utils/format.js';
import { activateTab, openPanel } from '../../modules/shell/panels.js';

export const EXP_TYPE_META = {
  'full-time': { label: 'Full-time', icon: 'ri-briefcase-line', color: '#60a5fa' },
  'part-time': { label: 'Part-time', icon: 'ri-time-line', color: '#34d399' },
  contract: { label: 'Contract', icon: 'ri-file-list-3-line', color: '#fb923c' },
  freelance: { label: 'Freelance', icon: 'ri-quill-pen-line', color: '#a78bfa' },
  internship: { label: 'Internship', icon: 'ri-graduation-cap-line', color: '#f472b6' },
};

export const SEED_EXPERIENCE = [
  { id: 1, title: 'Full Stack Web Developer', company: 'Al Tahaluf', location: 'Rawalpindi, Pakistan', type: 'full-time', startDate: '2024-03', endDate: '', current: true, desc: 'Built and maintain an enterprise admin platform using Angular and .NET Core, including dashboard tooling, authentication flows, and reporting modules.', sortOrder: 1 },
  { id: 2, title: 'Frontend Developer', company: 'Freelance', location: 'Remote', type: 'freelance', startDate: '2022-06', endDate: '2024-02', current: false, desc: 'Delivered custom websites and web apps for small businesses, including a 10-page cricket tournament site and several WordPress/WooCommerce builds.', sortOrder: 2 },
  { id: 3, title: 'Junior Web Developer', company: 'Bright Path Digital', location: 'Rawalpindi, Pakistan', type: 'full-time', startDate: '2021-01', endDate: '2022-05', current: false, desc: 'Maintained client websites, fixed bugs, and assisted senior developers with feature development across PHP and JavaScript codebases.', sortOrder: 3 },
];

export class ExperienceModule extends CrudCardModule {
  constructor() {
    super({
      name: 'Experience',
      storageKey: 'pa_experience',
      deleteType: 'experience',
      page: 'experience',
      pageSize: 9,
      cardIdAttr: 'data-exp-id',
      bulkLabel: 'experience entry',
      defaultFilters: { type: 'all' },
      filterSelectIds: [{ id: 'paExpTypeFilter', key: 'type' }],
      addFocusId: 'expAddTitle',
      editFocusId: 'expEditTitle',
      ids: {
        grid: 'paExpGrid', resultCount: 'paExpResultCount',
        paginationBtns: 'paExpPaginationBtns', paginationInfo: 'paExpPaginationInfo',
        pagePrev: 'paExpPagePrev', pageNext: 'paExpPageNext', bodyScroll: 'paExpBody',
        emptyResetBtn: 'paExpEmptyResetBtn', emptyAddBtn: 'paExpEmptyAddBtn',
        addPanel: 'paExpAddPanel', editPanel: 'paExpEditPanel',
        addSubmit: 'paExpAddSubmit', editSubmit: 'paExpEditSubmit', editDelete: 'paExpEditDelete',
        addNewBtn: 'paExpAddNewBtn', addPanelClose: 'paExpAddPanelClose', editPanelClose: 'paExpEditPanelClose',
        addCancel: 'paExpAddCancel', editCancel: 'paExpEditCancel',
      },
      menuActions: { 'copy-title': function copyTitle(id) { this.copyTitle(id); } },
    });
  }

  seedData() { return SEED_EXPERIENCE.map((e) => ({ ...e })); }

  sortRecords(records) {
    return records.slice().sort((a, b) => {
      const so = (a.sortOrder || 0) - (b.sortOrder || 0);
      if (so !== 0) return so;
      return (b.startDate || '').localeCompare(a.startDate || '');
    });
  }

  matchesFilters(record, filters) {
    return filters.type === 'all' || record.type === filters.type;
  }

  matchesSearch(record, query) {
    const q = query.trim().toLowerCase();
    return (
      record.title.toLowerCase().includes(q) ||
      (record.company || '').toLowerCase().includes(q) ||
      (record.location || '').toLowerCase().includes(q) ||
      (record.desc || '').toLowerCase().includes(q)
    );
  }

  getDeleteName(record) { return record.title; }

  renderCard(e, index) {
    const tm = EXP_TYPE_META[e.type] || EXP_TYPE_META['full-time'];
    const dateRange = `${formatMonthYear(e.startDate)} — ${e.current ? 'Present' : formatMonthYear(e.endDate) || '—'}`;
    const currentBadge = e.current ? `<span class="pa-featured-badge">Current</span>` : '';
    return `<div class="pa-card${this.bulkSelect?.cardClass(e.id) || ''}" data-exp-id="${e.id}" style="animation-delay:${Math.min(index, 11) * 35}ms;"><div class="pa-card-img" style="height:100px;">${this.bulkSelect?.checkboxHtml(e.id, `Select ${escapeHtml(e.title)}`) || ''}<div class="pa-card-img-inner" style="background:var(--pa-bg-card);"><div style="display:flex;flex-direction:column;align-items:center;justify-content:center;gap:8px;width:100%;"><div style="width:48px;height:48px;border-radius:12px;background:var(--pa-bg-chip);border:1px solid var(--pa-border-soft);display:flex;align-items:center;justify-content:center;"><i class="${escapeHtml(tm.icon)}" style="font-size:22px;color:${escapeHtml(tm.color)};"></i></div><span style="font-size:9.5px;font-weight:600;letter-spacing:0.06em;text-transform:uppercase;color:${escapeHtml(tm.color)};">${escapeHtml(tm.label)}</span></div></div>${currentBadge}</div><div class="pa-card-body"><div class="pa-card-title" title="${escapeHtml(e.title)}">${escapeHtml(e.title)}</div><div class="pa-card-category" style="color:var(--pa-orange);">${escapeHtml(e.company || '—')}</div><div class="pa-card-desc">${e.desc ? escapeHtml(e.desc) : '<em style="color:var(--pa-text-ghost);">No description</em>'}</div><div class="pa-card-tags"><span class="pa-tag"><i class="ri-calendar-line" style="font-size:9px;margin-right:3px;"></i>${escapeHtml(dateRange)}</span>${e.location ? `<span class="pa-tag"><i class="ri-map-pin-line" style="font-size:9px;margin-right:3px;"></i>${escapeHtml(e.location)}</span>` : ''}</div><div class="pa-card-actions"><button class="pa-action-btn pa-action-edit" data-exp-id="${e.id}" title="Edit experience" aria-label="Edit ${escapeHtml(e.title)}"><i class="ri-pencil-line"></i></button><button class="pa-action-btn pa-action-delete" data-exp-id="${e.id}" title="Delete experience" aria-label="Delete ${escapeHtml(e.title)}"><i class="ri-delete-bin-line"></i></button><button class="pa-action-btn pa-action-more" data-exp-id="${e.id}" title="More options" aria-label="More options for ${escapeHtml(e.title)}"><i class="ri-more-2-fill"></i></button><div class="pa-card-menu" data-exp-id="${e.id}"><div class="pa-card-menu-item" data-action="duplicate" data-exp-id="${e.id}"><i class="ri-file-copy-line"></i> Duplicate</div><div class="pa-card-menu-item" data-action="copy-title" data-exp-id="${e.id}"><i class="ri-clipboard-line"></i> Copy title</div><div class="pa-card-menu-item danger" data-action="delete" data-exp-id="${e.id}"><i class="ri-delete-bin-line"></i> Delete</div></div></div></div></div>`;
  }

  copyTitle(id) {
    const e = this.findById(id);
    if (!e) return;
    navigator.clipboard?.writeText(e.title).then(() => this.toast('Title copied to clipboard', 'success'));
  }

  buildDuplicate(record, newId) {
    return { ...record, id: newId, title: `${record.title} (Copy)` };
  }

  // Experience panels use "details"/"dates" tab groups, keyed by prefix.
  openAddPanel() {
    this.resetAddForm();
    openPanel(this.config.ids.addPanel, [this.config.ids.editPanel]);
    activateTab('expAdd', 'details');
    setTimeout(() => $id('expAddTitle')?.focus(), 320);
  }

  openEditPanel(id) {
    const record = this.findById(id);
    if (!record) return;
    this.currentEditId = id;
    this.populateEditForm(record);
    openPanel(this.config.ids.editPanel, [this.config.ids.addPanel]);
    activateTab('expEdit', 'details');
    setTimeout(() => $id('expEditTitle')?.focus(), 320);
  }

  bindEvents() {
    super.bindEvents();
    ['expAddCurrent', 'expEditCurrent'].forEach((id) => {
      this.on($id(id), 'change', (e) => {
        const prefix = id.replace('Current', '');
        const endDateRow = $id(`${prefix}EndDateRow`);
        if (endDateRow) endDateRow.style.display = e.target.value === '1' ? 'none' : 'block';
      });
    });
  }

  // ---- forms ------------------------------------------------------------

  resetAddForm() {
    ['expAddTitle', 'expAddCompany', 'expAddLocation', 'expAddStartDate', 'expAddEndDate', 'expAddDesc', 'expAddSort'].forEach((id) => { const el = $id(id); if (el) el.value = ''; });
    $id('expAddType').value = '';
    $id('expAddCurrent').value = '0';
    const endRow = $id('expAddEndDateRow');
    if (endRow) endRow.style.display = 'block';
    ['Title', 'Company', 'Type', 'StartDate'].forEach((f) => {
      $id(`expAdd${f}Error`)?.classList.remove('visible');
      $id(`expAdd${f}`)?.classList.remove('error');
    });
  }

  populateEditForm(e) {
    $id('expEditTitle').value = e.title;
    $id('expEditCompany').value = e.company;
    $id('expEditLocation').value = e.location || '';
    $id('expEditType').value = e.type;
    $id('expEditStartDate').value = e.startDate;
    $id('expEditEndDate').value = e.endDate || '';
    $id('expEditCurrent').value = e.current ? '1' : '0';
    $id('expEditDesc').value = e.desc || '';
    $id('expEditSort').value = e.sortOrder != null ? String(e.sortOrder) : '';
    const endRow = $id('expEditEndDateRow');
    if (endRow) endRow.style.display = e.current ? 'none' : 'block';
    ['Title', 'Company', 'Type', 'StartDate'].forEach((f) => {
      $id(`expEdit${f}Error`)?.classList.remove('visible');
      $id(`expEdit${f}`)?.classList.remove('error');
    });
  }

  validateForm(prefix) {
    let valid = true;
    const p = prefix === 'add' ? 'expAdd' : 'expEdit';

    const title = $id(`${p}Title`).value.trim();
    this._err(`${p}Title`, !title);
    if (!title) valid = false;

    const company = $id(`${p}Company`).value.trim();
    this._err(`${p}Company`, !company);
    if (!company) valid = false;

    const type = $id(`${p}Type`).value;
    this._err(`${p}Type`, !type);
    if (!type) valid = false;

    const startDate = $id(`${p}StartDate`).value;
    this._err(`${p}StartDate`, !startDate);
    if (!startDate) valid = false;

    if (!valid) activateTab(p, !title || !company ? 'details' : 'dates');

    return { valid, title, company, type, startDate };
  }

  _err(id, isError) {
    $id(id)?.classList.toggle('error', isError);
    $id(`${id}Error`)?.classList.toggle('visible', isError);
  }

  buildNewRecord(f) {
    const current = $id('expAddCurrent').value === '1';
    return {
      title: f.title, company: f.company, location: $id('expAddLocation').value.trim(),
      type: f.type, startDate: f.startDate, endDate: current ? '' : $id('expAddEndDate').value,
      current, desc: $id('expAddDesc').value.trim(),
      sortOrder: parseSortInput($id('expAddSort').value, this.store.get('records').length + 1),
    };
  }

  applyEditToRecord(record, f) {
    const current = $id('expEditCurrent').value === '1';
    record.title = f.title;
    record.company = f.company;
    record.location = $id('expEditLocation').value.trim();
    record.type = f.type;
    record.startDate = f.startDate;
    record.endDate = current ? '' : $id('expEditEndDate').value;
    record.current = current;
    record.desc = $id('expEditDesc').value.trim();
    record.sortOrder = parseSortInput($id('expEditSort').value, record.sortOrder);
  }
}
