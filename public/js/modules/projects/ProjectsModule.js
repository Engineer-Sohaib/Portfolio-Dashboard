import { Module } from '../../core/Module.js';
import { $id, $all, escapeHtml } from '../../utils/dom.js';
import { isValidUrl } from '../../utils/strings.js';
import { readFileAsDataUrl, handleFileValidation } from '../../utils/files.js';
import { setupRte } from '../../utils/rte.js';
import { addChip, getChipValues, populateChips } from '../../utils/chips.js';
import { requestDelete } from '../../modules/shell/confirm.js';
import { closeAllCardMenus, toggleCardMenu } from '../../modules/shell/cardMenu.js';
import { openPanel, closePanels, setButtonLoading, activateTab, registerPanel } from '../../modules/shell/panels.js';
import { PAGE } from '../../core/router.js';
import { BulkSelectController } from '../../core/BulkSelectController.js';

export const CATEGORY_META_PROJECTS = {
  enterprise: { label: 'Enterprise Platform', cls: 'pa-cat-enterprise' },
  educational: { label: 'Educational Platform', cls: 'pa-cat-educational' },
  desktop: { label: 'Desktop Application', cls: 'pa-cat-desktop' },
  medical: { label: 'Medical System', cls: 'pa-cat-medical' },
  ecommerce: { label: 'E-Commerce', cls: 'pa-cat-ecommerce' },
  travel: { label: 'Travel Platform', cls: 'pa-cat-travel' },
  web: { label: 'Web Application', cls: 'pa-cat-web' },
  nonprofit: { label: 'Non Profit Organization', cls: 'pa-cat-nonprofit' },
};

const SCENES = {
  enterprise: { bg: 'linear-gradient(135deg,#10202e 0%,#16314a 60%,#0c1722 100%)', accent: '#ff6600', chrome: '#1c2733' },
  educational: { bg: 'linear-gradient(135deg,#1c1230 0%,#2d1b4d 55%,#160f26 100%)', accent: '#a78bfa', chrome: '#211a30' },
  desktop: { bg: 'linear-gradient(135deg,#3a0f63 0%,#7b2ff7 50%,#1d0b38 100%)', accent: '#38bdf8', chrome: '#241338' },
  medical: { bg: 'linear-gradient(135deg,#241016 0%,#3a0f1f 55%,#160a0e 100%)', accent: '#f472b6', chrome: '#241319' },
  ecommerce1: { bg: 'linear-gradient(135deg,#0d1f1a 0%,#0f2e22 60%,#081410 100%)', accent: '#34d399', chrome: '#11211b' },
  ecommerce2: { bg: 'linear-gradient(135deg,#1a1006 0%,#2a1c08 55%,#120a04 100%)', accent: '#fb923c', chrome: '#1e1409' },
  travel: { bg: 'linear-gradient(135deg,#0a0a0c 0%,#181818 55%,#050505 100%)', accent: '#facc15', chrome: '#161616' },
  web: { bg: 'linear-gradient(135deg,#0e1a3a 0%,#16275c 55%,#0a1226 100%)', accent: '#60a5fa', chrome: '#121d3a' },
  nonprofit: { bg: 'linear-gradient(135deg,#16140d 0%,#241f12 55%,#0e0c08 100%)', accent: '#facc15', chrome: '#1c180f' },
};

