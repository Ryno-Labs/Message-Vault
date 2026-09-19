// Deploy Code.gs from this package as a Google Apps Script Web App.
// Paste its published URL ending in /exec below, then publish these frontend files to GitHub Pages.
const APP_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbyizQ72PKWFRAxUa-WqFiyWm-DMvRUz2Vi8aTxv8lCRnNPjvnBoesxJH2wPXoV347Q3/exec';

let allMessages = [];
let activeProject = 'All';
let activeCategory = 'All';
let currentLoad = null;
let lastFocus = null;

const grid = document.getElementById('messageGrid');
const statusEl = document.getElementById('status');
const searchInput = document.getElementById('searchInput');
const projectFilters = document.getElementById('projectFilters');
const categoryFilters = document.getElementById('categoryFilters');
const categoryGroup = document.getElementById('categoryGroup');
const reloadBtn = document.getElementById('reloadBtn');
const modalBackdrop = document.getElementById('modalBackdrop');
const modalTitle = document.getElementById('modalTitle');
const modalMeta = document.getElementById('modalMeta');
const messageText = document.getElementById('messageText');
const closeModalBtn = document.getElementById('closeModalBtn');
const copyBtn = document.getElementById('copyBtn');
const toast = document.getElementById('toast');

function loadMessages() {
  if (!APP_SCRIPT_URL || APP_SCRIPT_URL.includes('PASTE_YOUR')) {
    statusEl.textContent = 'Setup needed: paste your Apps Script /exec URL into app.js.';
    grid.innerHTML = '<div class="empty">Your message collection will appear here once connected to Google Sheets.</div>';
    return;
  }

  if (currentLoad) currentLoad();
  reloadBtn.disabled = true;
  statusEl.textContent = 'Loading messages...';
  if (!allMessages.length) grid.innerHTML = '<div class="empty">Loading saved messages...</div>';

  const callbackName = `messageVault_${Date.now()}_${Math.floor(Math.random() * 100000)}`;
  const script = document.createElement('script');
  let finished = false;
  const timeout = setTimeout(() => fail('Connection timed out. Check your Apps Script deployment.'), 15000);

  function cleanup() {
    if (finished) return false;
    finished = true;
    clearTimeout(timeout);
    delete window[callbackName];
    script.remove();
    if (currentLoad === cleanup) currentLoad = null;
    reloadBtn.disabled = false;
    return true;
  }

  function fail(message) {
    if (!cleanup()) return;
    statusEl.textContent = message;
    if (!allMessages.length) {
      grid.innerHTML = '<div class="empty">Unable to load messages. Confirm your /exec URL and sharing access.</div>';
    }
  }

  currentLoad = cleanup;
  window[callbackName] = payload => {
    if (!cleanup()) return;
    if (!payload || payload.ok !== true) {
      statusEl.textContent = payload?.error || 'Could not load messages.';
      return;
    }

    allMessages = Array.isArray(payload.messages) ? payload.messages : [];
    buildProjectFilters();
    buildCategoryFilters();
    renderMessages();
  };

  const joiner = APP_SCRIPT_URL.includes('?') ? '&' : '?';
  script.src = `${APP_SCRIPT_URL}${joiner}callback=${encodeURIComponent(callbackName)}&_=${Date.now()}`;
  script.onerror = () => fail('Could not connect. Check your Apps Script URL and access permissions.');
  document.body.appendChild(script);
}

function makeFilterButton(label, active, className, dataKey) {
  return `<button class="${className}${active ? ' active' : ''}" type="button" data-${dataKey}="${escapeHtml(label)}" aria-pressed="${active}">${escapeHtml(label)}</button>`;
}

function buildProjectFilters() {
  const projects = [...new Set(allMessages.map(m => m.project).filter(Boolean))].sort();
  const values = ['All', ...projects.filter(p => p !== 'All')];
  if (!values.includes(activeProject)) activeProject = 'All';
  projectFilters.innerHTML = values.map(p => makeFilterButton(p, p === activeProject, '', 'project')).join('');
  projectFilters.querySelectorAll('button').forEach(btn => {
    btn.addEventListener('click', () => {
      activeProject = btn.dataset.project;
      activeCategory = 'All';
      buildProjectFilters();
      buildCategoryFilters();
      renderMessages();
    });
  });
}

function buildCategoryFilters() {
  const projectMessages = activeProject === 'All'
    ? allMessages
    : allMessages.filter(m => m.project === activeProject);
  const categories = [...new Set(projectMessages.map(m => m.category).filter(Boolean))].sort();
  const values = ['All', ...categories.filter(c => c !== 'All')];
  if (!values.includes(activeCategory)) activeCategory = 'All';
  categoryGroup.classList.toggle('hidden', categories.length === 0);
  categoryFilters.innerHTML = values.map(c => makeFilterButton(c, c === activeCategory, '', 'category')).join('');
  categoryFilters.querySelectorAll('button').forEach(btn => {
    btn.addEventListener('click', () => {
      activeCategory = btn.dataset.category;
      buildCategoryFilters();
      renderMessages();
    });
  });
}

