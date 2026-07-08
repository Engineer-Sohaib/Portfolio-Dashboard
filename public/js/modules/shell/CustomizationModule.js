// src/modules/shell/CustomizationModule.js
import { Module } from '../../core/Module.js';
import { $id } from '../../utils/dom.js';
import { storage } from '../../core/StorageService.js';
import { closePanels, activateTab, registerPanel } from './panels.js';

const CUSTOM_STORE_KEY = 'appearance_settings_v2';

const CUSTOM_FONTS = [
  { group: 'Sans-serif', fonts: [
    { id: 'inter', name: 'Inter', stack: "'Inter', sans-serif", sample: 'The quick brown fox' },
    { id: 'outfit', name: 'Outfit', stack: "'Outfit', sans-serif", sample: 'Clean and modern' },
    { id: 'dm-sans', name: 'DM Sans', stack: "'DM Sans', sans-serif", sample: 'The quick brown fox' },
    { id: 'syne', name: 'Syne', stack: "'Syne', sans-serif", sample: 'Ideas worth sharing' },
    { id: 'epilogue', name: 'Epilogue', stack: "'Epilogue', sans-serif", sample: 'Clean and modern feel' },
    { id: 'space-grotesk', name: 'Space Grotesk', stack: "'Space Grotesk', sans-serif", sample: 'Geometric precision' },
    { id: 'unbounded', name: 'Unbounded', stack: "'Unbounded', sans-serif", sample: 'Bold statements' },
  ] },
  { group: 'Serif', fonts: [
    { id: 'fraunces', name: 'Fraunces', stack: "'Fraunces', serif", sample: 'Elegant and literary' },
    { id: 'playfair', name: 'Playfair Display', stack: "'Playfair Display', serif", sample: 'Classic sophistication' },
    { id: 'lora', name: 'Lora', stack: "'Lora', serif", sample: 'Warm and readable' },
    { id: 'libre-bask', name: 'Libre Baskerville', stack: "'Libre Baskerville', serif", sample: 'Traditional clarity' },
  ] },
  { group: 'Monospace', fonts: [
    { id: 'dm-mono', name: 'DM Mono', stack: "'DM Mono', monospace", sample: 'const app = true;' },
    { id: 'ibm-plex-mono', name: 'IBM Plex Mono', stack: "'IBM Plex Mono', monospace", sample: 'function() { }' },
    { id: 'jetbrains-mono', name: 'JetBrains Mono', stack: "'JetBrains Mono', monospace", sample: 'const app = true;' },
  ] },
];

const FONT_SIZE_MAP = {
  '10px': '10px',
  '14px': '14px',
  '18px': '18px',
  '20px': '20px',
  '25px': '25px'
};

const FONT_WEIGHT_MAP = {
  '300': '300',
  '400': '400',
  '600': '600',
  '700': '700'
};

const SPACING_MAP = {
  '5px': '5px',
  '10px': '10px',
  '15px': '15px'
};

const RADIUS_MAP = {
  '0px': { sm: '0px', md: '0px', lg: '0px', xl: '0px' },
  '5px': { sm: '5px', md: '10px', lg: '15px', xl: '20px' },
  '14px': { sm: '8px', md: '15px', lg: '18px', xl: '24px' },
  '25px': { sm: '14px', md: '18px', lg: '20px', xl: '30px' },
};

const DEFAULTS = {
  theme: 'dark',
  accent: '#ff6600',
  fontSize: '14px',
  fontFamily: 'inter',
  fontWeight: '400',
  cornerRadius: '14px',
  cardSpacing: '10px',
};

const ALL_FONT_IDS = CUSTOM_FONTS.flatMap((g) => g.fonts.map((f) => f.id));
const VALID_RADII = Object.keys(RADIUS_MAP);
const VALID_FONT_SIZES = Object.keys(FONT_SIZE_MAP);
const VALID_FONT_WEIGHTS = Object.keys(FONT_WEIGHT_MAP);
const VALID_SPACINGS = Object.keys(SPACING_MAP);

/**
 * CustomizationModule — appearance/theming panel. Persists under the fixed
 * key `appearance_settings_v2`, required verbatim by the spec so existing
 * saved preferences keep working across the refactor.
 */
