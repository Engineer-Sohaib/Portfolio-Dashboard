import { CrudCardModule } from '../../core/CrudCardModule.js';
import { escapeHtml, $id } from '../../utils/dom.js';
import { formatDate } from '../../utils/format.js';
import { slugify, isValidSlug } from '../../utils/strings.js';
import { readFileAsDataUrl, handleFileValidation } from '../../utils/files.js';
import { setupRte } from '../../utils/rte.js';
import { addChip, getChipValues, populateChips } from '../../utils/chips.js';
import { activateTab, openPanel } from '../../modules/shell/panels.js';

const BLOG_CATEGORY_META = {
  tutorial: { label: 'Tutorial', cls: 'pa-cat-web' },
  'case-study': { label: 'Case Study', cls: 'pa-cat-ecommerce' },
  career: { label: 'Career & Growth', cls: 'pa-cat-educational' },
  news: { label: 'News & Updates', cls: 'pa-cat-travel' },
  tips: { label: 'Tips & Tricks', cls: 'pa-cat-nonprofit' },
  opinion: { label: 'Opinion', cls: 'pa-cat-medical' },
  devlog: { label: 'Dev Log', cls: 'pa-cat-desktop' },
  announcement: { label: 'Announcement', cls: 'pa-cat-enterprise' },
};

const SEED_BLOG_POSTS = [
  { id: 1, title: 'Migrating a Portfolio to Next.js 14 with the App Router', slug: 'migrating-portfolio-nextjs-14-app-router', excerpt: 'A walkthrough of lifting and shifting a static site into Next.js 14, including a tricky BeautifulSoup comment-node bug encountered along the way.', content: 'Moving a hand-built site into a modern framework surfaces problems you never expected. This post walks through the lift-and-shift automation approach, the App Router folder structure, and the fix for a BeautifulSoup comment-node serialization bug that broke the /projects route at runtime.', category: 'devlog', tags: ['Next.js', 'React', 'Migration'], status: 'Published', featured: true, imageUrl: '', imageAlt: '', publishedAt: '2026-05-18', sortOrder: 1, createdAt: '2026-05-18T09:00:00.000Z' },
  { id: 2, title: 'Why I Moved My Project Data to Cloud Firestore', slug: 'why-i-moved-project-data-to-firestore', excerpt: 'Comparing Firestore against Firebase SQL Connect, Realtime Database, and Storage for a portfolio admin panel — and why Firestore won.', content: 'Static JSON files are fine until you want an admin panel with live edits. This post covers the reasoning behind choosing Cloud Firestore, the shape of the firebase-service.js module, security rules, and the self-contained admin panel with Google Auth and full CRUD.', category: 'case-study', tags: ['Firebase', 'Firestore', 'Admin Panel'], status: 'Published', featured: true, imageUrl: '', imageAlt: '', publishedAt: '2026-04-02', sortOrder: 2, createdAt: '2026-04-02T09:00:00.000Z' },
  { id: 3, title: 'A Practical Guide to Auditing WordPress Theme Security', slug: 'practical-guide-wordpress-theme-security-audit', excerpt: 'Lessons from a pre-deployment audit that turned up 29 findings, from XSS vectors to plain-text SMTP credentials.', content: 'Security audits are more valuable before launch than after. This guide breaks down a real pre-deployment review process — checking for unescaped output, unprepared SQL statements, missing ABSPATH guards, and other issues that are easy to miss under deadline pressure.', category: 'tips', tags: ['WordPress', 'Security'], status: 'Draft', featured: false, imageUrl: '', imageAlt: '', publishedAt: '2026-06-10', sortOrder: 3, createdAt: '2026-06-10T09:00:00.000Z' },
];

