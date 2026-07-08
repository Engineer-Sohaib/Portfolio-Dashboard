// src/modules/contact-messages/ContactMessagesModule.js
import { Module } from '../../core/Module.js';
import { $id, $all, escapeHtml } from '../../utils/dom.js';
import { csvEscapeField } from '../../utils/format.js';
import { debounce } from '../../utils/timing.js';
import { requestDelete } from '../../modules/shell/confirm.js';
import { closeAllCardMenus } from '../../modules/shell/cardMenu.js';
import { setupAllPasswordToggles, injectPasswordToggleStyles } from '../../utils/password-toggle.js';
import { BulkSelectController } from '../../core/BulkSelectController.js';

const MSG_AVATAR_COLORS = ['#e5484d', '#f0c040', '#22c55e', '#38bdf8', '#a78bfa', '#f472b6', '#ff6600', '#2dd4bf'];
const PAGE_SIZE = 8;

// Column configuration with persistence keys
const COLUMN_CONFIG = {
  checkbox: { label: 'Select', default: true, width: '36px' },
  from: { label: 'From', default: true, width: 'auto' },
  subject: { label: 'Subject', default: true, width: 'auto' },
  status: { label: 'Status', default: true, width: 'auto' },
  date: { label: 'Date', default: true, width: 'auto' },
  actions: { label: 'Actions', default: true, width: 'auto' },
};

const SEED_MESSAGES_CORE = [
  { id: 1, name: 'Ayesha Rahman', email: 'ayesha.rahman@example.com', subject: 'Project Inquiry', snippet: "I'm interested in working with you on a web…", message: "Hi there,\n\nI'm interested in working with you on a website project for my small business. Could you tell me more about your process?\n\nBest,\nAyesha Rahman", status: 'new', createdAt: new Date(2024, 4, 19, 10, 24).toISOString(), ip: '39.42.155.201', reply: null, repliedAt: null, starred: false },
  { id: 2, name: 'Usman Shah', email: 'usman.shah@example.com', subject: 'Partnership Opportunity', snippet: 'We have a great opportunity for collaborati…', message: "Hello,\n\nWe're a design studio looking for a reliable frontend/WordPress developer to partner with. Would you be open to a quick call?\n\nRegards,\nUsman Shah", status: 'new', createdAt: new Date(2024, 4, 19, 9, 15).toISOString(), ip: '103.255.4.88', reply: null, repliedAt: null, starred: false },
  { id: 3, name: 'Rida Khan', email: 'rida.khan@example.com', subject: 'Website Development', snippet: 'Can you help me build a responsive website…', message: "Hello,\n\nI'm looking to build a responsive website for my business with Home, About, Services, Portfolio, and Contact pages. Availability and pricing?\n\nThanks,\nRida Khan", status: 'replied', createdAt: new Date(2024, 4, 18, 16, 35).toISOString(), ip: '182.176.5.43', reply: "Hello Rida,\n\nThank you for reaching out! I'll get back to you with details and pricing shortly.\n\nBest,\nAdmin User", repliedAt: new Date(2024, 4, 18, 17, 20).toISOString(), starred: false },
  { id: 4, name: 'Muhammad Hamza', email: 'hamza.dev@example.com', subject: 'Custom Development', snippet: 'I need a custom dashboard built for my busi…', message: 'Hi,\n\nI need a custom dashboard with charts, tables, and user management. Would appreciate a quote.\n\nThanks,\nMuhammad Hamza', status: 'replied', createdAt: new Date(2024, 4, 18, 14, 10).toISOString(), ip: '111.68.102.14', reply: "Hi Muhammad,\n\nI'll put together a scope and quote within the next day or two.\n\nBest,\nAdmin User", repliedAt: new Date(2024, 4, 18, 16, 0).toISOString(), starred: false },
  { id: 5, name: 'Sarah Ahmed', email: 'sarah.ahmed@example.com', subject: 'General Question', snippet: 'I had a question about your services and pri…', message: 'Hi,\n\nDo you offer monthly maintenance packages for existing WordPress sites, or is it strictly project-based?\n\nThanks,\nSarah Ahmed', status: 'read', createdAt: new Date(2024, 4, 17, 11, 50).toISOString(), ip: '182.180.44.9', reply: null, repliedAt: null, starred: false },
  { id: 6, name: 'Fahad Ali', email: 'fahad.ali@example.com', subject: 'Job Opportunity', snippet: 'Are you currently hiring for any developer p…', message: 'Hello,\n\nAre you hiring for any developer positions? 3 years experience with React and Node.js.\n\nThanks,\nFahad Ali', status: 'read', createdAt: new Date(2024, 4, 16, 18, 40).toISOString(), ip: '39.57.128.3', reply: null, repliedAt: null, starred: false },
  { id: 7, name: 'Noor Bukhari', email: 'noor.bukhari@example.com', subject: 'Support Needed', snippet: "I'm facing an issue with the template instal…", message: "I'm facing an issue with the template installation, please click this link to verify your account immediately: bit.ly/verify-now-2024. Act fast!", status: 'spam', createdAt: new Date(2024, 4, 16, 15, 22).toISOString(), ip: '45.128.96.201', reply: null, repliedAt: null, starred: false },
  { id: 8, name: 'Zeeshan Ejaz', email: 'zeeshan.ejaz@example.com', subject: 'SEO Services', snippet: 'Do you offer SEO optimization services for…', message: "Hi,\n\nDo you offer SEO optimization for existing sites, or only as part of a full build?\n\nThanks,\nZeeshan Ejaz", status: 'read', createdAt: new Date(2024, 4, 15, 13, 5).toISOString(), ip: '202.59.11.77', reply: null, repliedAt: null, starred: false },
];