export class CustomizationModule extends Module {
  constructor() {
    super({ name: 'Customization', storageKey: CUSTOM_STORE_KEY });
    this.settings = { ...DEFAULTS };
    this.systemMq = window.matchMedia('(prefers-color-scheme: dark)');
  }

  async load() {
    const saved = await storage.get(CUSTOM_STORE_KEY, null);
    if (saved && typeof saved === 'object') {
      if (['light', 'dark', 'system'].includes(saved.theme)) this.settings.theme = saved.theme;
      if (/^#[0-9a-fA-F]{6}$/.test(saved.accent)) this.settings.accent = saved.accent;
      if (VALID_FONT_SIZES.includes(saved.fontSize)) this.settings.fontSize = saved.fontSize;
      if (typeof saved.fontFamily === 'string' && ALL_FONT_IDS.includes(saved.fontFamily)) {
        this.settings.fontFamily = saved.fontFamily;
      }
      if (VALID_FONT_WEIGHTS.includes(saved.fontWeight)) this.settings.fontWeight = saved.fontWeight;
      if (typeof saved.cornerRadius === 'string' && VALID_RADII.includes(saved.cornerRadius)) {
        this.settings.cornerRadius = saved.cornerRadius;
      }
      if (VALID_SPACINGS.includes(saved.cardSpacing)) this.settings.cardSpacing = saved.cardSpacing;
    }
  }

  async save() {
    await this.saveRecords(this.settings);
  }

  render() {
    this.applyTheme(this.settings.theme);
    this.applyAccent(this.settings.accent);
    this.applyFontSize(this.settings.fontSize);
    this.applyFontFamily(this.settings.fontFamily);
    this.applyFontWeight(this.settings.fontWeight);
    this.applyCornerRadius(this.settings.cornerRadius);
    this.applyCardSpacing(this.settings.cardSpacing);
    this.syncUI();
  }

  // ---- apply* ----------------------------------------------------------

  applyTheme(t) {
    const dark = t === 'system' ? this.systemMq.matches : t === 'dark';
    document.body.classList.toggle('light', !dark);
  }

  hexToRgb(h) {
    return [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)].join(',');
  }

  applyAccent(hex) {
    const root = document.documentElement;
    root.style.setProperty('--pa-orange', hex);
    root.style.setProperty('--pa-orange-rgb', this.hexToRgb(hex));
    root.style.setProperty('--pa-orange-dim', `rgba(${this.hexToRgb(hex)}, 0.12)`);
    root.style.setProperty('--pa-orange-hover', hex);
  }

  applyFontSize(fs) {
    const root = document.documentElement;
    const size = FONT_SIZE_MAP[fs] || '14px';
    // Update all font size variables
    const sizeMap = {
      '10px': { md: '10px', lg: '12px', xl: '18px', xxl: '32px' },
      '14px': { md: '14px', lg: '16px', xl: '22px', xxl: '42px' },
      '18px': { md: '18px', lg: '20px', xl: '26px', xxl: '48px' },
      '20px': { md: '20px', lg: '22px', xl: '28px', xxl: '52px' },
      '30px': { md: '30px', lg: '34px', xl: '40px', xxl: '60px' },
    };
    const sizes = sizeMap[fs] || sizeMap['14px'];
    root.style.setProperty('--pa-fs-md', sizes.md);
    root.style.setProperty('--pa-fs-lg', sizes.lg);
    root.style.setProperty('--pa-fs-xl', sizes.xl);
    root.style.setProperty('--pa-fs-xxl', sizes.xxl);
    // Also set base font size
    root.style.fontSize = size;
  }

  getFontById(id) {
    for (const g of CUSTOM_FONTS) {
      const f = g.fonts.find((x) => x.id === id);
      if (f) return f;
    }
    return CUSTOM_FONTS[0].fonts[0];
  }

  applyFontFamily(id) {
    const font = this.getFontById(id);
    document.body.style.fontFamily = font.stack;
    const nameEl = $id('customFontTriggerName');
    const previewEl = $id('customFontTriggerPreview');
    if (nameEl) nameEl.textContent = font.name;
    if (previewEl) {
      previewEl.textContent = font.sample;
      previewEl.style.fontFamily = font.stack;
    }
  }