export class BlogModule extends CrudCardModule {
  constructor() {
    super({
      name: 'BlogPosts',
      storageKey: 'pa_blog_posts',
      deleteType: 'blogpost',
      page: 'blogposts',
      pageSize: 9,
      cardIdAttr: 'data-blog-id',
      defaultFilters: { category: 'all', status: 'all' },
      filterSelectIds: [{ id: 'paBlogCategoryFilter', key: 'category' }, { id: 'paBlogStatusFilter', key: 'status' }],
      addFocusId: 'blogAddTitle',
      editFocusId: 'blogEditTitle',
      tabGroup: null, // panels use their own tab groups ("blogAdd"/"blogEdit"); see open*Panel overrides.
      bulkLabel: 'post',
      ids: {
        grid: 'paBlogGrid', resultCount: 'paBlogResultCount',
        paginationBtns: 'paBlogPaginationBtns', paginationInfo: 'paBlogPaginationInfo',
        pagePrev: 'paBlogPagePrev', pageNext: 'paBlogPageNext', bodyScroll: 'paBlogBody',
        emptyResetBtn: 'paBlogEmptyResetBtn', emptyAddBtn: 'paBlogEmptyAddBtn',
        addPanel: 'paBlogAddPanel', editPanel: 'paBlogEditPanel',
        addSubmit: 'paBlogAddSubmit', editSubmit: 'paBlogEditSubmit', editDelete: 'paBlogEditDelete',
        addNewBtn: 'paBlogAddNewBtn', addPanelClose: 'paBlogAddPanelClose', editPanelClose: 'paBlogEditPanelClose',
        addCancel: 'paBlogAddCancel', editCancel: 'paBlogEditCancel',
      },
      menuActions: { 'copy-slug': function copySlug(id) { this.copySlugUrl(id); } },
    });
    this.addImageData = null;
    this.editImageData = null;
    this.addSlugTouched = false;
    this.editSlugTouched = false;
  }

  seedData() { return SEED_BLOG_POSTS.map((p) => ({ ...p, tags: [...p.tags] })); }

