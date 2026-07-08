import { CrudCardModule } from '../../core/CrudCardModule.js';
import { escapeHtml, $id } from '../../utils/dom.js';
import { isValidUrl } from '../../utils/strings.js';
import { parseYearsInput, parseSortInput } from '../../utils/format.js';

export const GROUP_META = {
  frontend: { label: 'Frontend', icon: 'ri-layout-line', color: '#60a5fa' },
  backend: { label: 'Backend', icon: 'ri-server-line', color: '#34d399' },
  database: { label: 'Database', icon: 'ri-database-2-line', color: '#a78bfa' },
  devops: { label: 'DevOps & Cloud', icon: 'ri-cloud-line', color: '#38bdf8' },
  mobile: { label: 'Mobile', icon: 'ri-smartphone-line', color: '#fb923c' },
  design: { label: 'Design & Tools', icon: 'ri-palette-line', color: '#f472b6' },
  other: { label: 'Other', icon: 'ri-more-line', color: '#9a9aa0' },
};

export const LEVEL_META = {
  beginner: { label: 'Beginner', pct: 25, color: '#9a9aa0' },
  intermediate: { label: 'Intermediate', pct: 55, color: '#60a5fa' },
  advanced: { label: 'Advanced', pct: 80, color: '#34d399' },
  expert: { label: 'Expert', pct: 100, color: '#FF6600' },
};

export const SEED_TECHNOLOGIES = [
  { id: 1, name: 'Angular', group: 'frontend', level: 'expert', url: 'https://angular.dev', desc: 'Primary frontend framework for enterprise SPAs.', years: 4, featured: true, sortOrder: 1 },
  { id: 2, name: '.NET Core', group: 'backend', level: 'expert', url: 'https://dotnet.microsoft.com', desc: 'Backend API development and enterprise services.', years: 4, featured: true, sortOrder: 1 },
  { id: 3, name: 'SQL Server', group: 'database', level: 'advanced', url: 'https://www.microsoft.com/sql-server', desc: 'Relational database for enterprise and desktop apps.', years: 4, featured: false, sortOrder: 1 },
  { id: 4, name: 'React', group: 'frontend', level: 'advanced', url: 'https://react.dev', desc: 'Component-based UI library for modern web apps.', years: 2, featured: true, sortOrder: 2 },
];

export class TechnologiesModule extends CrudCardModule {
  constructor() {
    super({
      name: 'Technologies',
      storageKey: 'pa_technologies',
      deleteType: 'technology',
      page: 'technologies',
      pageSize: 12,
      cardIdAttr: 'data-tech-id',
      bulkLabel: 'technology',
      defaultFilters: { group: 'all', level: 'all' },
      filterSelectIds: [{ id: 'paTechGroupFilter', key: 'group' }, { id: 'paTechLevelFilter', key: 'level' }],
      addFocusId: 'techAddName',
      editFocusId: 'techEditName',
      ids: {
        grid: 'paTechGrid', resultCount: 'paTechResultCount',
        paginationBtns: 'paTechPaginationBtns', paginationInfo: 'paTechPaginationInfo',
        pagePrev: 'paTechPagePrev', pageNext: 'paTechPageNext', bodyScroll: 'paTechBody',
        emptyResetBtn: 'paTechEmptyResetBtn', emptyAddBtn: 'paTechEmptyAddBtn',
        addPanel: 'paTechAddPanel', editPanel: 'paTechEditPanel',
        addSubmit: 'paTechAddSubmit', editSubmit: 'paTechEditSubmit', editDelete: null,
        addNewBtn: 'paTechAddNewBtn', addPanelClose: 'paTechAddPanelClose', editPanelClose: 'paTechEditPanelClose',
        addCancel: 'paTechAddCancel', editCancel: 'paTechEditCancel',
      },
      menuActions: {
        'view-docs': function viewDocs(id) { this.openTechDocs(id); },
        'copy-name': function copyName(id) { this.copyTechName(id); },
      },
    });
  }

  seedData() { return SEED_TECHNOLOGIES.map((t) => ({ ...t })); }

  sortRecords(records) { return records; }

  matchesFilters(record, filters) {
    if (filters.group !== 'all' && record.group !== filters.group) return false;
    if (filters.level !== 'all' && record.level !== filters.level) return false;
    return true;
  }