export const SEED_PROJECTS = [
  { id: 1, title: "Al Tahaluf's Platform", catKey: 'enterprise', desc: 'Full enterprise website built with Angular and .NET Core. Custom components, reusable modules and role-based authentication.', fullDesc: "Al Tahaluf's Platform is a full enterprise web application built with Angular on the frontend and .NET Core on the backend. The system features a library of custom, reusable UI components, role-based authentication and authorization, and modular service architecture designed for long-term maintainability across multiple business units.", tags: ['Angular', '.NET Core', 'SQL Server', 'Azure AD'], featured: true, scene: 'enterprise', liveUrl: 'https://altahaluf.example.com', bannerImgUrl: 'https://res.cloudinary.com/dpx3gst4q/image/upload/v1782254073/al-tahaluf-banner_p0ltyp.png', repoUrl: '', status: 'Completed', sortOrder: 1, createdAt: '2026-02-02T09:00:00.000Z' },
  { id: 2, title: 'NSRIC Online Education', catKey: 'educational', desc: 'Nature Science Research and Innovation Centre. Features conference management, student portal and resource hub.', fullDesc: 'A complete educational platform for the Nature Science Research and Innovation Centre, including conference and event management, a student portal with progress tracking, and a searchable resource hub for papers and course materials. Built on WordPress with custom PHP modules.', tags: ['WordPress', 'PHP', 'JavaScript', 'MySQL'], featured: false, scene: 'educational', liveUrl: 'https://nsric.example.com', bannerImgUrl: 'https://res.cloudinary.com/dpx3gst4q/image/upload/v1782254093/nsric-banner_ggseqj.png', repoUrl: '', status: 'Completed', sortOrder: 2, createdAt: '2026-03-14T09:00:00.000Z' },
  { id: 3, title: 'Stock Management System', catKey: 'desktop', desc: 'Windows desktop app for stock inventory management with advanced reporting, barcode scanning and supplier management.', fullDesc: 'A Windows desktop application built for stock inventory management, supporting barcode scanning, supplier and purchase order tracking, and advanced reporting with exportable spreadsheets. Built with .NET WinForms and backed by a SQL Server database.', tags: ['.NET', 'WinForms', 'SQL Server'], featured: false, scene: 'desktop', liveUrl: '', bannerImgUrl: 'https://res.cloudinary.com/dpx3gst4q/image/upload/v1782254083/banner-stockm_jgv4p2.png', repoUrl: '', status: 'Completed', sortOrder: 3, createdAt: '2026-04-22T09:00:00.000Z' },
  { id: 4, title: 'QRMF', catKey: 'medical', desc: 'Medical management system with patient records, appointments, and reporting.', fullDesc: 'QRMF is a medical management system handling patient records, appointment scheduling, prescriptions, and comprehensive clinical reporting for a multi-practitioner clinic. Built with PHP and a MySQL backend with a Bootstrap-based responsive frontend.', tags: ['PHP', 'MySQL', 'Bootstrap', 'jQuery'], featured: false, scene: 'medical', liveUrl: '', bannerImgUrl: 'https://res.cloudinary.com/dpx3gst4q/image/upload/v1782254094/qrmf-banner_bzaa21.png', repoUrl: '', status: 'In Progress', sortOrder: 4, createdAt: '2026-06-05T09:00:00.000Z' },
  { id: 5, title: 'Simplicity Trading WP', catKey: 'ecommerce', desc: 'WordPress website for trading academy with membership, courses and dashboard.', fullDesc: 'WordPress website for Simplicity Trading Academy. Features membership tiers, 7-day free trial CTA, video integration, course listings, FAQ, contact page and a dark-themed responsive layout optimised for conversion.', tags: ['WordPress', 'Elementor', 'PHP', 'WooCommerce'], featured: false, scene: 'ecommerce2', liveUrl: 'https://simplicity-trading.com', bannerImgUrl: 'https://res.cloudinary.com/dpx3gst4q/image/upload/v1782254092/simplicity-banner_warjhz.png', repoUrl: '', status: 'Completed', sortOrder: 5, createdAt: '2026-06-05T09:00:00.000Z' },
  { id: 6, title: 'Traveler', catKey: 'travel', desc: 'Flight booking web app with real-time search, booking, and secure payments.', fullDesc: 'Traveler is a flight booking web application offering real-time flight search, seat selection, booking confirmation flows, and secure payment integration. Built as a React single-page app with a Node.js/Express API and MongoDB persistence.', tags: ['React', 'Node.js', 'MongoDB', 'Stripe'], featured: false, scene: 'travel', liveUrl: '', bannerImgUrl: 'https://res.cloudinary.com/dpx3gst4q/image/upload/v1782254093/traveler-banner_yk8ndo.png' , repoUrl: 'https://github.com/example/traveler', status: 'In Progress', sortOrder: 6 , createdAt: '2026-06-05T09:00:00.000Z' },
  { id: 7, title: 'Online Quiz System', catKey: 'desktop', desc: 'Feature-rich quiz platform with timer, questions, results and analytics dashboard.', fullDesc: 'A feature-rich online quiz platform supporting timed assessments, large question pools, automatic grading, and a results analytics dashboard for instructors. Built with .NET and C#, backed by SQL Server.', tags: ['.NET', 'C#', 'SQL Server'], featured: false, scene: 'web', liveUrl: '', bannerImgUrl: 'https://res.cloudinary.com/dpx3gst4q/image/upload/v1782254075/bnner-oqs_itk88l.png', repoUrl: '', status: 'Pending', sortOrder: 7, createdAt: '2026-06-05T09:00:00.000Z'  },
  { id: 8, title: 'Mila Lifestyle', catKey: 'ecommerce', desc: 'Lifestyle accessories e-commerce with product filters, wishlist and secure checkout.', fullDesc: 'Mila Lifestyle is an e-commerce storefront for lifestyle accessories with faceted product filters, a persistent wishlist, and a streamlined, secure checkout flow. Built on WooCommerce with custom WordPress theming.', tags: ['WooCommerce', 'WordPress', 'PHP'], featured: false, scene: 'ecommerce1', liveUrl: '', bannerImgUrl: 'https://res.cloudinary.com/dpx3gst4q/image/upload/v1782254089/mila-banner_p2wdvm.png', repoUrl: '', status: 'Pending', sortOrder: 8, createdAt: '2026-06-05T09:00:00.000Z'  },
  { id: 9, title: 'KF Movement', catKey: 'nonprofit', desc: 'Non-profit organization website for social causes and community impact.', fullDesc: "KF Movement's website serves as the digital home for a non-profit organization focused on social causes and community impact, featuring a donation integration, volunteer sign-up flows, and an events calendar. Built with WordPress and PHP.", tags: ['WordPress', 'PHP', 'MySQL'], featured: false, scene: 'nonprofit', liveUrl: '', bannerImgUrl: 'https://res.cloudinary.com/dpx3gst4q/image/upload/v1782254080/kfm-banner_cbicqy.png', repoUrl: '', status: 'In Progress', sortOrder: 9, createdAt: '2026-06-05T09:00:00.000Z'  },
  { id: 10, title: 'JKJAAC', catKey: 'nonprofit', desc: 'Non-profit organization website for social causes and community impact.', fullDesc: "KF Movement's website serves as the digital home for a non-profit organization focused on social causes and community impact, featuring a donation integration, volunteer sign-up flows, and an events calendar. Built with WordPress and PHP.", tags: ['WordPress', 'PHP', 'MySQL'], featured: false, scene: 'nonprofit', liveUrl: '', bannerImgUrl: 'https://res.cloudinary.com/dpx3gst4q/image/upload/v1782254079/jkjaac-banner_aa9qtd.png', repoUrl: '', status: 'In Progress', sortOrder: 9, createdAt: '2026-06-05T09:00:00.000Z'  },
];

function pickSceneForCategory(catKey) {
  if (catKey === 'ecommerce') return Math.random() > 0.5 ? 'ecommerce1' : 'ecommerce2';
  return SCENES[catKey] ? catKey : 'web';
}