const MSG_NAME_POOL = ['Ahmed Raza', 'Bilal Chaudhry', 'Hassan Iqbal', 'Imran Malik', 'Kamran Baig', 'Nadia Farooq', 'Sana Qureshi', 'Hina Siddiqui', 'Farah Abbasi', 'Adeel Sheikh', 'Waqas Awan', 'Tariq Butt', 'Rabia Gill', 'Sadia Mirza', 'Umar Rashid', 'Kashif Anwar', 'Naveed Javed', 'Saima Aslam', 'Rehan Riaz', 'Junaid Sattar', 'Asad Yousaf', 'Bushra Nawaz', 'Mahnoor Tariq', 'Zara Hussain', 'Faisal Karim', 'Shahid Latif', 'Yasir Nadeem', 'Mariam Zafar', 'Amna Shakeel', 'Talha Saeed', 'Ali Haider', 'Mehwish Aziz', 'Kiran Younas', 'Danish Ilyas', 'Aisha Noor', 'Owais Farhan', 'Sobia Khalid', 'Adnan Waheed', 'Nimra Bashir', 'Fahad Qadir'];
const MSG_SUBJECT_POOL = ['Website Redesign Inquiry', 'Portfolio Collaboration', 'E-commerce Store Development', 'Logo & Branding Request', 'Mobile App Development', 'SEO Optimization Services', 'WordPress Plugin Bug', 'Landing Page Design', 'API Integration Help', 'Freelance Availability', 'Pricing Information', 'Maintenance Contract', 'Speaking Engagement', 'Guest Post Request', 'Bug Report on Live Site', 'Feature Request', 'Collaboration Proposal', 'Internship Opportunity', 'Technical Consultation', 'Website Speed Optimization', 'Domain & Hosting Question', 'Contract Renewal', 'Invoice Question', 'New Project Kickoff', 'Design Feedback'];
const MSG_TEMPLATES = [
  (n, s) => `Hi,\n\nI'm reaching out regarding "${s}". I'd like to know more about how you approach projects like this and what your typical turnaround time looks like.\n\nLooking forward to your reply.\n\nThanks,\n${n}`,
  (n, s) => `Hello,\n\nWe're currently exploring options for "${s}" and your portfolio came highly recommended. Could we schedule a short call to discuss requirements and budget?\n\nBest regards,\n${n}`,
  (n, s) => `Hi there,\n\nQuick question about "${s}" — do you have availability in the next few weeks to take on new work? Happy to share more details if so.\n\nThanks so much,\n${n}`,
  (n, s) => `Hello,\n\nI wanted to follow up about "${s}". Please let me know the next steps and any information you need from my side to move forward.\n\nRegards,\n${n}`,
  (n, s) => `Hi,\n\nOur team is interested in "${s}" and would appreciate a rough estimate on cost and timeline. Let me know if a call works better than email.\n\nThank you,\n${n}`,
];
const MSG_REPLY_TEMPLATES = [
  (n) => `Hi ${n.split(' ')[0]},\n\nThanks for reaching out! I'd be happy to help with this. I'll review the details and get back to you shortly with next steps.\n\nBest,\nAdmin User`,
  (n) => `Hello ${n.split(' ')[0]},\n\nAppreciate you sharing this. I have some availability coming up and would love to discuss further — I'll follow up with a few times that work.\n\nRegards,\nAdmin User`,
  (n) => `Hi ${n.split(' ')[0]},\n\nThanks for the message! I've put together some initial thoughts and will send over a proposal soon.\n\nBest regards,\nAdmin User`,
];

/** Small deterministic PRNG so generated seed data (and therefore stats/pagination) look the same on every fresh load. */
function msgSeededRandom(seed) {
  let s = seed;
  return function next() { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
}

function buildGeneratedMessages(startId, count, startDate) {
  const rand = msgSeededRandom(20240515);
  const target = { new: 10, replied: 96, spam: 4, read: 10 };
  const statusPool = [];
  Object.keys(target).forEach((s) => { for (let i = 0; i < target[s]; i++) statusPool.push(s); });
  for (let i = statusPool.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [statusPool[i], statusPool[j]] = [statusPool[j], statusPool[i]];
  }
  const domains = ['gmail.com', 'outlook.com', 'yahoo.com', 'hotmail.com', 'example.com'];
  const list = [];
  let cursor = new Date(startDate);
  for (let i = 0; i < count; i++) {
    const name = MSG_NAME_POOL[i % MSG_NAME_POOL.length];
    const subject = MSG_SUBJECT_POOL[(i * 3 + 1) % MSG_SUBJECT_POOL.length];
    const status = statusPool[i] || 'read';
    const handle = name.toLowerCase().replace(/[^a-z\s]/g, '').trim().replace(/\s+/g, '.');
    const email = `${handle}@${domains[i % domains.length]}`;
    const message = MSG_TEMPLATES[i % MSG_TEMPLATES.length](name, subject);
    const snippet = `${message.replace(/\n/g, ' ').split(' ').slice(0, 9).join(' ')}…`;
    cursor = new Date(cursor.getTime() - (6 + Math.floor(rand() * 14)) * 60 * 60 * 1000);
    const ip = `${30 + Math.floor(rand() * 190)}.${Math.floor(rand() * 255)}.${Math.floor(rand() * 255)}.${1 + Math.floor(rand() * 254)}`;
    const msg = { id: startId + i, name, email, subject, snippet, message, status, createdAt: cursor.toISOString(), ip, reply: null, repliedAt: null, starred: false };
    if (status === 'replied') {
      msg.reply = MSG_REPLY_TEMPLATES[i % MSG_REPLY_TEMPLATES.length](name);
      msg.repliedAt = new Date(cursor.getTime() + (2 + Math.floor(rand() * 10)) * 60 * 60 * 1000).toISOString();
    }
    list.push(msg);
  }
  return list;
}

function buildSeedMessages() {
  return [...SEED_MESSAGES_CORE, ...buildGeneratedMessages(5, 21, new Date(2025, 4, 14, 20, 0))];
}

function msgInitials(name) { return (name || '?').split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase(); }
function msgAvatarColor(name) {
  let hash = 0;
  const str = name || '';
  for (let i = 0; i < str.length; i++) hash = (hash * 31 + str.charCodeAt(i)) >>> 0;
  return MSG_AVATAR_COLORS[hash % MSG_AVATAR_COLORS.length];
}
function statusLabel(status) {
  return { new: 'New', read: 'Read', replied: 'Replied', spam: 'Spam' }[status] || status;
}
function formatMsgDateTime(iso) {
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return { date: 'Unknown', time: '' };
    return {
      date: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      time: d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }),
    };
  } catch { return { date: 'Unknown', time: '' }; }
}