function renderMessages() {
  const query = searchInput.value.trim().toLowerCase();
  const filtered = allMessages.filter(m => {
    const projectMatch = activeProject === 'All' || m.project === activeProject;
    const categoryMatch = activeCategory === 'All' || m.category === activeCategory;
    const haystack = `${m.project} ${m.category} ${m.title} ${m.message}`.toLowerCase();
    return projectMatch && categoryMatch && (!query || haystack.includes(query));
  });

  statusEl.textContent = `${filtered.length} message${filtered.length === 1 ? '' : 's'}${activeProject === 'All' ? '' : ' · ' + activeProject}`;

  if (!filtered.length) {
    grid.innerHTML = '<div class="empty">No messages found. Try a different project, category, or search.</div>';
    return;
  }

  grid.innerHTML = filtered.map(m => `
    <article class="message-card">
      <div class="card-head">
        <span class="card-label">${escapeHtml(m.category || 'Message')}</span>
        <span class="card-meta" aria-hidden="true">›</span>
      </div>
      <h3>${escapeHtml(m.title)}</h3>
      <p class="preview">${escapeHtml(m.message)}</p>
      <div class="card-actions">
        <button class="copy-btn copy-card-btn" type="button" data-id="${escapeHtml(String(m.id))}">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true"><rect x="9" y="9" width="11" height="11" rx="2" stroke="currentColor" stroke-width="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
          <span>COPY MESSAGE</span>
        </button>
        <button class="view-btn open-btn" type="button" data-id="${escapeHtml(String(m.id))}">Open</button>
      </div>
    </article>
  `).join('');

  grid.querySelectorAll('.open-btn').forEach(btn => btn.addEventListener('click', () => openMessage(btn.dataset.id)));
  grid.querySelectorAll('.copy-card-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      btn.disabled = true;
      const copied = await copyMessageById(btn.dataset.id);
      btn.disabled = false;
      if (copied && btn.isConnected) markCopied(btn);
    });
  });
}

function openMessage(id) {
  const message = allMessages.find(m => String(m.id) === String(id));
  if (!message) return;
  lastFocus = document.activeElement;
  modalMeta.textContent = `${message.project || 'General'} / ${message.category || 'Message'}`;
  modalTitle.textContent = message.title;
  messageText.value = message.message;
  copyBtn.dataset.id = String(message.id);
  copyBtn.innerHTML = copyButtonHtml();
  copyBtn.classList.remove('copied');
  modalBackdrop.classList.remove('hidden');
  modalBackdrop.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';
  messageText.focus({ preventScroll: true });
  messageText.select();
}

function closeModal() {
  if (modalBackdrop.classList.contains('hidden')) return;
  modalBackdrop.classList.add('hidden');
  modalBackdrop.setAttribute('aria-hidden', 'true');
  document.body.style.overflow = '';
  if (lastFocus?.isConnected) lastFocus.focus({ preventScroll: true });
}

async function copyMessageById(id) {
  const message = allMessages.find(m => String(m.id) === String(id));
  if (!message) return false;
  return copyText(message.message);
}

async function copyText(text) {
  let copied = false;
  if (navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      copied = true;
    } catch (_) {}
  }

  if (!copied) {
    const helper = document.createElement('textarea');
    helper.value = text;
    helper.setAttribute('readonly', '');
    helper.style.cssText = 'position:fixed;top:0;left:-9999px;opacity:0;';
    document.body.appendChild(helper);
    helper.focus();
    helper.select();
    try {
      copied = document.execCommand('copy') === true;
    } catch (_) {
      copied = false;
    }
    helper.remove();
  }

  showToast(copied ? 'Copied to clipboard' : 'Copy failed. Open the message and copy it manually.');
  return copied;
}

function copyButtonHtml() {
  return '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true"><rect x="9" y="9" width="11" height="11" rx="2" stroke="currentColor" stroke-width="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg><span>COPY MESSAGE</span>';
}

function markCopied(button) {
  clearTimeout(button.resetTimer);
  button.textContent = 'COPIED ✓';
  button.classList.add('copied');
  button.resetTimer = setTimeout(() => {
    if (!button.isConnected) return;
    button.innerHTML = copyButtonHtml();
    button.classList.remove('copied');
  }, 1300);
}

function showToast(text) {
  toast.textContent = text;
  toast.classList.remove('hidden');
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => toast.classList.add('hidden'), 2200);
}

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

searchInput.addEventListener('input', renderMessages);
reloadBtn.addEventListener('click', loadMessages);
closeModalBtn.addEventListener('click', closeModal);
copyBtn.addEventListener('click', async () => {
  copyBtn.disabled = true;
  const copied = await copyMessageById(copyBtn.dataset.id);
  copyBtn.disabled = false;
  if (copied) markCopied(copyBtn);
});
modalBackdrop.addEventListener('click', e => {
  if (e.target === modalBackdrop) closeModal();
});
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') closeModal();
});

loadMessages();