  applyFontWeight(weight) {
    const root = document.documentElement;
    const w = FONT_WEIGHT_MAP[weight] || '400';
    // Update all font weight variables
    root.style.setProperty('--pa-fw-sm', w);
    root.style.setProperty('--pa-fw-md', w);
    root.style.setProperty('--pa-fw-lg', String(parseInt(w) + 100));
    root.style.setProperty('--pa-fw-xl', String(parseInt(w) + 200));
    // Apply to body
    document.body.style.fontWeight = w;
  }

  applyCornerRadius(val) {
    const r = RADIUS_MAP[val] || RADIUS_MAP['14px'];
    const root = document.documentElement;
    root.style.setProperty('--pa-radius', val);
    root.style.setProperty('--pa-radius-sm', r.sm);
    root.style.setProperty('--pa-radius-md', r.md);
    root.style.setProperty('--pa-radius-lg', r.lg);
    root.style.setProperty('--pa-radius-xl', r.xl);
  }

  applyCardSpacing(spacing) {
    const root = document.documentElement;
    const s = SPACING_MAP[spacing] || '10px';
    root.style.setProperty('--pa-gap-10', s);
  }

  // ---- font dropdown -----------------------------------------------------

  buildFontList(query) {
    const list = $id('customFontList');
    const noRes = $id('customFontNoResults');
    if (!list) return;
    list.innerHTML = '';
    const q = (query || '').toLowerCase().trim();
    let total = 0;

    CUSTOM_FONTS.forEach((group) => {
      const filtered = group.fonts.filter(
        (f) => !q || f.name.toLowerCase().includes(q) || f.sample.toLowerCase().includes(q),
      );
      if (!filtered.length) return;

      const groupEl = document.createElement('div');
      groupEl.className = 'custom-font-group-label';
      groupEl.textContent = group.group;
      list.appendChild(groupEl);

      filtered.forEach((font) => {
        total++;
        const btn = document.createElement('button');
        btn.className = 'custom-font-option' + (font.id === this.settings.fontFamily ? ' active' : '');
        btn.setAttribute('role', 'option');
        btn.setAttribute('aria-selected', String(font.id === this.settings.fontFamily));
        btn.setAttribute('data-font-id', font.id);
        btn.innerHTML = `
          <div class="custom-font-option-left">
            <span class="custom-font-option-name">${font.name}</span>
            <span class="custom-font-option-sample" style="font-family:${font.stack}">${font.sample}</span>
          </div>
          <div class="custom-font-option-right">
            <span class="custom-font-option-tag">${font.id}</span>
            <svg class="custom-font-check" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="20 6 9 17 4 12"/></svg>
          </div>`;
        this.on(btn, 'click', () => {
          this.settings.fontFamily = font.id;
          this.applyFontFamily(font.id);
          this.buildFontList($id('customFontSearch')?.value);
          this.closeFontDropdown();
          this.save();
          this.showCustomToast(`Font → ${font.name}`);
        });
        list.appendChild(btn);
      });
    });

    if (noRes) noRes.style.display = total === 0 ? 'block' : 'none';
  }

  openFontDropdown() {
    const wrap = $id('customFontDropdownWrap');
    const trigger = $id('customFontTrigger');
    const search = $id('customFontSearch');
    if (!wrap) return;
    wrap.classList.add('open');
    trigger?.setAttribute('aria-expanded', 'true');
    this.buildFontList('');
    setTimeout(() => search?.focus(), 60);
  }

  closeFontDropdown() {
    $id('customFontDropdownWrap')?.classList.remove('open');
    $id('customFontTrigger')?.setAttribute('aria-expanded', 'false');
  }

  toggleFontDropdown() {
    $id('customFontDropdownWrap')?.classList.contains('open') ? this.closeFontDropdown() : this.openFontDropdown();
  }

  // ---- UI sync ------------------------------------------------------------

