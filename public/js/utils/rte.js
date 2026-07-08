/**
 * rte.js — the shared rich-text editor toolbar used by Projects ("full
 * description") and Blog Posts ("content"). Wraps `document.execCommand`,
 * which is deprecated but kept intentionally: swapping it for a real editor
 * library is out of scope for this refactor and would change behavior.
 */
export function setupRte(wrapId, bodyId) {
  const wrap = document.getElementById(wrapId);
  const body = document.getElementById(bodyId);
  if (!wrap || !body) return;

  wrap.querySelectorAll('.pa-rte-btn').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      body.focus();
      const cmd = btn.dataset.cmd;
      if (cmd === 'createLink') {
        const url = window.prompt('Enter URL:', 'https://');
        if (url) document.execCommand('createLink', false, url);
      } else if (cmd === 'formatBlock') {
        document.execCommand('formatBlock', false, btn.dataset.value || 'blockquote');
      } else {
        document.execCommand(cmd, false, null);
      }
      updateRteButtonStates(wrap);
    });
  });
  body.addEventListener('keyup', () => updateRteButtonStates(wrap));
  body.addEventListener('mouseup', () => updateRteButtonStates(wrap));
  body.addEventListener('paste', (e) => {
    e.preventDefault();
    const text = (e.clipboardData || window.clipboardData).getData('text/plain');
    document.execCommand('insertText', false, text);
  });
}

export function updateRteButtonStates(wrap) {
  const map = {
    bold: 'bold', italic: 'italic', underline: 'underline',
    insertUnorderedList: 'insertUnorderedList', insertOrderedList: 'insertOrderedList',
  };
  wrap.querySelectorAll('.pa-rte-btn[data-cmd]').forEach((btn) => {
    const cmd = map[btn.dataset.cmd];
    if (!cmd) return;
    try { btn.classList.toggle('active', document.queryCommandState(cmd)); } catch { /* unsupported command */ }
  });
}