  matchesSearch(record, query) {
    const q = query.trim().toLowerCase();
    return (
      record.name.toLowerCase().includes(q) ||
      (record.desc || '').toLowerCase().includes(q) ||
      (GROUP_META[record.group]?.label || '').toLowerCase().includes(q)
    );
  }

  getDeleteName(record) { return record.name; }

  renderCard(tech, index) {
    const gm = GROUP_META[tech.group] || GROUP_META.other;
    const lm = LEVEL_META[tech.level] || { label: '—', pct: 0, color: '#9a9aa0' };
    const years = tech.years != null ? `${tech.years}yr` : null;
    const progressBar = `<div style="height:3px;border-radius:2px;background:var(--pa-border-soft);margin:10px 0 11px;overflow:hidden;"><div style="height:100%;width:${lm.pct}%;background:${escapeHtml(lm.color)};border-radius:2px;transition:width 0.4s ease;"></div></div>`;
    const featuredBadge = tech.featured ? `<span class="pa-featured-badge">Headline</span>` : '';
    return `<div class="pa-card${this.bulkSelect?.cardClass(tech.id) || ''}" data-tech-id="${tech.id}" style="animation-delay:${Math.min(index, 11) * 35}ms;"><div class="pa-card-img" style="height:100px;">${this.bulkSelect?.checkboxHtml(tech.id, `Select ${escapeHtml(tech.name)}`) || ''}<div class="pa-card-img-inner" style="background:var(--pa-bg-card);"><div style="display:flex;flex-direction:column;align-items:center;justify-content:center;gap:8px;width:100%;"><div style="width:48px;height:48px;border-radius:12px;background:var(--pa-bg-chip);border:1px solid var(--pa-border-soft);display:flex;align-items:center;justify-content:center;"><i class="${escapeHtml(gm.icon)}" style="font-size:22px;color:${escapeHtml(gm.color)};"></i></div><span style="font-size:9.5px;font-weight:600;letter-spacing:0.06em;text-transform:uppercase;color:${escapeHtml(gm.color)};">${escapeHtml(gm.label)}</span></div></div>${featuredBadge}</div><div class="pa-card-body"><div class="pa-card-title" title="${escapeHtml(tech.name)}">${escapeHtml(tech.name)}</div><div class="pa-card-category" style="color:${escapeHtml(lm.color)};">${escapeHtml(lm.label)}</div>${progressBar}<div class="pa-card-desc">${tech.desc ? escapeHtml(tech.desc) : '<em style="color:var(--pa-text-ghost);">No description</em>'}</div><div class="pa-card-tags">${years ? `<span class="pa-tag"><i class="ri-time-line" style="font-size:9px;margin-right:3px;"></i>${escapeHtml(years)}</span>` : ''}${tech.url ? `<span class="pa-tag"><i class="ri-links-line" style="font-size:9px;margin-right:3px;"></i>Docs</span>` : ''}</div><div class="pa-card-actions"><button class="pa-action-btn pa-action-edit" data-tech-id="${tech.id}" title="Edit technology" aria-label="Edit ${escapeHtml(tech.name)}"><i class="ri-pencil-line"></i></button><button class="pa-action-btn pa-action-delete" data-tech-id="${tech.id}" title="Delete technology" aria-label="Delete ${escapeHtml(tech.name)}"><i class="ri-delete-bin-line"></i></button><button class="pa-action-btn pa-action-more" data-tech-id="${tech.id}" title="More options" aria-label="More options for ${escapeHtml(tech.name)}"><i class="ri-more-2-fill"></i></button><div class="pa-card-menu" data-tech-id="${tech.id}"><div class="pa-card-menu-item" data-action="view-docs" data-tech-id="${tech.id}"><i class="ri-external-link-line"></i> View Docs</div><div class="pa-card-menu-item" data-action="duplicate" data-tech-id="${tech.id}"><i class="ri-file-copy-line"></i> Duplicate</div><div class="pa-card-menu-item" data-action="copy-name" data-tech-id="${tech.id}"><i class="ri-clipboard-line"></i> Copy name</div><div class="pa-card-menu-item danger" data-action="delete" data-tech-id="${tech.id}"><i class="ri-delete-bin-line"></i> Delete</div></div></div></div></div>`;
  }