const COLUMN_STORAGE_KEY = 'pa_msg_column_visibility';

export class ContactMessagesModule extends Module {
  constructor() {
    super({
      name: 'ContactMessages',
      storageKey: 'pa_contact_messages',
      initialState: {
        messages: [], selectedId: null, statusFilter: 'all', timeFilter: 'all', searchQuery: '', page: 1, composingReply: false,
      },
    });
    this.msgNow = Date.now();
    this.columnVisibility = this.loadColumnVisibility();
    this.bulkSelect = new BulkSelectController(this, {
      containerId: 'paMsgTableBody',
      itemSelector: '.pa-msg-row',
      idAttr: 'data-msg-id',
      label: 'message',
      getVisibleIds: () => this.getFiltered().map((m) => m.id),
      onBulkDelete: (ids) => this.bulkDelete(ids),
    });
  }

  bulkDelete(ids) {
    const n = ids.size;
    if (n === 0) return;
    this.store.set('messages', this.store.get('messages').filter((m) => !ids.has(String(m.id))));
    if (ids.has(String(this.store.get('selectedId')))) this.store.set('selectedId', null);
    this.persist();
    this.renderTable();
    this.renderDetail();
    this.toast(`${n} message${n > 1 ? 's' : ''} deleted.`, 'danger');
    this.notify(`${n} message${n > 1 ? 's' : ''} deleted in bulk.`, 'ri-delete-bin-line');
  }

  loadColumnVisibility() {
    try {
      const saved = localStorage.getItem(COLUMN_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        // Merge with defaults
        const result = { ...COLUMN_CONFIG };
        Object.keys(result).forEach(key => {
          if (parsed[key] !== undefined) {
            result[key].default = parsed[key];
          }
        });
        return result;
      }
    } catch (e) {
      console.warn('[ContactMessages] Failed to load column visibility:', e);
    }
    return { ...COLUMN_CONFIG };
  }

  saveColumnVisibility() {
    try {
      const data = {};
      Object.keys(this.columnVisibility).forEach(key => {
        data[key] = this.columnVisibility[key].default;
      });
      localStorage.setItem(COLUMN_STORAGE_KEY, JSON.stringify(data));
    } catch (e) {
      console.warn('[ContactMessages] Failed to save column visibility:', e);
    }
  }

  async load() {
    const messages = await this.loadRecords(() => buildSeedMessages());
    this.store.set('messages', messages);
    this.computeNow();
  }

  async persist() { await this.saveRecords(this.store.get('messages')); }

  computeNow() {
    const messages = this.store.get('messages');
    if (!messages.length) { this.msgNow = Date.now(); return; }
    const latest = Math.max(...messages.map((m) => new Date(m.createdAt).getTime()));
    this.msgNow = latest + 60 * 60 * 1000;
  }

  findById(id) { return this.store.get('messages').find((m) => m.id === id); }

  getFiltered() {
    const { messages, statusFilter, timeFilter, searchQuery } = this.store._raw;
    let result = messages.slice().sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    if (statusFilter !== 'all') {
      result = statusFilter === 'unread' ? result.filter((m) => m.status === 'new') : result.filter((m) => m.status === statusFilter);
    }
    if (timeFilter !== 'all') {
      const spans = { today: 864e5, week: 864e5 * 7, month: 864e5 * 30 };
      const span = spans[timeFilter];
      if (span) result = result.filter((m) => this.msgNow - new Date(m.createdAt).getTime() <= span);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      result = result.filter((m) => m.name.toLowerCase().includes(q) || m.email.toLowerCase().includes(q) || m.subject.toLowerCase().includes(q));
    }
    return result;
  }

  // ---- rendering ------------------------------------------------------------

  render() {
    this.renderTable();
  }

  renderStats() {
    const messages = this.store.get('messages');
    const set = (id, val) => { const el = $id(id); if (el) el.textContent = val; };
    set('paMsgStatAll', messages.length);
    set('paMsgStatNew', messages.filter((m) => m.status === 'new').length);
    set('paMsgStatReplied', messages.filter((m) => m.status === 'replied').length);
    set('paMsgStatSpam', messages.filter((m) => m.status === 'spam').length);
  }

