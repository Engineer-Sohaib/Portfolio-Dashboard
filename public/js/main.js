// src/js/main.js
/**
 * main.js — the only <script type="module"> the HTML pages load.
 *
 * Responsibilities:
 *  1. Boot {@link ShellModule} on every page (sidebar, customization panel,
 *     confirm dialog, notifications, global keyboard shortcuts).
 *  2. Resolve the current page via {@link getCurrentPage} and boot exactly
 *     one feature module for it.
 *  3. Wire the small set of cross-cutting DOM bits that don't belong to any
 *     single feature module (description char-counters, generic panel-tab
 *     clicks, clicking the shared overlay to close whatever's open).
 *
 * Adding a new page/module: add one entry to `MODULE_BY_PAGE` and one route
 * to `core/router.js`. Nothing else in this file changes.
 */
import { PAGE } from './core/router.js';
import { ShellModule } from './modules/shell/ShellModule.js';
import { DashboardModule } from './modules/dashboard/DashboardModule.js';
import { ProjectsModule } from './modules/projects/ProjectsModule.js';
import { CategoriesModule } from './modules/categories/CategoriesModule.js';
import { TechnologiesModule } from './modules/technologies/TechnologiesModule.js';
import { MediaModule } from './modules/media/MediaModule.js';
import { TestimonialsModule } from './modules/testimonials/TestimonialsModule.js';
import { BlogModule } from './modules/blog/BlogModule.js';
import { ExperienceModule } from './modules/experience/ExperienceModule.js';
import { ContactMessagesModule } from './modules/contact-messages/ContactMessagesModule.js';
import { SettingsModule } from './modules/settings/SettingsModule.js';
// Import auth modules
import { LoginModule } from './modules/auth/LoginModule.js';
import { ForgotPasswordModule } from './modules/auth/ForgotPasswordModule.js';
import { ResetPasswordModule } from './modules/auth/ResetPasswordModule.js';
import { $id, $all } from './utils/dom.js';
import { closePanels } from './modules/shell/panels.js';

const MODULE_BY_PAGE = {
  dashboard: DashboardModule,
  projects: ProjectsModule,
  categories: CategoriesModule,
  technologies: TechnologiesModule,
  media: MediaModule,
  testimonials: TestimonialsModule,
  blogposts: BlogModule,
  experience: ExperienceModule,
  'contact-messages': ContactMessagesModule,
  settings: SettingsModule,
  // Auth modules
  login: LoginModule,
  'forgot-password': ForgotPasswordModule,
  'reset-password': ResetPasswordModule,
};

/** Wires the handful of DOM bits shared by every panel system but owned by no single module. */
function bindGlobalPanelChrome() {
  $all('.pa-panel-tab').forEach((btn) => {
    btn.addEventListener('click', () => {
      // Deferred import avoids a hard dependency cycle with panels.js at module-eval time.
      import('./modules/shell/panels.js').then(({ activateTab }) => activateTab(btn.dataset.panel, btn.dataset.tab));
    });
  });
  $id('paPanelOverlay')?.addEventListener('click', (e) => {
    if (e.target.id === 'paPanelOverlay') closePanels();
  });
}

async function main() {
  // Check if we're on an auth page - we may still want shell features
  const isAuthPage = ['login', 'forgot-password', 'reset-password'].includes(PAGE);
  
  // For auth pages, we don't need the full shell module (sidebar, etc.)
  // But we need toast and confirm dialog support
  if (!isAuthPage) {
    const shell = new ShellModule();
    await shell.init();
  } else {
    // For auth pages, we still want toast and confirm dialog functionality
    // The HTML already includes the toast wrap and confirm overlay
    // We just need to initialize the confirm dialog
    const { initConfirmDialog } = await import('./modules/shell/confirm.js');
    initConfirmDialog();
    
    // Also import toast functions for the page
    // (already available via the inline script)
  }

  const ModuleClass = MODULE_BY_PAGE[PAGE];
  if (!ModuleClass) {
    console.warn(`[main] no module registered for page "${PAGE}"`);
    return;
  }

  const pageModule = new ModuleClass();
  await pageModule.init();
  
  // Only bind global panel chrome for non-auth pages
  if (!isAuthPage) {
    bindGlobalPanelChrome();

    // Register the quick add panel
    import('./modules/shell/panels.js').then(({ registerPanel, openPanel, closePanels }) => {
      registerPanel('paQuickAddPanel');
      
      // Wire up the "Add New" button
      const addNewBtn = document.getElementById('paAddNewBtn');
      if (addNewBtn) {
        addNewBtn.addEventListener('click', () => {
          openPanel('paQuickAddPanel');
          // Activate the first tab
          import('./modules/shell/panels.js').then(({ activateTab }) => {
            activateTab('quickAdd', 'project');
          });
          // Focus the first input
          setTimeout(() => {
            const firstInput = document.querySelector('#paQuickAddPanel input:not([type="file"])');
            if (firstInput) firstInput.focus();
          }, 320);
        });
      }
      
      // Close button
      const closeBtn = document.getElementById('paQuickAddPanelClose');
      if (closeBtn) {
        closeBtn.addEventListener('click', closePanels);
      }
    });
  }
  
  window.__paDebug = { pageModule, page: PAGE };
}

// Next.js migration note: this module is now injected via a dynamically
// created <script type="module"> element from a React effect, which can run
// after 'DOMContentLoaded' has already fired. Falling back to an immediate
// call in that case (instead of only listening for an event that already
// passed) keeps boot behavior identical to the original static-HTML pages.
function boot() {
  main().catch((err) => console.error('[main] fatal error during boot:', err));
}
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot);
} else {
  boot();
}