function buildDeviceScene(scene) {
  const a = scene.accent;
  const id = a.replace('#', '');
  return `<svg viewBox="0 0 248 100" width="100%" height="100%" preserveAspectRatio="xMidYMid meet" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><defs><linearGradient id="g1-${id}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${a}" stop-opacity="0.9"/><stop offset="1" stop-color="${a}" stop-opacity="0.45"/></linearGradient></defs><g transform="translate(18,14)"><rect x="0" y="0" width="148" height="92" rx="6" fill="#0d0d10" stroke="rgba(255,255,255,0.12)" stroke-width="1"/><rect x="5" y="5" width="138" height="82" rx="2" fill="#15151a"/><rect x="5" y="5" width="138" height="11" fill="rgba(255,255,255,0.06)"/><circle cx="10" cy="10.5" r="1.6" fill="#e55"/><circle cx="15" cy="10.5" r="1.6" fill="#ea0"/><circle cx="20" cy="10.5" r="1.6" fill="#3c3"/><rect x="12" y="22" width="70" height="6" rx="2" fill="url(#g1-${id})"/><rect x="12" y="32" width="100" height="3.2" rx="1.6" fill="#ffffff" opacity="0.22"/><rect x="12" y="38" width="80" height="3.2" rx="1.6" fill="#ffffff" opacity="0.14"/><rect x="12" y="47" width="32" height="10" rx="2.5" fill="${a}" opacity="0.85"/><rect x="12" y="63" width="38" height="20" rx="3" fill="#ffffff" opacity="0.08"/><rect x="54" y="63" width="38" height="20" rx="3" fill="#ffffff" opacity="0.08"/><rect x="96" y="63" width="38" height="20" rx="3" fill="#ffffff" opacity="0.08"/><rect x="16" y="67" width="14" height="3" rx="1.5" fill="${a}" opacity="0.7"/><rect x="58" y="67" width="14" height="3" rx="1.5" fill="${a}" opacity="0.5"/><rect x="100" y="67" width="14" height="3" rx="1.5" fill="${a}" opacity="0.6"/><path d="M -6 92 L 154 92 L 144 99 L 4 99 Z" fill="#1a1a1f"/></g><g transform="translate(180,4)"><rect x="0" y="0" width="44" height="92" rx="7" fill="#101013" stroke="rgba(255,255,255,0.14)" stroke-width="1"/><rect x="3" y="6" width="38" height="80" rx="2" fill="#16161b"/><rect x="3" y="6" width="38" height="13" fill="rgba(255,255,255,0.07)"/><circle cx="22" cy="12" r="2" fill="${a}" opacity="0.7"/><rect x="8" y="24" width="28" height="16" rx="2.5" fill="${a}" opacity="0.55"/><rect x="8" y="44" width="28" height="3" rx="1.5" fill="#fff" opacity="0.2"/><rect x="8" y="50" width="20" height="3" rx="1.5" fill="#fff" opacity="0.14"/><rect x="8" y="60" width="28" height="9" rx="2" fill="#fff" opacity="0.08"/><rect x="8" y="72" width="28" height="9" rx="2" fill="#fff" opacity="0.08"/></g></svg>`;
}

function buildBrowserMockup(p) {
  const scene = SCENES[p.scene] || SCENES.web;
  if (p.bannerImgUrl) {
    return `<div class="pa-thumb-frame" style="background:${scene.bg};">
      <img src="${escapeHtml(p.bannerImgUrl)}" 
           alt="${escapeHtml(p.title)} screenshot" 
           class="pa-thumb-img" 
           onerror="this.style.display='none'; this.parentElement.innerHTML = '<div style=\\'display:flex;align-items:center;justify-content:center;height:100%;color:#999;font-size:14px;padding:20px;text-align:center;\\'>URL not found</div>';" />
    </div>`;
  }
  return `<div class="pa-thumb-frame" style="background:${scene.bg};">${buildDeviceScene(scene)}</div>`;
}

function projectTagsHtml(p) {
  const visible = p.tags.slice(0, 3);
  const extra = p.tags.length - visible.length;
  let html = visible.map((t) => `<span class="pa-tag">${escapeHtml(t)}</span>`).join('');
  if (extra > 0) html += `<span class="pa-tag-more">+${extra}</span>`;
  return html;
}

const PAGE_SIZE = 9;

export class ProjectsModule extends Module {
  constructor() {
    super({
      name: 'Projects',
      storageKey: 'pa_projects',
      initialState: { records: [], searchQuery: '', categoryFilter: 'all', viewMode: 'grid', page: 1 },
    });
    this.nextId = 1;
    this.currentEditId = null;
    this.addGalleryImages = [];
    this.editGalleryImages = [];
    this.addFeaturedImage = null;
    this.editFeaturedImage = null;
    this.bulkSelect = new BulkSelectController(this, {
      containerId: 'paProjectGrid',
      itemSelector: '.pa-card',
      idAttr: 'data-id',
      label: 'project',
      getVisibleIds: () => this.getFiltered().map((p) => p.id),
      onBulkDelete: (ids) => this.bulkDelete(ids),
    });
  }

  bulkDelete(ids) {
    const n = ids.size;
    if (n === 0) return;
    this.store.set('records', this.store.get('records').filter((p) => !ids.has(String(p.id))));
    this.persist();
    this.render();
    this.toast(`${n} project${n > 1 ? 's' : ''} deleted.`, 'danger');
    this.notify(`${n} project${n > 1 ? 's' : ''} deleted in bulk.`, 'ri-delete-bin-line');
  }

  async load() {
    const records = await this.loadRecords(() => SEED_PROJECTS.map((p) => ({ ...p })));
    this.nextId = Math.max(0, ...records.map((p) => p.id)) + 1;
    this.store.set('records', records);
  }

  async persist() { await this.saveRecords(this.store.get('records')); }

  findById(id) { return this.store.get('records').find((p) => p.id === id); }