  renderMailPreview() {
    const list = $id('paMailPreviewList');
    const badge = $id('paMailPreviewBadge');
    if (!list) return;
    const allUnread = this.store.get('messages').filter((m) => m.status === 'new').sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    const unread = allUnread.slice(0, 5);
    if (badge) { badge.textContent = allUnread.length; badge.classList.toggle('hidden', allUnread.length === 0); }
    if (unread.length === 0) { list.innerHTML = `<div class="pa-notif-empty">No new messages</div>`; return; }
    list.innerHTML = unread.map((m) => `<div class="pa-notif-item" data-msg-id="${m.id}"><div class="pa-notif-item-icon"><i class="ri-mail-line"></i></div><div><div class="pa-notif-item-text"><strong>${escapeHtml(m.name)}</strong> — ${escapeHtml(m.subject)}</div><div class="pa-notif-item-time">${formatMsgDateTime(m.createdAt).date}</div></div></div>`).join('');
    list.querySelectorAll('.pa-notif-item').forEach((item) => {
      item.addEventListener('click', () => {
        this.selectMessage(parseInt(item.dataset.msgId, 10));
        $id('paMailPreviewWrap')?.classList.remove('open');
        $id('paMsgListCard')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    });
  }

  renderRow(m) {
    const initials = msgInitials(m.name);
    const color = msgAvatarColor(m.name);
    const { date, time } = formatMsgDateTime(m.createdAt);
    const isSelected = m.id === this.store.get('selectedId');
    const isUnread = m.status === 'new';
    const bulkMode = this.bulkSelect.isSelectMode();
    const bulkSelected = this.bulkSelect.isSelected(m.id);

    const visibility = this.columnVisibility;
    
    let cells = '';
    
    // Checkbox column — normal mode selects a message for preview; select
    // mode swaps it for a real multi-select checkbox feeding the bulk bar.
    if (visibility.checkbox.default) {
      if (bulkMode) {
        cells += `<td style="width:36px;"><input type="checkbox" class="pa-msg-bulk-checkbox" data-select-id="${m.id}" ${bulkSelected ? 'checked' : ''} aria-label="Select message from ${escapeHtml(m.name)} for bulk actions" /></td>`;
      } else {
        cells += `<td style="width:36px;"><input type="checkbox" class="pa-msg-checkbox" data-msg-id="${m.id}" ${isSelected ? 'checked' : ''} aria-label="Select message from ${escapeHtml(m.name)}" /></td>`;
      }
    }
    
    // From column
    if (visibility.from.default) {
      cells += `<td><div class="pa-msg-from"><div class="pa-msg-avatar" style="background:${color};">${escapeHtml(initials)}</div><div style="min-width:0;"><div class="pa-msg-name" style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${escapeHtml(m.name)}</div><div class="pa-msg-email" style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${escapeHtml(m.email)}</div></div></div></td>`;
    }
    
    // Subject column
    if (visibility.subject.default) {
      cells += `<td class="pa-msg-subject-col"><div class="pa-msg-subject">${escapeHtml(m.subject)}</div><div class="pa-msg-snippet">${escapeHtml(m.snippet)}</div></td>`;
    }
    
    // Status column
    if (visibility.status.default) {
      cells += `<td><span class="pa-status-badge ${m.status}">${statusLabel(m.status)}</span></td>`;
    }
    
    // Date column
    if (visibility.date.default) {
      cells += `<td><div class="pa-msg-date">${date}</div><div class="pa-msg-time">${time}</div></td>`;
    }
    
    // Actions column
    if (visibility.actions.default) {
      cells += `<td><div class="pa-msg-actions pa-card-actions"><button class="pa-action-btn pa-action-more" data-action="menu" data-msg-id="${m.id}" title="More options" aria-label="More options"><i class="ri-more-2-fill"></i></button><div class="pa-card-menu" data-msg-id="${m.id}"><div class="pa-card-menu-item" data-action="${m.status === 'new' ? 'mark-read' : 'mark-unread'}" data-msg-id="${m.id}"><i class="ri-mail-open-line"></i> ${m.status === 'new' ? 'Mark as Read' : 'Mark as Unread'}</div><div class="pa-card-menu-item" data-action="toggle-spam" data-msg-id="${m.id}"><i class="ri-spam-2-line"></i> ${m.status === 'spam' ? 'Not Spam' : 'Mark as Spam'}</div><div class="pa-card-menu-item danger" data-action="delete" data-msg-id="${m.id}"><i class="ri-delete-bin-line"></i> Delete</div></div></div></td>`;
    }

    return `<tr class="pa-msg-row ${isSelected ? 'selected' : ''} ${isUnread ? 'unread' : ''}${bulkSelected ? ' pa-selected' : ''}" data-msg-id="${m.id}">${cells}</tr>`;
  }

  renderTable() {
    const all = this.getFiltered();
    const totalItems = all.length;
    const totalPages = Math.max(1, Math.ceil(totalItems / PAGE_SIZE));
    let page = this.store.get('page');
    if (page > totalPages) page = totalPages;
    if (page < 1) page = 1;
    this.store.set('page', page);

    const start = (page - 1) * PAGE_SIZE;
    const pageItems = all.slice(start, start + PAGE_SIZE);
    const tbody = $id('paMsgTableBody');
    if (tbody) {
      if (pageItems.length === 0) {
        const hasFilters = this.store.get('searchQuery').trim() || this.store.get('statusFilter') !== 'all' || this.store.get('timeFilter') !== 'all';
        const colCount = Object.values(this.columnVisibility).filter(c => c.default).length;
        tbody.innerHTML = `<tr class="pa-msg-table-empty"><td colspan="${colCount || 6}"><div class="pa-empty-state"><i class="ri-mail-line"></i><div class="pa-empty-state-title">${hasFilters ? 'No messages match your filters' : 'No messages yet'}</div><div class="pa-empty-state-text">${hasFilters ? 'Try adjusting your search, status, or date filters.' : 'Messages submitted through your contact form will appear here.'}</div>${hasFilters ? `<button class="pa-empty-state-btn" id="paMsgEmptyResetBtn">Reset filters</button>` : ''}</div></td></tr>`;
        this.on($id('paMsgEmptyResetBtn'), 'click', () => this.resetFilters());
      } else {
        tbody.innerHTML = pageItems.map((m) => this.renderRow(m)).join('');
      }
    }
    this.renderPagination(totalItems, totalPages, page);
    this.attachRowListeners();
    this.bulkSelect.onRender();
    this.renderStats();
    this.renderMailPreview();
    this.updateColumnVisibilityUI();
  }

  renderPagination(totalItems, totalPages, page) {
    const btnsWrap = $id('paMsgPaginationBtns');
    const info = $id('paMsgPaginationInfo');
    if (!btnsWrap || !info) return;
    if (totalItems === 0) { btnsWrap.innerHTML = ''; info.textContent = 'Showing 0 messages'; return; }
    if (totalPages <= 1) { btnsWrap.innerHTML = ''; info.textContent = `Showing ${totalItems} of ${totalItems} messages`; return; }

    let html = `<div class="pa-page-nav ${page === 1 ? 'disabled' : ''}" id="paMsgPagePrev" role="button" aria-label="Previous page"><i class="ri-arrow-left-s-line"></i></div>`;
    let lastShown = 0;
    for (let p = 1; p <= totalPages; p++) {
      const show = p === 1 || p === totalPages || Math.abs(p - page) <= 1;
      if (!show) continue;
      if (p - lastShown > 1) html += `<span style="color:var(--pa-text-faint);padding:0 4px;font-size:12px;">…</span>`;
      html += `<button class="pa-page-btn ${p === page ? 'active' : ''}" data-page="${p}">${p}</button>`;
      lastShown = p;
    }
    html += `<div class="pa-page-nav ${page === totalPages ? 'disabled' : ''}" id="paMsgPageNext" role="button" aria-label="Next page"><i class="ri-arrow-right-s-line"></i></div>`;
    btnsWrap.innerHTML = html;

    const startN = (page - 1) * PAGE_SIZE + 1;
    const endN = Math.min(page * PAGE_SIZE, totalItems);
    info.textContent = `Showing ${startN} to ${endN} of ${totalItems} messages`;

    btnsWrap.querySelectorAll('.pa-page-btn').forEach((btn) => {
      btn.addEventListener('click', () => { this.store.set('page', parseInt(btn.dataset.page, 10)); this.renderTable(); $id('paMsgListCard')?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }); });
    });
    const prev = $id('paMsgPagePrev');
    const next = $id('paMsgPageNext');
    if (prev && !prev.classList.contains('disabled')) prev.addEventListener('click', () => { this.store.set('page', page - 1); this.renderTable(); });
    if (next && !next.classList.contains('disabled')) next.addEventListener('click', () => { this.store.set('page', page + 1); this.renderTable(); });
  }

