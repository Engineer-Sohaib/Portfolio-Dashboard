/**
 * notifications.js — the bell-icon notification list (#paNotifList). Keeps
 * its own tiny in-memory array; nothing here is persisted, matching legacy
 * behavior (`notifications` was a page-session-only global).
 */
import { $id, escapeHtml } from '../../utils/dom.js';
import { PAGE } from '../../core/router.js';

const DEFAULTS_BY_PAGE = {
  projects: [
    { icon: 'ri-add-circle-line', text: 'New project "Traveler" was added.', time: '2h ago' },
    { icon: 'ri-star-line', text: '"Al Tahaluf\'s Platform" was marked as featured.', time: '5h ago' },
    { icon: 'ri-mail-line', text: 'You have a new contact message.', time: '1d ago' },
  ],
  categories: [
    { icon: 'ri-folder-add-line', text: 'Categories page loaded. Manage your project categories here.', time: 'Just now' },
  ],
  technologies: [
    { icon: 'ri-code-s-slash-line', text: 'Technologies page loaded. Manage your tech stack here.', time: 'Just now' },
    { icon: 'ri-star-line', text: 'Angular, React, .NET Core and C# are marked as headline skills.', time: 'Just now' },
  ],
  media: [
    { icon: 'ri-image-line', text: 'Media Library loaded. Upload and organise your portfolio images here.', time: 'Just now' },
  ],
  testimonials: [
    { icon: 'ri-chat-quote-line', text: 'Testimonials page loaded. Manage client feedback shown on your portfolio here.', time: 'Just now' },
  ],
  blogposts: [
    { icon: 'ri-article-line', text: 'Blog Posts page loaded. Manage articles published on your portfolio here.', time: 'Just now' },
  ],
  experience: [
    { icon: 'ri-briefcase-line', text: 'Experience page loaded. Manage your work history timeline here.', time: 'Just now' },
  ],
  'contact-messages': [
    { icon: 'ri-mail-line', text: 'Contact Messages page loaded. Manage all incoming messages here.', time: 'Just now' },
  ],
};

let notifications = (DEFAULTS_BY_PAGE[PAGE] || []).map((n) => ({ ...n }));

export function renderNotifications() {
  const list = $id('paNotifList');
  const badge = $id('paNotifBadge');
  if (!list) return;

  if (notifications.length === 0) {
    list.innerHTML = `<div class="pa-notif-empty"><i class="ri-notification-off-line" style="font-size:24px;display:block;margin-bottom:8px;"></i>No new notifications</div>`;
  } else {
    list.innerHTML = notifications
      .map(
        (n) => `
      <div class="pa-notif-item">
        <div class="pa-notif-item-icon"><i class="${n.icon}"></i></div>
        <div>
          <div class="pa-notif-item-text">${escapeHtml(n.text)}</div>
          <div class="pa-notif-item-time">${escapeHtml(n.time)}</div>
        </div>
      </div>`,
      )
      .join('');
  }

  if (badge) {
    if (notifications.length > 0) {
      badge.textContent = notifications.length > 9 ? '9+' : String(notifications.length);
      badge.classList.remove('hidden');
    } else {
      badge.classList.add('hidden');
    }
  }
}

export function addNotification(text, icon) {
  notifications.unshift({ icon: icon || 'ri-information-line', text, time: 'Just now' });
  renderNotifications();
}

export function clearNotifications() {
  notifications = [];
  renderNotifications();
}