  syncUI() {
    document.querySelectorAll('.custom-theme-card').forEach((el) => {
      const active = el.dataset.theme === this.settings.theme;
      el.classList.toggle('active', active);
      el.setAttribute('aria-checked', String(active));
    });
    document.querySelectorAll('.custom-swatch').forEach((el) => {
      const active = el.dataset.color === this.settings.accent;
      el.classList.toggle('active', active);
      el.setAttribute('aria-checked', String(active));
    });
    
    // Sync font size buttons
    document.querySelectorAll('.custom-fs-btn[data-size]').forEach((el) => {
      const active = el.dataset.size === this.settings.fontSize;
      el.classList.toggle('active', active);
      el.setAttribute('aria-checked', String(active));
    });
    
    // Sync font weight buttons
    document.querySelectorAll('.custom-fs-btn[data-weight]').forEach((el) => {
      const active = el.dataset.weight === this.settings.fontWeight;
      el.classList.toggle('active', active);
      el.setAttribute('aria-checked', String(active));
    });
    
    // Sync spacing buttons
    document.querySelectorAll('.custom-fs-btn[data-spacing]').forEach((el) => {
      const active = el.dataset.spacing === this.settings.cardSpacing;
      el.classList.toggle('active', active);
      el.setAttribute('aria-checked', String(active));
    });
    
    document.querySelectorAll('.custom-cr-btn').forEach((el) => {
      const active = el.dataset.radius === this.settings.cornerRadius;
      el.classList.toggle('active', active);
      el.setAttribute('aria-checked', String(active));
    });
    
    const font = this.getFontById(this.settings.fontFamily);
    const nameEl = $id('customFontTriggerName');
    const previewEl = $id('customFontTriggerPreview');
    if (nameEl) nameEl.textContent = font.name;
    if (previewEl) {
      previewEl.textContent = font.sample;
      previewEl.style.fontFamily = font.stack;
    }
  }

  showCustomToast(msg) {
    const wrap = $id('paCustomToastWrap');
    if (!wrap) return;
    const el = document.createElement('div');
    el.className = 'pa-toast info';
    el.innerHTML = `<i class="pa-toast-icon ri-palette-line"></i><span>${msg}</span><button class="pa-toast-close" aria-label="Dismiss"><i class="ri-close-line"></i></button>`;
    const dismiss = () => {
      el.classList.add('removing');
      setTimeout(() => el.remove(), 200);
    };
    el.querySelector('.pa-toast-close').addEventListener('click', dismiss);
    wrap.appendChild(el);
    setTimeout(() => { if (el.parentElement) dismiss(); }, 2500);
  }

  // ---- panel open/close -------------------------------------------------

  togglePanel() {
    const panel = $id('paCustomPanel');
    const toggleBtn = $id('paCustomToggle');
    if (!panel) return;
    if (panel.classList.contains('visible')) {
      this.closePanel();
    } else {
      closePanels();
      panel.classList.add('visible');
      $id('paPanelOverlay')?.classList.add('visible');
      toggleBtn?.classList.add('active');
      document.body.style.overflow = 'hidden';
      this.syncUI();
      activateTab('custom', 'theme');
      setTimeout(() => panel.querySelector('button, input, select')?.focus(), 100);
    }
  }

  closePanel() {
    $id('paCustomPanel')?.classList.remove('visible');
    $id('paPanelOverlay')?.classList.remove('visible');
    $id('paCustomToggle')?.classList.remove('active');
    document.body.style.overflow = '';
    this.closeFontDropdown();
  }

  // ---- event wiring -------------------------------------------------------