  attachRowListeners() {
    const tbody = $id('paMsgTableBody');
    if (!tbody) return;
    tbody.querySelectorAll('.pa-msg-row').forEach((row) => {
      row.addEventListener('click', (e) => {
        if (this.bulkSelect.isSelectMode()) return; // BulkSelectController owns row clicks in select mode
        if (e.target.closest('.pa-msg-actions') || e.target.classList.contains('pa-msg-checkbox')) return;
        this.selectMessage(parseInt(row.dataset.msgId, 10));
      });
    });
    tbody.querySelectorAll('.pa-msg-checkbox').forEach((cb) => {
      cb.addEventListener('click', (e) => { e.stopPropagation(); this.selectMessage(parseInt(cb.dataset.msgId, 10)); });
    });
    tbody.querySelectorAll('[data-action="menu"]').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = btn.dataset.msgId;
        const menu = tbody.querySelector(`.pa-card-menu[data-msg-id="${CSS.escape(id)}"]`);
        document.querySelectorAll('.pa-card-menu.open').forEach((m) => { if (m !== menu) m.classList.remove('open'); });
        menu?.classList.toggle('open');
      });
    });
    tbody.querySelectorAll('.pa-card-menu-item').forEach((item) => {
      item.addEventListener('click', (e) => {
        e.stopPropagation();
        const action = item.dataset.action;
        const id = parseInt(item.dataset.msgId, 10);
        closeAllCardMenus();
        const m = this.findById(id);
        if (!m) return;
        if (action === 'mark-read') { m.status = 'read'; this.persist(); this.renderTable(); if (this.store.get('selectedId') === id) this.renderDetail(); this.toast(`Marked "${m.name}"'s message as read.`, 'info', 2000); }
        else if (action === 'mark-unread') { m.status = 'new'; this.persist(); this.renderTable(); if (this.store.get('selectedId') === id) this.renderDetail(); this.toast(`Marked "${m.name}"'s message as unread.`, 'info', 2000); }
        else if (action === 'toggle-spam') {
          m.status = m.status === 'spam' ? 'read' : 'spam';
          this.persist(); this.renderTable();
          if (this.store.get('selectedId') === id) this.renderDetail();
          this.toast(m.status === 'spam' ? `Marked "${m.name}"'s message as spam.` : `Removed "${m.name}"'s message from spam.`, m.status === 'spam' ? 'danger' : 'success', 2200);
        } else if (action === 'delete') {
          requestDelete(id, 'message', m.name, 'Delete this message?');
        }
      });
    });
  }

  resetFilters() {
    this.store.batch(() => {
      this.store.set('searchQuery', '');
      this.store.set('statusFilter', 'all');
      this.store.set('timeFilter', 'all');
      this.store.set('page', 1);
    });
    const searchInput = $id('paSearchInput');
    if (searchInput) { searchInput.value = ''; $id('paSearchWrap')?.classList.remove('has-value'); }
    const toolbarSearch = $id('paMsgSearchInput');
    if (toolbarSearch) toolbarSearch.value = '';
    const statusSelect = $id('paMsgStatusFilter');
    if (statusSelect) statusSelect.value = 'all';
    const timeSelect = $id('paMsgTimeFilter');
    if (timeSelect) timeSelect.value = 'all';
    $all('.pa-status-tab').forEach((t) => t.classList.toggle('active', t.dataset.status === 'all'));
    this.renderTable();
  }

  selectMessage(id) {
    const m = this.findById(id);
    if (!m) return;
    this.store.set('selectedId', id);
    this.store.set('composingReply', false);
    if (m.status === 'new') { m.status = 'read'; this.persist(); }
    this.renderTable();
    this.renderDetail();
  }

  sendReply(id) {
    const textarea = $id('paMsgReplyText');
    const text = textarea ? textarea.value.trim() : '';
    if (!text) { this.toast('Please write a reply before sending.', 'danger'); textarea?.focus(); return; }
    const m = this.findById(id);
    if (!m) return;
    m.reply = text;
    m.repliedAt = new Date().toISOString();
    m.status = 'replied';
    this.persist();
    this.store.set('composingReply', false);
    this.renderTable();
    this.renderDetail();
    this.toast(`Reply sent to ${m.name}.`, 'success');
    this.notify(`You replied to ${m.name}'s message.`, 'ri-reply-line');
  }

  renderDetail() {
    const body = $id('paMsgDetailBody');
    const footer = $id('paMsgDetailFooter');
    if (!body) return;
    const m = this.findById(this.store.get('selectedId'));

    if (!m) {
      body.innerHTML = `<div class="pa-msg-detail-empty"><i class="ri-mail-open-line"></i><div class="pa-msg-detail-empty-title">No message selected</div><div class="pa-msg-detail-empty-text">Select a message from the list to view its full content here.</div></div>`;
      if (footer) footer.innerHTML = '';
      const starBtn = $id('paMsgDetailStar');
      if (starBtn) starBtn.innerHTML = '<i class="ri-star-line"></i>';
      return;
    }

    const initials = msgInitials(m.name);
    const color = msgAvatarColor(m.name);
    const received = formatMsgDateTime(m.createdAt);
    const composing = this.store.get('composingReply');

    let html = `
      <div class="pa-msg-detail-sender">
        <div class="pa-msg-detail-avatar" style="background:${color};">${escapeHtml(initials)}</div>
        <div style="min-width:0;">
          <div class="pa-msg-detail-sender-name">${escapeHtml(m.name)}</div>
          <div class="pa-msg-detail-sender-email">${escapeHtml(m.email)} <i class="ri-file-copy-line pa-msg-detail-copy" id="paMsgCopyEmail" title="Copy email"></i></div>
        </div>
        <div class="pa-msg-detail-sender-status"><span class="pa-status-badge ${m.status}">${statusLabel(m.status)}</span></div>
      </div>
      <div class="pa-msg-detail-meta">
        <span><i class="ri-calendar-line"></i> ${received.date} at ${received.time}</span>
        <span><i class="ri-map-pin-line"></i> IP: ${escapeHtml(m.ip)}</span>
      </div>
      <div class="pa-msg-detail-label">Subject</div>
      <div class="pa-msg-detail-subject">${escapeHtml(m.subject)}</div>
      <div class="pa-msg-detail-label">Message</div>
      <div class="pa-msg-detail-box">${escapeHtml(m.message)}</div>
    `;

    if (m.reply && !composing) {
      const repliedAt = formatMsgDateTime(m.repliedAt);
      html += `
        <div class="pa-msg-detail-reply-section">
          <div class="pa-msg-detail-label">Your Reply</div>
          <div class="pa-msg-detail-box">${escapeHtml(m.reply)}</div>
          <div class="pa-msg-detail-reply-meta">Replied on ${repliedAt.date} at ${repliedAt.time}</div>
        </div>`;
    }
    body.innerHTML = html;

    if (footer) {
      if (composing) {
        footer.innerHTML = `
          <div class="pa-msg-reply-compose">
            <div class="pa-password-wrap">
              <textarea class="pa-form-textarea" id="paMsgReplyText" placeholder="Type your reply…"></textarea>
            </div>
            <div style="display:flex;gap:8px;margin-top:10px;">
              <button class="pa-btn pa-btn-cancel" id="paMsgReplyCancel">Cancel</button>
              <button class="pa-btn pa-btn-primary" id="paMsgReplySend" style="flex:1;"><i class="ri-send-plane-2-line"></i> Send Reply</button>
            </div>
          </div>`;
        $id('paMsgReplyCancel')?.addEventListener('click', () => { this.store.set('composingReply', false); this.renderDetail(); });
        $id('paMsgReplySend')?.addEventListener('click', () => this.sendReply(m.id));
        $id('paMsgReplyText')?.focus();
      } else {
        footer.innerHTML = `<button class="pa-btn pa-btn-primary pa-msg-reply-again-btn" id="paMsgReplyBtn"><i class="ri-reply-line"></i> ${m.reply ? 'Reply Again' : 'Reply to Message'}</button>`;
        $id('paMsgReplyBtn')?.addEventListener('click', () => { this.store.set('composingReply', true); this.renderDetail(); });
      }
    }

    $id('paMsgCopyEmail')?.addEventListener('click', () => {
      navigator.clipboard?.writeText(m.email).then(() => this.toast('Email copied to clipboard.', 'success', 1800), () => this.toast('Clipboard not available.', 'danger'));
    });

    const starBtn = $id('paMsgDetailStar');
    if (starBtn) {
      starBtn.innerHTML = m.starred ? '<i class="ri-star-fill"></i>' : '<i class="ri-star-line"></i>';
      starBtn.classList.toggle('starred', !!m.starred);
    }
  }

  deleteById(id) {
    const m = this.findById(id);
    if (!m) return;
    this.store.set('messages', this.store.get('messages').filter((x) => x.id !== id));
    if (this.store.get('selectedId') === id) this.store.set('selectedId', null);
    this.persist();
    this.renderTable();
    this.renderDetail();
    this.toast(`Message from "${m.name}" deleted.`, 'danger');
    this.notify(`Deleted message from "${m.name}".`, 'ri-delete-bin-line');
  }

  exportCsv() {
    const rows = this.getFiltered();
    const header = ['Name', 'Email', 'Subject', 'Status', 'Date', 'Message'];
    const csvRows = [header.map(csvEscapeField).join(',')];
    rows.forEach((m) => {
      const { date, time } = formatMsgDateTime(m.createdAt);
      csvRows.push([m.name, m.email, m.subject, statusLabel(m.status), `${date} ${time}`, m.message].map(csvEscapeField).join(','));
    });
    const blob = new Blob([csvRows.join('\r\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `contact-messages-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    this.toast(`Exported ${rows.length} message${rows.length === 1 ? '' : 's'} to CSV.`, 'success');
    this.notify(`Exported ${rows.length} contact messages.`, 'ri-download-2-line');
  }

  // ---- Column Visibility Management ----

  openColumnVisibilityPanel() {
    // Close any existing dropdown
    const existing = $id('paColumnVisibilityDropdown');
    if (existing) {
      existing.remove();
      return;
    }

    const btn = $id('paMsgColumnsBtn');
    if (!btn) return;

    // Create dropdown panel
    const dropdown = document.createElement('div');
    dropdown.id = 'paColumnVisibilityDropdown';
    dropdown.className = 'pa-column-visibility-dropdown';
    dropdown.style.cssText = `
      position: absolute;
      top: calc(100% + 8px);
      right: 0;
      background: var(--pa-bg-card);
      border: 1px solid var(--pa-border);
      border-radius: var(--pa-radius);
      box-shadow: 0 12px 40px rgba(0,0,0,0.4);
      padding: 16px 18px;
      min-width: 220px;
      z-index: 50;
      animation: paFadeIn 0.2s ease;
    `;

    dropdown.innerHTML = `
      <div style="font-weight:var(--pa-fw-lg);font-size:var(--pa-fs-xmd);color:var(--pa-text);margin-bottom:12px;display:flex;align-items:center;gap:8px;">
        <i class="ri-layout-column-line" style="color:var(--pa-orange);"></i> Show/Hide Columns
      </div>
      <div style="display:flex;flex-direction:column;gap:6px;">
        ${Object.keys(this.columnVisibility).map(key => `
          <label style="display:flex;align-items:center;gap:8px;font-size:var(--pa-fs-xmd);color:var(--pa-text-dim);cursor:pointer;padding:4px 6px;border-radius:var(--pa-radius-sm);transition:background 0.15s;">
            <input type="checkbox" ${this.columnVisibility[key].default ? 'checked' : ''} data-column="${key}" style="accent-color:var(--pa-orange);width:16px;height:16px;cursor:pointer;" />
            <span>${COLUMN_CONFIG[key].label}</span>
          </label>
        `).join('')}
      </div>
      <div style="margin-top:12px;padding-top:10px;border-top:1px solid var(--pa-border-soft);display:flex;gap:8px;">
        <button class="pa-btn-sm" id="paColumnResetBtn" style="flex:1;">Reset</button>
        <button class="pa-btn-sm primary" id="paColumnApplyBtn" style="flex:1;">Apply</button>
      </div>
    `;

    // Position the dropdown relative to the button
    const rect = btn.getBoundingClientRect();
    dropdown.style.position = 'fixed';
    dropdown.style.top = `${rect.bottom + 4}px`;
    dropdown.style.right = `${window.innerWidth - rect.right}px`;

    document.body.appendChild(dropdown);

    // Handle checkbox changes
    dropdown.querySelectorAll('input[type="checkbox"]').forEach(cb => {
      cb.addEventListener('change', () => {
        // Update the visibility state (but don't apply yet)
        const key = cb.dataset.column;
        this.columnVisibility[key].default = cb.checked;
      });
    });

    // Apply button
    const applyBtn = dropdown.querySelector('#paColumnApplyBtn');
    applyBtn?.addEventListener('click', () => {
      this.saveColumnVisibility();
      this.renderTable();
      this.toast('Column visibility updated!', 'success', 2000);
      dropdown.remove();
    });

    // Reset button
    const resetBtn = dropdown.querySelector('#paColumnResetBtn');
    resetBtn?.addEventListener('click', () => {
      Object.keys(COLUMN_CONFIG).forEach(key => {
        this.columnVisibility[key].default = COLUMN_CONFIG[key].default;
        const cb = dropdown.querySelector(`input[data-column="${key}"]`);
        if (cb) cb.checked = COLUMN_CONFIG[key].default;
      });
      this.saveColumnVisibility();
      this.renderTable();
      this.toast('Columns reset to default!', 'info', 2000);
      dropdown.remove();
    });

    // Close dropdown on outside click
    const closeDropdown = (e) => {
      if (!dropdown.contains(e.target) && e.target !== btn && !btn.contains(e.target)) {
        dropdown.remove();
        document.removeEventListener('click', closeDropdown);
      }
    };
    setTimeout(() => document.addEventListener('click', closeDropdown), 10);

    // Close on Escape
    const escHandler = (e) => {
      if (e.key === 'Escape') {
        dropdown.remove();
        document.removeEventListener('keydown', escHandler);
        document.removeEventListener('click', closeDropdown);
      }
    };
    document.addEventListener('keydown', escHandler);
  }

  updateColumnVisibilityUI() {
    // Update the table header to show/hide columns
    const thead = document.querySelector('#paMsgTable thead tr');
    if (!thead) return;

    const visibility = this.columnVisibility;
    const ths = thead.querySelectorAll('th');
    const columnMap = ['checkbox', 'from', 'subject', 'status', 'date', 'actions'];
    
    ths.forEach((th, index) => {
      const key = columnMap[index];
      if (key && visibility[key]) {
        th.style.display = visibility[key].default ? '' : 'none';
      }
    });
  }

  // ---- events ---------------------------------------------------------------

  bindEvents() {
    // Setup password toggles if any exist on this page
    injectPasswordToggleStyles();
    setTimeout(() => setupAllPasswordToggles(), 100);

    $all('.pa-status-tab').forEach((tab) => {
      this.on(tab, 'click', () => {
        this.store.set('statusFilter', tab.dataset.status);
        this.store.set('page', 1);
        $all('.pa-status-tab').forEach((t) => t.classList.toggle('active', t === tab));
        const statusSelect = $id('paMsgStatusFilter');
        if (statusSelect) statusSelect.value = ['all', 'unread', 'replied', 'spam'].includes(this.store.get('statusFilter')) ? this.store.get('statusFilter') : 'all';
        this.renderTable();
      });
    });

    this.on($id('paMsgStatusFilter'), 'change', (e) => {
      this.store.set('statusFilter', e.target.value);
      this.store.set('page', 1);
      $all('.pa-status-tab').forEach((t) => t.classList.toggle('active', t.dataset.status === this.store.get('statusFilter')));
      this.renderTable();
    });
    this.on($id('paMsgTimeFilter'), 'change', (e) => { this.store.set('timeFilter', e.target.value); this.store.set('page', 1); this.renderTable(); });

    const searchInput = $id('paSearchInput');
    const searchWrap = $id('paSearchWrap');
    const toolbarSearch = $id('paMsgSearchInput');
    const debouncedRender = debounce(() => { this.store.set('page', 1); this.renderTable(); }, 180);

    if (searchInput) {
      this.on(searchInput, 'input', (e) => {
        this.store.set('searchQuery', e.target.value);
        searchWrap?.classList.toggle('has-value', e.target.value.length > 0);
        if (toolbarSearch) toolbarSearch.value = e.target.value;
        debouncedRender();
      });
    }
    this.on($id('paSearchClear'), 'click', () => {
      this.store.set('searchQuery', '');
      if (searchInput) searchInput.value = '';
      searchWrap?.classList.remove('has-value');
      if (toolbarSearch) toolbarSearch.value = '';
      this.store.set('page', 1);
      this.renderTable();
      searchInput?.focus();
    });
    if (toolbarSearch) {
      this.on(toolbarSearch, 'input', (e) => {
        this.store.set('searchQuery', e.target.value);
        if (searchInput) searchInput.value = e.target.value;
        searchWrap?.classList.toggle('has-value', e.target.value.length > 0);
        debouncedRender();
      });
    }

    this.on($id('paMsgExportBtn'), 'click', () => this.exportCsv());

    // ---- COLUMN VISIBILITY BUTTON ----
    const columnsBtn = $id('paMsgColumnsBtn');
    if (columnsBtn) {
      // Clone to remove existing listeners
      const parent = columnsBtn.parentNode;
      const newBtn = columnsBtn.cloneNode(true);
      parent.replaceChild(newBtn, columnsBtn);
      this.on(newBtn, 'click', () => this.openColumnVisibilityPanel());
    }

    this.on($id('paMsgDetailStar'), 'click', () => {
      const id = this.store.get('selectedId');
      if (id == null) return;
      const m = this.findById(id);
      if (!m) return;
      m.starred = !m.starred;
      this.persist();
      this.renderDetail();
      this.toast(m.starred ? 'Message starred.' : 'Message unstarred.', 'info', 1500);
    });
    this.on($id('paMsgDetailDelete'), 'click', () => {
      const id = this.store.get('selectedId');
      if (id == null) return;
      const m = this.findById(id);
      if (m) requestDelete(m.id, 'message', m.name, 'Delete this message?');
    });
    this.on($id('paMsgDetailClose'), 'click', () => {
      this.store.set('selectedId', null);
      this.store.set('composingReply', false);
      this.renderTable();
      this.renderDetail();
    });

    const mailWrap = $id('paMailPreviewWrap');
    const mailBtn = $id('paMailPreviewBtn');
    if (mailBtn && mailWrap) this.on(mailBtn, 'click', (e) => { e.stopPropagation(); mailWrap.classList.toggle('open'); });
    this.on($id('paHelpBtn'), 'click', () => this.toast('Need a hand? Reach us at support@portfolioadmin.dev', 'info', 3000));

    const avatarWrap = $id('paHeaderAvatarWrap');
    if (avatarWrap) {
      this.on(avatarWrap, 'click', (e) => { e.stopPropagation(); avatarWrap.classList.toggle('open'); });
      avatarWrap.querySelectorAll('.pa-user-dropdown-item').forEach((item) => {
        this.on(item, 'click', (e) => {
          e.stopPropagation();
          avatarWrap.classList.remove('open');
          const spec = item.dataset.toast;
          if (spec) { const [type, msg] = spec.split(':'); this.toast(msg, type); }
          else if (item.id === 'paHeaderLogoutBtn') this.toast('Logging out…', 'info');
        });
      });
    }
    this.on(document, 'click', (e) => {
      if (mailWrap && !mailWrap.contains(e.target)) mailWrap.classList.remove('open');
      if (avatarWrap && !avatarWrap.contains(e.target)) avatarWrap.classList.remove('open');
    });

    this.onBus('confirm:confirmed', ({ id, type }) => { if (type === 'message') this.deleteById(id); });
  }
}