  sortRecords(records) { return records.slice().sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0)); }

  matchesFilters(record, filters) {
    if (filters.category !== 'all' && record.category !== filters.category) return false;
    if (filters.status !== 'all' && record.status !== filters.status) return false;
    return true;
  }

  matchesSearch(record, query) {
    const q = query.trim().toLowerCase();
    return (
      record.title.toLowerCase().includes(q) ||
      record.slug.toLowerCase().includes(q) ||
      (record.excerpt || '').toLowerCase().includes(q) ||
      record.tags.some((t) => t.toLowerCase().includes(q)) ||
      (BLOG_CATEGORY_META[record.category]?.label || '').toLowerCase().includes(q)
    );
  }

  getDeleteName(record) { return record.title; }

  _tagsHtml(p) {
    const visible = p.tags.slice(0, 2);
    const extra = p.tags.length - visible.length;
    let html = visible.map((t) => `<span class="pa-tag">${escapeHtml(t)}</span>`).join('');
    if (extra > 0) html += `<span class="pa-tag-more">+${extra}</span>`;
    return html;
  }

  renderCard(p, index) {
    const meta = BLOG_CATEGORY_META[p.category] || { label: p.category, cls: '' };
    const featuredBadge = p.featured ? `<span class="pa-featured-badge">Featured</span>` : '';
    const statusColor = p.status === 'Published' ? 'var(--pa-green)' : 'var(--pa-text-mute)';
    const thumb = p.imageUrl
      ? `<img class="pa-thumb-img" src="${escapeHtml(p.imageUrl)}" alt="${escapeHtml(p.imageAlt || p.title)}" loading="lazy" />`
      : `<div style="display:flex;align-items:center;justify-content:center;width:100%;height:100%;"><i class="ri-article-line" style="font-size:34px;color:var(--pa-text-ghost);"></i></div>`;
    return `<div class="pa-card${this.bulkSelect?.cardClass(p.id) || ''}" data-blog-id="${p.id}" style="animation-delay:${Math.min(index, 11) * 35}ms;"><div class="pa-card-img">${this.bulkSelect?.checkboxHtml(p.id, `Select ${escapeHtml(p.title)}`) || ''}<div class="pa-card-img-inner" style="padding:0;">${thumb}</div>${featuredBadge}<span class="pa-featured-badge" style="right:auto;left:10px;background:none;box-shadow:none;border:1px solid ${statusColor};color:${statusColor};">${escapeHtml(p.status)}</span></div><div class="pa-card-body"><div class="pa-card-title" title="${escapeHtml(p.title)}">${escapeHtml(p.title)}</div><div class="pa-card-category ${meta.cls}">${escapeHtml(meta.label)}</div><div class="pa-card-desc">${escapeHtml(p.excerpt)}</div><div class="pa-card-tags"><span class="pa-tag"><i class="ri-calendar-line" style="font-size:9px;margin-right:3px;"></i>${escapeHtml(formatDate(p.publishedAt))}</span>${this._tagsHtml(p)}</div><div class="pa-card-actions"><button class="pa-action-btn pa-action-edit" data-blog-id="${p.id}" title="Edit blog post" aria-label="Edit ${escapeHtml(p.title)}"><i class="ri-pencil-line"></i></button><button class="pa-action-btn pa-action-delete" data-blog-id="${p.id}" title="Delete blog post" aria-label="Delete ${escapeHtml(p.title)}"><i class="ri-delete-bin-line"></i></button><button class="pa-action-btn pa-action-more" data-blog-id="${p.id}" title="More options" aria-label="More options for ${escapeHtml(p.title)}"><i class="ri-more-2-fill"></i></button><div class="pa-card-menu" data-blog-id="${p.id}"><div class="pa-card-menu-item" data-action="duplicate" data-blog-id="${p.id}"><i class="ri-file-copy-line"></i> Duplicate</div><div class="pa-card-menu-item" data-action="copy-slug" data-blog-id="${p.id}"><i class="ri-links-line"></i> Copy slug URL</div><div class="pa-card-menu-item danger" data-action="delete" data-blog-id="${p.id}"><i class="ri-delete-bin-line"></i> Delete</div></div></div></div></div>`;
  }

  copySlugUrl(id) {
    const p = this.findById(id);
    if (!p) return;
    navigator.clipboard?.writeText(`/blog/${p.slug}`).then(() => this.toast('Slug URL copied to clipboard', 'success'));
  }

  buildDuplicate(record, newId) {
    let slug = `${record.slug}-copy`;
    let suffix = 2;
    const slugs = new Set(this.store.get('records').map((r) => r.slug));
    while (slugs.has(slug)) slug = `${record.slug}-copy-${suffix++}`;
    return { ...record, id: newId, title: `${record.title} (Copy)`, slug, status: 'Draft', featured: false, tags: [...record.tags], createdAt: new Date().toISOString() };
  }

  // ---- featured image dropzone -------------------------------------------

  setFeaturedPreview(prefix, dataUrl, alt) {
    const wrap = $id(`${prefix}ImagePreviewWrap`);
    const img = $id(`${prefix}ImagePreviewImg`);
    const dz = $id(`${prefix}ImageDropzone`);
    if (dataUrl) {
      if (img) { img.src = dataUrl; img.alt = alt || ''; }
      if (wrap) wrap.style.display = 'block';
      if (dz) dz.style.display = 'none';
    } else {
      if (wrap) wrap.style.display = 'none';
      if (dz) dz.style.display = 'block';
    }
  }

  setupImageDropzone(prefix) {
    const dropzone = $id(`${prefix}ImageDropzone`);
    const fileInput = $id(`${prefix}ImageFileInput`);
    const removeBtn = $id(`${prefix}ImageRemoveBtn`);
    if (!dropzone || !fileInput || dropzone._wired) return;
    dropzone._wired = true;
    const setData = (dataUrl) => {
      if (prefix === 'blogAdd') this.addImageData = dataUrl; else this.editImageData = dataUrl;
      this.setFeaturedPreview(prefix, dataUrl);
    };
    this.on(dropzone, 'click', () => fileInput.click());
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
    this.setupImageDropzone('blogAdd');
    this.setupImageDropzone('blogEdit');
    setupRte('blogAddRteWrap', 'blogAddContent');
    setupRte('blogEditRteWrap', 'blogEditContent');

    // Slug auto-fills from Title until the user edits Slug directly.
    this.on($id('blogAddTitle'), 'input', (e) => {
      if (!this.addSlugTouched) $id('blogAddSlug').value = slugify(e.target.value);
    });
    this.on($id('blogAddSlug'), 'input', () => { this.addSlugTouched = true; });
    this.on($id('blogEditTitle'), 'input', (e) => {
      if (!this.editSlugTouched) $id('blogEditSlug').value = slugify(e.target.value);
    });
    this.on($id('blogEditSlug'), 'input', () => { this.editSlugTouched = true; });

    this.on($id('blogAddTagInput'), 'keydown', (e) => {
      if (e.key === 'Enter' || e.key === ',') {
        e.preventDefault();
        addChip($id('blogAddTagChips'), e.target.value);
        e.target.value = '';
      }
    });
    this.on($id('blogEditTagInput'), 'keydown', (e) => {
      if (e.key === 'Enter' || e.key === ',') {
        e.preventDefault();
        addChip($id('blogEditTagChips'), e.target.value);
        e.target.value = '';
      }
    });
  }

  // Blog panels use "blogAdd"/"blogEdit" tab groups (not the panel id) and
  // default to the "content" tab, so these override the generic base logic.
  openAddPanel() {
    this.resetAddForm();
    openPanel(this.config.ids.addPanel, [this.config.ids.editPanel]);
    activateTab('blogAdd', 'content');
    setTimeout(() => $id('blogAddTitle')?.focus(), 320);
  }

  openEditPanel(id) {
    const record = this.findById(id);
    if (!record) return;
    this.currentEditId = id;
    this.populateEditForm(record);
    openPanel(this.config.ids.editPanel, [this.config.ids.addPanel]);
    activateTab('blogEdit', 'content');
    setTimeout(() => $id('blogEditTitle')?.focus(), 320);
  }

  // ---- forms ----------------------------------------------------------------

  resetAddForm() {
    ['blogAddTitle', 'blogAddSlug', 'blogAddCategory', 'blogAddExcerpt', 'blogAddImageAlt', 'blogAddSortOrder'].forEach((id) => { const el = $id(id); if (el) el.value = ''; });
    $id('blogAddExcerptCount').textContent = '0';
    $id('blogAddExcerptCount').parentElement.classList.remove('warn', 'max');
    $id('blogAddContent').innerHTML = '';
    $id('blogAddTagChips').innerHTML = '';
    $id('blogAddTagInput').value = '';
    $id('blogAddStatus').value = 'Draft';
    $id('blogAddFeatured').value = '0';
    $id('blogAddPublishedDate').value = new Date().toISOString().slice(0, 10);
    this.addImageData = null;
    this.addSlugTouched = false;
    this.setFeaturedPreview('blogAdd', null);
    ['Title', 'Slug', 'Category', 'Excerpt', 'Content'].forEach((f) => {
      $id(`blogAdd${f}Error`)?.classList.remove('visible');
      $id(f === 'Content' ? 'blogAddRteWrap' : `blogAdd${f}`)?.classList.remove('error');
    });
  }

  populateEditForm(p) {
    this.editSlugTouched = true;
    $id('blogEditTitle').value = p.title;
    $id('blogEditSlug').value = p.slug;
    $id('blogEditCategory').value = p.category;
    $id('blogEditExcerpt').value = p.excerpt;
    $id('blogEditExcerptCount').textContent = p.excerpt.length;
    $id('blogEditContent').innerHTML = escapeHtml(p.content || '');
    populateChips($id('blogEditTagChips'), p.tags);
    $id('blogEditImageAlt').value = p.imageAlt || '';
    $id('blogEditStatus').value = p.status || 'Draft';
    $id('blogEditFeatured').value = p.featured ? '1' : '0';
    $id('blogEditPublishedDate').value = p.publishedAt || new Date().toISOString().slice(0, 10);
    $id('blogEditSortOrder').value = p.sortOrder != null ? String(p.sortOrder) : '';
    this.editImageData = p.imageUrl || null;
    this.setFeaturedPreview('blogEdit', p.imageUrl || null, p.imageAlt);
    ['Title', 'Slug', 'Category', 'Excerpt', 'Content'].forEach((f) => {
      $id(`blogEdit${f}Error`)?.classList.remove('visible');
      $id(f === 'Content' ? 'blogEditRteWrap' : `blogEdit${f}`)?.classList.remove('error');
    });
  }

  validateForm(prefix) {
    let valid = true;
    const p = prefix === 'add' ? 'blogAdd' : 'blogEdit';

    const title = $id(`${p}Title`).value.trim();
    this._toggleErr(`${p}Title`, !title);
    if (!title) valid = false;

    const slugEl = $id(`${p}Slug`);
    const slug = slugEl.value.trim();
    const slugErr = $id(`${p}SlugError`);
    if (!slug) {
      slugEl.classList.add('error');
      if (slugErr) { slugErr.classList.add('visible'); slugErr.querySelector('span').textContent = 'URL slug is required'; }
      valid = false;
    } else if (!isValidSlug(slug)) {
      slugEl.classList.add('error');
      if (slugErr) { slugErr.classList.add('visible'); slugErr.querySelector('span').textContent = 'Slug must be lowercase letters, digits, or hyphens (e.g. "my-post-title")'; }
      valid = false;
    } else {
      const editingId = p === 'blogEdit' ? this.currentEditId : null;
      const duplicate = this.store.get('records').find((post) => post.slug === slug && String(post.id) !== String(editingId));
      if (duplicate) {
        slugEl.classList.add('error');
        if (slugErr) { slugErr.classList.add('visible'); slugErr.querySelector('span').textContent = `Slug "${slug}" is already in use`; }
        valid = false;
      } else {
        slugEl.classList.remove('error');
        slugErr?.classList.remove('visible');
      }
    }

    const category = $id(`${p}Category`).value;
    this._toggleErr(`${p}Category`, !category);
    if (!category) valid = false;

    const excerpt = $id(`${p}Excerpt`).value.trim();
    this._toggleErr(`${p}Excerpt`, !excerpt);
    if (!excerpt) valid = false;

    const contentEl = $id(`${p}Content`);
    const content = contentEl.textContent.trim();
    $id(`${p}ContentError`)?.classList.toggle('visible', !content);
    $id(`${p}RteWrap`)?.classList.toggle('error', !content);
    if (!content) valid = false;

    const tags = getChipValues($id(`${p}TagChips`));

    if (!valid) activateTab(p, 'content');

    return { valid, title, slug, category, excerpt, content, tags };
  }

  _toggleErr(id, isError) {
    $id(id)?.classList.toggle('error', isError);
    $id(`${id}Error`)?.classList.toggle('visible', isError);
  }

  buildNewRecord(f) {
    const publishedDate = $id('blogAddPublishedDate').value;
    const sortOrderRaw = $id('blogAddSortOrder').value;
    return {
      title: f.title, slug: f.slug, category: f.category, excerpt: f.excerpt, content: f.content, tags: f.tags,
      status: $id('blogAddStatus').value,
      featured: $id('blogAddFeatured').value === '1',
      imageUrl: this.addImageData || '',
      imageAlt: $id('blogAddImageAlt').value.trim(),
      publishedAt: publishedDate || new Date().toISOString().slice(0, 10),
      sortOrder: sortOrderRaw ? parseInt(sortOrderRaw, 10) : this.store.get('records').length + 1,
      createdAt: new Date().toISOString(),
    };
  }

  applyEditToRecord(record, f) {
    record.title = f.title;
    record.slug = f.slug;
    record.category = f.category;
    record.excerpt = f.excerpt;
    record.content = f.content;
    record.tags = f.tags;
    record.status = $id('blogEditStatus').value;
    record.featured = $id('blogEditFeatured').value === '1';
    record.imageUrl = this.editImageData || '';
    record.imageAlt = $id('blogEditImageAlt').value.trim();
    const publishedDate = $id('blogEditPublishedDate').value;
    record.publishedAt = publishedDate || record.publishedAt;
    const sortOrderRaw = $id('blogEditSortOrder').value;
    record.sortOrder = sortOrderRaw ? parseInt(sortOrderRaw, 10) : record.sortOrder;
  }
}