  bindEvents() {
    registerPanel('paCustomPanel');

    this.on($id('paCustomToggle'), 'click', () => this.togglePanel());
    this.on($id('paCustomPanelClose'), 'click', () => this.closePanel());
    this.on($id('paCustomCancel'), 'click', () => this.closePanel());
    this.on($id('paPanelOverlay'), 'click', (e) => {
      if (e.target.id === 'paPanelOverlay' && $id('paCustomPanel')?.classList.contains('visible')) {
        this.closePanel();
      }
    });
    this.on(document, 'keydown', (e) => {
      if (e.key === 'Escape' && $id('paCustomPanel')?.classList.contains('visible')) this.closePanel();
    });

    document.querySelectorAll('.custom-theme-card').forEach((btn) => {
      this.on(btn, 'click', () => {
        this.settings.theme = btn.dataset.theme;
        this.applyTheme(this.settings.theme);
        this.syncUI();
        this.save();
        this.showCustomToast(`Theme → ${this.settings.theme}`);
      });
    });

    document.querySelectorAll('.custom-swatch').forEach((btn) => {
      this.on(btn, 'click', () => {
        this.settings.accent = btn.dataset.color;
        this.applyAccent(this.settings.accent);
        this.syncUI();
        this.save();
        this.showCustomToast('Accent color updated');
      });
    });

    // Handle all custom-fs-btn clicks (font size, weight, spacing)
    document.querySelectorAll('.custom-fs-btn').forEach((btn) => {
      // Clone to remove existing listeners
      const parent = btn.parentNode;
      const newBtn = btn.cloneNode(true);
      parent.replaceChild(newBtn, btn);
      
      this.on(newBtn, 'click', () => {
        // Handle font size
        if (newBtn.dataset.size) {
          this.settings.fontSize = newBtn.dataset.size;
          this.applyFontSize(this.settings.fontSize);
          this.syncUI();
          this.save();
          this.showCustomToast(`Font size → ${this.settings.fontSize}`);
        }
        // Handle font weight
        if (newBtn.dataset.weight) {
          this.settings.fontWeight = newBtn.dataset.weight;
          this.applyFontWeight(this.settings.fontWeight);
          this.syncUI();
          this.save();
          this.showCustomToast(`Font weight → ${this.settings.fontWeight}`);
        }
        // Handle spacing
        if (newBtn.dataset.spacing) {
          this.settings.cardSpacing = newBtn.dataset.spacing;
          this.applyCardSpacing(this.settings.cardSpacing);
          this.syncUI();
          this.save();
          this.showCustomToast(`Card spacing → ${this.settings.cardSpacing}`);
        }
      });
    });

    const radiusLabels = { '0px': 'None', '5px': 'Small', '14px': 'Medium', '25px': 'Large' };
    document.querySelectorAll('.custom-cr-btn').forEach((btn) => {
      this.on(btn, 'click', () => {
        this.settings.cornerRadius = btn.dataset.radius;
        this.applyCornerRadius(this.settings.cornerRadius);
        this.syncUI();
        this.save();
        this.showCustomToast(`Corner radius → ${radiusLabels[this.settings.cornerRadius] || this.settings.cornerRadius}`);
      });
      this.on(btn, 'keydown', (e) => {
        const all = [...document.querySelectorAll('.custom-cr-btn')];
        const idx = all.indexOf(btn);
        if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
          e.preventDefault();
          all[(idx + 1) % all.length]?.focus();
        } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
          e.preventDefault();
          all[(idx - 1 + all.length) % all.length]?.focus();
        } else if (e.key === ' ' || e.key === 'Enter') {
          e.preventDefault();
          btn.click();
        }
      });
    });

    this.on($id('customFontTrigger'), 'click', () => this.toggleFontDropdown());
    this.on($id('customFontSearch'), 'input', (e) => this.buildFontList(e.target.value));
    this.on(document, 'click', (e) => {
      const wrap = $id('customFontDropdownWrap');
      if (wrap && !wrap.contains(e.target)) this.closeFontDropdown();
    });
    this.on($id('customFontDropdownWrap'), 'keydown', (e) => {
      if (e.key === 'Escape') {
        this.closeFontDropdown();
        $id('customFontTrigger')?.focus();
      }
    });

    this.on(this.systemMq, 'change', () => {
      if (this.settings.theme === 'system') this.applyTheme('system');
    });

    document.querySelectorAll('.pa-panel-tab[data-panel="custom"]').forEach((btn) => {
      this.on(btn, 'click', () => {
        activateTab('custom', btn.dataset.tab);
        this.syncUI();
      });
    });

    const observer = new MutationObserver(() => {
      if ($id('paCustomPanel')?.classList.contains('visible')) this.syncUI();
    });
    const panel = $id('paCustomPanel');
    if (panel) observer.observe(panel, { attributes: true, attributeFilter: ['class'] });
    this._observer = observer;
  }

  destroy() {
    this._observer?.disconnect();
    super.destroy();
  }
}