  openTechDocs(id) {
    const t = this.findById(id);
    if (!t) return;
    if (t.url) { this.toast(`Opening ${t.name} docs…`, 'info'); window.open(t.url, '_blank', 'noopener'); }
    else this.toast(`${t.name} has no docs URL set`, 'info');
  }

  copyTechName(id) {
    const t = this.findById(id);
    if (!t) return;
    navigator.clipboard?.writeText(t.name).then(() => this.toast('Name copied to clipboard', 'success'));
  }

  buildDuplicate(record, newId) {
    return { ...record, id: newId, name: `${record.name} (Copy)`, featured: false };
  }

  // ---- forms ----------------------------------------------------------

  resetAddForm() {
    ['techAddName', 'techAddGroup', 'techAddUrl', 'techAddDesc', 'techAddLevel', 'techAddYears', 'techAddSort'].forEach((id) => { const el = $id(id); if (el) el.value = ''; });
    $id('techAddDescCount').textContent = '0';
    $id('techAddFeatured').value = '0';
    ['Name', 'Group', 'Level', 'Url'].forEach((f) => {
      $id(`techAdd${f}Error`)?.classList.remove('visible');
      $id(`techAdd${f}`)?.classList.remove('error');
    });
  }

  populateEditForm(t) {
    $id('techEditName').value = t.name;
    $id('techEditGroup').value = t.group;
    $id('techEditUrl').value = t.url || '';
    $id('techEditDesc').value = t.desc || '';
    $id('techEditDescCount').textContent = (t.desc || '').length;
    $id('techEditLevel').value = t.level;
    $id('techEditYears').value = t.years != null ? String(t.years) : '';
    $id('techEditFeatured').value = t.featured ? '1' : '0';
    $id('techEditSort').value = t.sortOrder != null ? String(t.sortOrder) : '';
    ['Name', 'Group', 'Level', 'Url'].forEach((f) => {
      $id(`techEdit${f}Error`)?.classList.remove('visible');
      $id(`techEdit${f}`)?.classList.remove('error');
    });
  }

  validateForm(prefix) {
    let valid = true;
    const name = $id(`${prefix}Name`).value.trim();
    if (!name) { this._err(`${prefix}Name`, true); valid = false; }
    else if (this.store.get('records').some((t) => t.name.toLowerCase() === name.toLowerCase() && String(t.id) !== String(this.currentEditId))) {
      this._err(`${prefix}Name`, true, `"${name}" already exists`);
      valid = false;
    } else this._err(`${prefix}Name`, false);

    const group = $id(`${prefix}Group`).value;
    if (!group) { this._err(`${prefix}Group`, true); valid = false; } else this._err(`${prefix}Group`, false);

    const level = $id(`${prefix}Level`).value;
    if (!level) { this._err(`${prefix}Level`, true); valid = false; } else this._err(`${prefix}Level`, false);

    const url = $id(`${prefix}Url`).value.trim();
    if (url && !isValidUrl(url)) { this._err(`${prefix}Url`, true); valid = false; } else this._err(`${prefix}Url`, false);

    return {
      valid, name, group, level, url,
      desc: $id(`${prefix}Desc`).value.trim(),
      years: parseYearsInput($id(`${prefix}Years`).value),
      featured: $id(`${prefix}Featured`).value === '1',
      sortOrder: parseSortInput($id(`${prefix}Sort`).value, undefined),
    };
  }

  _err(id, isError, message) {
    $id(id)?.classList.toggle('error', isError);
    const err = $id(`${id}Error`);
    err?.classList.toggle('visible', isError);
    if (isError && message && err) {
      const span = err.querySelector('span');
      if (span) span.textContent = message;
    }
  }

  buildNewRecord(f) {
    return {
      name: f.name, group: f.group, level: f.level, url: f.url, desc: f.desc,
      years: f.years, featured: f.featured, sortOrder: f.sortOrder ?? this.store.get('records').length + 1,
    };
  }

  applyEditToRecord(record, f) {
    record.name = f.name;
    record.group = f.group;
    record.level = f.level;
    record.url = f.url;
    record.desc = f.desc;
    record.years = f.years;
    record.featured = f.featured;
    if (f.sortOrder != null) record.sortOrder = f.sortOrder;
  }
}