  getFiltered() {
    const { records, searchQuery, categoryFilter } = this.store._raw;
    let results = records.slice().sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
    if (categoryFilter !== 'all') results = results.filter((p) => p.catKey === categoryFilter);
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      results = results.filter(
        (p) => p.title.toLowerCase().includes(q) || p.desc.toLowerCase().includes(q) || (p.fullDesc && p.fullDesc.toLowerCase().includes(q)) ||
          p.tags.some((t) => t.toLowerCase().includes(q)) || (CATEGORY_META_PROJECTS[p.catKey] && CATEGORY_META_PROJECTS[p.catKey].label.toLowerCase().includes(q)),
      );
    }
    return results;
  }

  renderCard(p) {
    const meta = CATEGORY_META_PROJECTS[p.catKey] || { label: p.catKey, cls: '' };
    const featuredBadge = p.featured ? `<span class="pa-featured-badge">Featured</span>` : '';
    return `<div class="pa-card${this.bulkSelect.cardClass(p.id)}" data-id="${p.id}"><div class="pa-card-img">${this.bulkSelect.checkboxHtml(p.id, `Select ${escapeHtml(p.title)}`)}<div class="pa-card-img-inner">${buildBrowserMockup(p)}</div>${featuredBadge}<button class="pa-star-btn ${p.featured ? 'starred' : ''}" data-id="${p.id}" title="${p.featured ? 'Remove from featured' : 'Mark as featured'}" aria-pressed="${p.featured}"><i class="ri-star-line"></i></button></div><div class="pa-card-body"><div class="pa-card-title" title="${escapeHtml(p.title)}">${escapeHtml(p.title)}</div><div class="pa-card-category ${meta.cls}">${escapeHtml(meta.label)}</div><div class="pa-card-desc">${escapeHtml(p.desc)}</div><div class="pa-card-tags">${projectTagsHtml(p)}</div><div class="pa-card-actions"><button class="pa-action-btn pa-action-view" title="View project" data-id="${p.id}" aria-label="View ${escapeHtml(p.title)}"><i class="ri-eye-line"></i></button><button class="pa-action-btn pa-action-edit" title="Edit project" data-id="${p.id}" aria-label="Edit ${escapeHtml(p.title)}"><i class="ri-pencil-line"></i></button><button class="pa-action-btn pa-action-delete" title="Delete project" data-id="${p.id}" aria-label="Delete ${escapeHtml(p.title)}"><i class="ri-delete-bin-line"></i></button><button class="pa-action-btn pa-action-more" title="More options" data-id="${p.id}" aria-label="More options for ${escapeHtml(p.title)}"><i class="ri-more-2-fill"></i></button><div class="pa-card-menu" data-id="${p.id}"><div class="pa-card-menu-item" data-action="duplicate" data-id="${p.id}"><i class="ri-file-copy-line"></i> Duplicate</div><div class="pa-card-menu-item" data-action="copy-link" data-id="${p.id}"><i class="ri-link"></i> Copy live URL</div><div class="pa-card-menu-item danger" data-action="delete" data-id="${p.id}"><i class="ri-delete-bin-line"></i> Delete</div></div></div></div></div>`;
  }

  render() {
    const all = this.getFiltered();
    const totalPages = Math.max(1, Math.ceil(all.length / PAGE_SIZE));
    let page = this.store.get('page');
    if (page > totalPages) page = totalPages;
    if (page < 1) page = 1;
    this.store.set('page', page);

    const start = (page - 1) * PAGE_SIZE;
    const pageItems = all.slice(start, start + PAGE_SIZE);
    const grid = $id('paProjectGrid');
    if (grid) {
      grid.classList.toggle('list-view', this.store.get('viewMode') === 'list');
      if (pageItems.length === 0) {
        const hasFilters = this.store.get('searchQuery').trim() || this.store.get('categoryFilter') !== 'all';
        grid.innerHTML = `<div class="pa-empty-state"><i class="ri-folder-open-line"></i><div class="pa-empty-state-title">${hasFilters ? 'No projects match your filters' : 'No projects yet'}</div><div class="pa-empty-state-text">${hasFilters ? "Try adjusting your search or category filter to find what you're looking for." : 'Get started by adding your first portfolio project.'}</div>${hasFilters ? `<button class="pa-empty-state-btn" id="paEmptyResetBtn">Reset filters</button>` : `<button class="pa-empty-state-btn" id="paEmptyAddBtn">+ Add New Project</button>`}</div>`;
        this.on($id('paEmptyResetBtn'), 'click', () => this.resetFilters());
        this.on($id('paEmptyAddBtn'), 'click', () => this.openAddPanel());
      } else {
        grid.innerHTML = pageItems.map((p) => this.renderCard(p)).join('');
        Array.from(grid.children).forEach((card, i) => { card.style.animationDelay = `${Math.min(i, 8) * 35}ms`; });
      }
    }

    const resultCount = $id('paResultCount');
    const total = this.store.get('records').length;
    if (resultCount) resultCount.textContent = all.length === total ? `${total} total projects` : `${all.length} of ${total} projects`;

    this.renderPagination(all.length, totalPages, page);
    this.attachCardListeners();
    this.bulkSelect.onRender();
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
    const btnsWrap = $id('paPaginationBtns');
    const info = $id('paPaginationInfo');
    if (!btnsWrap || !info) return;
    if (totalItems === 0) { btnsWrap.innerHTML = ''; info.textContent = 'Showing 0 of 0 projects'; return; }

    let html = `<div class="pa-page-nav ${page === 1 ? 'disabled' : ''}" id="paPagePrev" role="button" aria-label="Previous page"><i class="ri-arrow-left-s-line"></i></div>`;
    let lastShown = 0;
    for (let p = 1; p <= totalPages; p++) {
      const show = p === 1 || p === totalPages || Math.abs(p - page) <= 1;
      if (!show) continue;
      if (p - lastShown > 1) html += `<span style="color:var(--pa-text-faint); padding:0 4px; font-size:12px;">…</span>`;
      html += `<button class="pa-page-btn ${p === page ? 'active' : ''}" data-page="${p}">${p}</button>`;
      lastShown = p;
    }
    html += `<div class="pa-page-nav ${page === totalPages ? 'disabled' : ''}" id="paPageNext" role="button" aria-label="Next page"><i class="ri-arrow-right-s-line"></i></div>`;
    btnsWrap.innerHTML = html;

    const startN = (page - 1) * PAGE_SIZE + 1;
    const endN = Math.min(page * PAGE_SIZE, totalItems);
    info.textContent = `Showing ${startN} to ${endN} of ${totalItems} projects`;

    btnsWrap.querySelectorAll('.pa-page-btn').forEach((btn) => {
      btn.addEventListener('click', () => { this.store.set('page', parseInt(btn.dataset.page, 10)); this.render(); $id('paBody')?.scrollTo({ top: 0, behavior: 'smooth' }); });
    });
    const prevBtn = $id('paPagePrev');
    const nextBtn = $id('paPageNext');
    if (prevBtn && !prevBtn.classList.contains('disabled')) prevBtn.addEventListener('click', () => { this.store.set('page', page - 1); this.render(); });
    if (nextBtn && !nextBtn.classList.contains('disabled')) nextBtn.addEventListener('click', () => { this.store.set('page', page + 1); this.render(); });
  }

  resetFilters() {
    this.store.batch(() => { this.store.set('searchQuery', ''); this.store.set('categoryFilter', 'all'); this.store.set('page', 1); });
    const searchInput = $id('paSearchInput');
    if (searchInput) { searchInput.value = ''; $id('paSearchWrap')?.classList.remove('has-value'); }
    const catFilter = $id('paCategoryFilter');
    if (catFilter) catFilter.value = 'all';
    this.render();
  }

  attachCardListeners() {
    $all('.pa-action-edit').forEach((btn) => btn.addEventListener('click', () => this.openEditPanel(parseInt(btn.dataset.id, 10))));
    $all('.pa-action-delete').forEach((btn) => {
      btn.addEventListener('click', () => {
        const p = this.findById(parseInt(btn.dataset.id, 10));
        if (p) requestDelete(p.id, 'project', p.title);
      });
    });
    $all('.pa-action-view').forEach((btn) => {
      btn.addEventListener('click', () => {
        const p = this.findById(parseInt(btn.dataset.id, 10));
        if (!p) return;
        if (p.liveUrl) { this.toast(`Opening "${p.title}" in a new tab…`, 'info'); window.open(p.liveUrl, '_blank', 'noopener'); }
        else this.toast(`"${p.title}" has no live URL set yet`, 'info');
      });
    });
    $all('.pa-action-more').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const menu = btn.parentElement.querySelector('.pa-card-menu');
        if (menu) toggleCardMenu(menu);
      });
    });
    $all('.pa-card-menu-item').forEach((item) => {
      item.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = parseInt(item.dataset.id, 10);
        const action = item.dataset.action;
        closeAllCardMenus();
        if (action === 'duplicate') this.duplicateProject(id);
        else if (action === 'copy-link') this.copyLiveUrl(id);
        else if (action === 'delete') { const p = this.findById(id); if (p) requestDelete(id, 'project', p.title); }
      });
    });
    $all('.pa-star-btn').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const p = this.findById(parseInt(btn.dataset.id, 10));
        if (!p) return;
        p.featured = !p.featured;
        this.persist();
        this.render();
        this.toast(p.featured ? `"${p.title}" marked as featured` : `Featured status removed from "${p.title}"`, 'success');
      });
    });
  }

  duplicateProject(id) {
    const p = this.findById(id);
    if (!p) return;
    const copy = { ...p, id: this.nextId++, title: `${p.title} (Copy)`, featured: false, sortOrder: this.store.get('records').length + 1, tags: [...p.tags] };
    this.store.set('records', this.store.get('records').concat(copy));
    this.persist();
    this.render();
    this.toast(`Duplicated "${p.title}"`, 'success');
    this.notify(`"${p.title}" was duplicated.`, 'ri-file-copy-line');
  }

  copyLiveUrl(id) {
    const p = this.findById(id);
    if (!p) return;
    if (!p.liveUrl) { this.toast('This project has no live URL set', 'info'); return; }
    if (navigator.clipboard?.writeText) navigator.clipboard.writeText(p.liveUrl).then(() => this.toast('Live URL copied to clipboard', 'success'));
    else this.toast('Live URL copied to clipboard', 'success');
  }

  deleteById(id) {
    const p = this.findById(id);
    if (!p) return;
    this.store.set('records', this.store.get('records').filter((x) => x.id !== id));
    this.persist();
    closePanels();
    this.render();
    this.toast(`"${p.title}" was deleted.`, 'danger');
    this.notify(`"${p.title}" was deleted.`, 'ri-delete-bin-line');
  }

  // ---- Add/Edit panels: gallery, featured image, RTE, chips -----------------

  clearFormErrors(prefix) {
    ['Title', 'Category', 'ShortDesc', 'FullDesc', 'Tech'].forEach((field) => {
      $id(`${prefix}${field}Error`)?.classList.remove('visible');
      const inputId = field === 'FullDesc' ? `${prefix}RteWrap` : `${prefix}${field}`;
      $id(inputId)?.classList.remove('error');
    });
  }

  showFieldError(prefix, field, isRte) {
    $id(`${prefix}${field}Error`)?.classList.add('visible');
    $id(isRte ? `${prefix}RteWrap` : `${prefix}${field}`)?.classList.add('error');
  }

  resetAddForm() {
    // Helper to safely set textContent
    const safeSetText = (id, text) => {
      const el = $id(id);
      if (el) el.textContent = text;
    };
    
    ['addTitle', 'addCategory', 'addShortDesc', 'addImageUrl', 'addLiveUrl', 'addRepoUrl', 'addSortOrder'].forEach((id) => { 
      const el = $id(id); 
      if (el) el.value = ''; 
    });
    
    safeSetText('addShortDescCount', '0');
    
    const shortDescParent = $id('addShortDescCount')?.parentElement;
    if (shortDescParent) {
      shortDescParent.classList.remove('warn', 'max');
    }
    
    const fullDesc = $id('addFullDesc');
    if (fullDesc) fullDesc.innerHTML = '';
    
    const techChips = $id('addTechChips');
    if (techChips) techChips.innerHTML = '';
    
    const techInput = $id('addTechInput');
    if (techInput) techInput.value = '';
    
    const status = $id('addStatus');
    if (status) status.value = 'Completed';
    
    const featured = $id('addFeatured');
    if (featured) featured.value = '0';
    
    const featuredPreview = $id('addFeaturedPreviewWrap');
    if (featuredPreview) featuredPreview.innerHTML = '';
    
    const galleryGrid = $id('addGalleryGrid');
    if (galleryGrid) galleryGrid.innerHTML = '';
    
    const mediaUpload = $id('addMediaUpload');
    if (mediaUpload) mediaUpload.style.display = '';
    
    this.addGalleryImages = [];
    this.addFeaturedImage = null;
    this.clearFormErrors('add');
  }

  openAddPanel() {
    if (PAGE !== 'projects') return;
    this.resetAddForm();
    openPanel('paAddPanel', ['paEditPanel']);
    activateTab('add', 'general');
    const titleEl = $id('addTitle');
    if (titleEl) setTimeout(() => titleEl.focus(), 320);
  }

  openEditPanel(id) {
    if (PAGE !== 'projects') return;
    const project = this.findById(id);
    if (!project) return;
    this.currentEditId = id;
    this.clearFormErrors('edit');

    const editTitle = $id('editTitle');
    if (editTitle) editTitle.value = project.title;
    
    const editCategory = $id('editCategory');
    if (editCategory) editCategory.value = project.catKey;
    
    const editShortDesc = $id('editShortDesc');
    if (editShortDesc) editShortDesc.value = project.desc;
    
    const editShortDescCount = $id('editShortDescCount');
    if (editShortDescCount) editShortDescCount.textContent = project.desc.length;
    
    const editFullDesc = $id('editFullDesc');
    if (editFullDesc) editFullDesc.innerHTML = escapeHtml(project.fullDesc || '');
    
    const editTechChips = $id('editTechChips');
    if (editTechChips) populateChips(editTechChips, project.tags);
    
    const editImageUrl = $id('editImageUrl');
    if (editImageUrl) editImageUrl.value = project.imageUrl || '';
    
    const editLiveUrl = $id('editLiveUrl');
    if (editLiveUrl) editLiveUrl.value = project.liveUrl || '';
    
    const editRepoUrl = $id('editRepoUrl');
    if (editRepoUrl) editRepoUrl.value = project.repoUrl || '';
    
    const editStatus = $id('editStatus');
    if (editStatus) editStatus.value = project.status || 'Completed';
    
    const editFeatured = $id('editFeatured');
    if (editFeatured) editFeatured.value = project.featured ? '1' : '0';
    
    const editSortOrder = $id('editSortOrder');
    if (editSortOrder) editSortOrder.value = project.sortOrder || '';

    this.editGalleryImages = (project.gallery || []).slice();
    this.renderGalleryGrid('edit');
    this.editFeaturedImage = project.imageUrl ? { url: project.imageUrl, name: 'Current image' } : null;
    this.renderFeaturedPreview('edit');

    openPanel('paEditPanel', ['paAddPanel']);
    activateTab('edit', 'general');
  }

  renderFeaturedPreview(prefix) {
    const wrap = $id(`${prefix}FeaturedPreviewWrap`);
    const uploadBox = $id(`${prefix}MediaUpload`);
    const image = prefix === 'add' ? this.addFeaturedImage : this.editFeaturedImage;
    if (!image) { 
      if (wrap) wrap.innerHTML = ''; 
      if (uploadBox) uploadBox.style.display = ''; 
      return; 
    }
    if (uploadBox) uploadBox.style.display = 'none';
    if (wrap) {
      wrap.innerHTML = `<div class="pa-media-preview"><img src="${image.url}" alt="${escapeHtml(image.name)}" /><button type="button" class="pa-media-preview-remove" aria-label="Remove image"><i class="ri-close-line"></i></button></div>`;
      const removeBtn = wrap.querySelector('.pa-media-preview-remove');
      if (removeBtn) {
        removeBtn.addEventListener('click', () => {
          if (prefix === 'add') this.addFeaturedImage = null; else this.editFeaturedImage = null;
          this.renderFeaturedPreview(prefix);
        });
      }
    }
  }

  renderGalleryGrid(prefix) {
    const grid = $id(`${prefix}GalleryGrid`);
    const images = prefix === 'add' ? this.addGalleryImages : this.editGalleryImages;
    if (!grid) return;
    grid.innerHTML = images.map((img, i) => `<div class="pa-gallery-thumb"><img src="${img.url}" alt="${escapeHtml(img.name || 'Gallery image')}" /><div class="pa-gallery-thumb-remove" data-i="${i}" role="button" aria-label="Remove image"><i class="ri-close-line"></i></div></div>`).join('');
    grid.querySelectorAll('.pa-gallery-thumb-remove').forEach((btn) => {
      btn.addEventListener('click', () => {
        const i = parseInt(btn.dataset.i, 10);
        if (prefix === 'add') this.addGalleryImages.splice(i, 1); else this.editGalleryImages.splice(i, 1);
        this.renderGalleryGrid(prefix);
      });
    });
  }

  setupMediaUpload(prefix) {
    const uploadBox = $id(`${prefix}MediaUpload`);
    const fileInput = $id(`${prefix}FeaturedFile`);
    if (!uploadBox || !fileInput) return;
    this.on(uploadBox, 'click', () => fileInput.click());
    this.on(uploadBox, 'keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); fileInput.click(); } });
    uploadBox.setAttribute('tabindex', '0');
    uploadBox.setAttribute('role', 'button');

    const acceptFile = async (file) => {
      if (!handleFileValidation(file)) return;
      try {
        const dataUrl = await readFileAsDataUrl(file);
        if (prefix === 'add') this.addFeaturedImage = { url: dataUrl, name: file.name };
        else this.editFeaturedImage = { url: dataUrl, name: file.name };
        this.renderFeaturedPreview(prefix);
        this.toast('Image uploaded', 'success');
      } catch { this.toast('Could not read that image file', 'danger'); }
    };

    this.on(fileInput, 'change', async () => {
      const file = fileInput.files[0];
      fileInput.value = '';
      if (file) await acceptFile(file);
    });
    ['dragenter', 'dragover'].forEach((evt) => this.on(uploadBox, evt, (e) => { e.preventDefault(); uploadBox.classList.add('dragover'); }));
    ['dragleave', 'drop'].forEach((evt) => this.on(uploadBox, evt, (e) => { e.preventDefault(); uploadBox.classList.remove('dragover'); }));
    this.on(uploadBox, 'drop', async (e) => { const file = e.dataTransfer.files?.[0]; if (file) await acceptFile(file); });
  }

  setupGalleryUpload(prefix) {
    const uploadBox = $id(`${prefix}GalleryUpload`);
    const fileInput = $id(`${prefix}GalleryFile`);
    if (!uploadBox || !fileInput) return;
    this.on(uploadBox, 'click', () => fileInput.click());
    this.on(fileInput, 'change', async () => {
      const files = Array.from(fileInput.files || []);
      for (const file of files) {
        if (!handleFileValidation(file)) continue;
        try {
          const dataUrl = await readFileAsDataUrl(file);
          const entry = { url: dataUrl, name: file.name };
          if (prefix === 'add') this.addGalleryImages.push(entry); else this.editGalleryImages.push(entry);
        } catch { /* skip unreadable file */ }
      }
      this.renderGalleryGrid(prefix);
      if (files.length) this.toast(`${files.length} image${files.length > 1 ? 's' : ''} added to gallery`, 'success');
      fileInput.value = '';
    });
  }

  // ---- validation + submit ---------------------------------------------------

  validateForm(prefix) {
    this.clearFormErrors(prefix);
    let valid = true;

    const titleEl = $id(`${prefix}Title`);
    const title = titleEl ? titleEl.value.trim() : '';
    if (!title) { this.showFieldError(prefix, 'Title'); valid = false; }

    const categoryEl = $id(`${prefix}Category`);
    const category = categoryEl ? categoryEl.value : '';
    if (!category) { this.showFieldError(prefix, 'Category'); valid = false; }

    const shortDescEl = $id(`${prefix}ShortDesc`);
    const shortDesc = shortDescEl ? shortDescEl.value.trim() : '';
    if (!shortDesc) { this.showFieldError(prefix, 'ShortDesc'); valid = false; }

    const fullDescEl = $id(`${prefix}FullDesc`);
    const fullDesc = fullDescEl ? fullDescEl.textContent.trim() : '';
    if (!fullDesc) { this.showFieldError(prefix, 'FullDesc', true); valid = false; }

    const techChipsEl = $id(`${prefix}TechChips`);
    const tags = techChipsEl ? getChipValues(techChipsEl) : [];
    if (tags.length === 0) { this.showFieldError(prefix, 'Tech'); valid = false; }

    const liveUrlEl = $id(`${prefix}LiveUrl`);
    const liveUrl = liveUrlEl ? liveUrlEl.value.trim() : '';
    const repoUrlEl = $id(`${prefix}RepoUrl`);
    const repoUrl = repoUrlEl ? repoUrlEl.value.trim() : '';
    if (liveUrl && !isValidUrl(liveUrl)) { this.toast('Live URL is not valid — include https://', 'danger'); valid = false; }
    if (repoUrl && !isValidUrl(repoUrl)) { this.toast('GitHub Repository URL is not valid — include https://', 'danger'); valid = false; }

    if (!valid) {
      const generalFieldsInvalid = !title || !category || !shortDesc || !fullDesc || tags.length === 0;
      if (generalFieldsInvalid) activateTab(prefix, 'general');
    }

    return { valid, title, category, shortDesc, fullDesc, tags, liveUrl, repoUrl };
  }

  handleAddSubmit() {
    if (PAGE !== 'projects') return;
    const result = this.validateForm('add');
    if (!result.valid) { this.toast('Please fill in all required fields', 'danger'); return; }

    setButtonLoading('paAddSubmit', true);
    setTimeout(() => {
      const statusEl = $id('addStatus');
      const status = statusEl ? statusEl.value : 'Completed';
      
      const featuredEl = $id('addFeatured');
      const featured = featuredEl ? featuredEl.value === '1' : false;
      
      const sortOrderRawEl = $id('addSortOrder');
      const sortOrderRaw = sortOrderRawEl ? sortOrderRawEl.value : '';
      
      const categoryEl = $id('addCategory');
      const category = categoryEl ? categoryEl.value : '';
      
      const imageUrlEl = $id('addImageUrl');
      const imageUrl = imageUrlEl ? imageUrlEl.value.trim() : '';

      const newProject = {
        id: this.nextId++, title: result.title, catKey: category, desc: result.shortDesc, fullDesc: result.fullDesc,
        tags: result.tags, featured, scene: pickSceneForCategory(category), liveUrl: result.liveUrl, repoUrl: result.repoUrl,
        status, sortOrder: sortOrderRaw ? parseInt(sortOrderRaw, 10) : this.store.get('records').length + 1,
        imageUrl: (this.addFeaturedImage && this.addFeaturedImage.url) || imageUrl || '',
        gallery: this.addGalleryImages.slice(),
        createdAt: new Date().toISOString(),
      };

      this.store.set('records', this.store.get('records').concat(newProject));
      this.persist();
      setButtonLoading('paAddSubmit', false);
      closePanels();
      this.resetFilters();
      this.render();
      this.toast(`"${newProject.title}" added successfully!`, 'success');
      this.notify(`New project "${newProject.title}" was added.`, 'ri-add-circle-line');
    }, 450);
  }

  handleEditSubmit() {
    if (PAGE !== 'projects' || this.currentEditId == null) return;
    const result = this.validateForm('edit');
    if (!result.valid) { this.toast('Please fill in all required fields', 'danger'); return; }

    setButtonLoading('paEditSubmit', true);
    setTimeout(() => {
      const p = this.findById(this.currentEditId);
      if (!p) { setButtonLoading('paEditSubmit', false); return; }

      p.title = result.title;
      
      const catKeyEl = $id('editCategory');
      p.catKey = catKeyEl ? catKeyEl.value : p.catKey;
      
      p.desc = result.shortDesc;
      p.fullDesc = result.fullDesc;
      p.tags = result.tags;
      p.liveUrl = result.liveUrl;
      p.repoUrl = result.repoUrl;
      
      const statusEl = $id('editStatus');
      p.status = statusEl ? statusEl.value : p.status;
      
      const featuredEl = $id('editFeatured');
      p.featured = featuredEl ? featuredEl.value === '1' : p.featured;
      
      const sortOrderRawEl = $id('editSortOrder');
      const sortOrderRaw = sortOrderRawEl ? sortOrderRawEl.value : '';
      p.sortOrder = sortOrderRaw ? parseInt(sortOrderRaw, 10) : p.sortOrder;
      
      const imageUrlEl = $id('editImageUrl');
      p.imageUrl = (this.editFeaturedImage && this.editFeaturedImage.url) || (imageUrlEl ? imageUrlEl.value.trim() : '') || '';
      p.gallery = this.editGalleryImages.slice();
      if (!SCENES[p.scene]) p.scene = pickSceneForCategory(p.catKey);

      this.persist();
      setButtonLoading('paEditSubmit', false);
      closePanels();
      this.render();
      this.toast(`"${p.title}" updated successfully!`, 'success');
      this.notify(`"${p.title}" was updated.`, 'ri-pencil-line');
    }, 450);
  }

  // ---- events ---------------------------------------------------------------

  bindEvents() {
    registerPanel('paAddPanel');
    registerPanel('paEditPanel');

    this.setupMediaUpload('add');
    this.setupMediaUpload('edit');
    this.setupGalleryUpload('add');
    this.setupGalleryUpload('edit');
    setupRte('addRteWrap', 'addFullDesc');
    setupRte('editRteWrap', 'editFullDesc');

    const addNewBtn = $id('paAddNewBtn');
    if (addNewBtn) this.on(addNewBtn, 'click', () => this.openAddPanel());
    
    const addPanelClose = $id('paAddPanelClose');
    if (addPanelClose) this.on(addPanelClose, 'click', () => closePanels());
    
    const editPanelClose = $id('paEditPanelClose');
    if (editPanelClose) this.on(editPanelClose, 'click', () => closePanels());
    
    const addCancel = $id('paAddCancel');
    if (addCancel) this.on(addCancel, 'click', () => closePanels());
    
    const editCancel = $id('paEditCancel');
    if (editCancel) this.on(editCancel, 'click', () => closePanels());
    
    const addSubmit = $id('paAddSubmit');
    if (addSubmit) this.on(addSubmit, 'click', () => this.handleAddSubmit());
    
    const editSubmit = $id('paEditSubmit');
    if (editSubmit) this.on(editSubmit, 'click', () => this.handleEditSubmit());
    
    const editDelete = $id('paEditDelete');
    if (editDelete) {
      this.on(editDelete, 'click', () => {
        const p = this.findById(this.currentEditId);
        if (p) requestDelete(p.id, 'project', p.title);
      });
    }

    const addTechInput = $id('addTechInput');
    if (addTechInput) {
      this.on(addTechInput, 'keydown', (e) => {
        if (e.key === 'Enter' || e.key === ',') { 
          e.preventDefault(); 
          const chips = $id('addTechChips');
          if (chips) addChip(chips, e.target.value); 
          e.target.value = ''; 
        }
      });
    }
    
    const editTechInput = $id('editTechInput');
    if (editTechInput) {
      this.on(editTechInput, 'keydown', (e) => {
        if (e.key === 'Enter' || e.key === ',') { 
          e.preventDefault(); 
          const chips = $id('editTechChips');
          if (chips) addChip(chips, e.target.value); 
          e.target.value = ''; 
        }
      });
    }

    ['addShortDesc', 'editShortDesc'].forEach((id) => {
      const el = $id(id);
      if (el) {
        this.on(el, 'input', (e) => {
          const counter = $id(`${id}Count`);
          if (counter) counter.textContent = e.target.value.length;
        });
      }
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
    
    const searchClear = $id('paSearchClear');
    if (searchClear) {
      this.on(searchClear, 'click', () => {
        if (!searchInput) return;
        searchInput.value = '';
        this.store.set('searchQuery', '');
        $id('paSearchWrap')?.classList.remove('has-value');
        this.render();
      });
    }
    
    const categoryFilter = $id('paCategoryFilter');
    if (categoryFilter) {
      this.on(categoryFilter, 'change', (e) => { 
        this.store.update({ categoryFilter: e.target.value, page: 1 }); 
        this.render(); 
      });
    }
    
    // FIX: View mode toggle with proper active class handling
    const gridBtn = $id('paGridViewBtn');
    const listBtn = $id('paListViewBtn');
    
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

    this.onBus('confirm:confirmed', ({ id, type }) => { 
      if (type === 'project') this.deleteById(id); 
    });
    this.onBus('shortcut:new-item', ({ page }) => { 
      if (page === PAGE) this.openAddPanel(); 
    });
  }
}