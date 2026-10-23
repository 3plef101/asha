/* ═══════════════════════════════════════════════════════════════
   Asha — App Logic
   Data source: public-apis/public-apis README.md on GitHub
   ═══════════════════════════════════════════════════════════════ */

'use strict';

// ── Category Icons ───────────────────────────────────────────────
const CATEGORY_ICONS = {
  'Animals':                        '🐾',
  'Anime':                          '⛩️',
  'Anti-Malware':                   '🛡️',
  'Art & Design':                   '🎨',
  'Authentication & Authorization': '🔑',
  'Blockchain':                     '⛓️',
  'Books':                          '📚',
  'Business':                       '💼',
  'Calendar':                       '📅',
  'Cloud Storage & File Sharing':   '☁️',
  'Continuous Integration':         '🔄',
  'Cryptocurrency':                 '₿',
  'Currency Exchange':              '💱',
  'Data Validation':                '✅',
  'Development':                    '💻',
  'Dictionaries':                   '📖',
  'Documents & Productivity':       '📝',
  'Email':                          '📧',
  'Entertainment':                  '🎭',
  'Environment':                    '🌿',
  'Events':                         '🎉',
  'Finance':                        '📈',
  'Food & Drink':                   '🍕',
  'Games & Comics':                 '🎮',
  'Geocoding':                      '🗺️',
  'Government':                     '🏛️',
  'Health':                         '❤️',
  'Jobs':                           '💼',
  'Machine Learning':               '🤖',
  'Music':                          '🎵',
  'News':                           '📰',
  'Open Data':                      '🌐',
  'Open Source Projects':           '👐',
  'Patent':                         '📜',
  'Personality':                    '🧠',
  'Phone':                          '📱',
  'Photography':                    '📷',
  'Programming':                    '🧑‍💻',
  'Science & Math':                 '🔬',
  'Security':                       '🔐',
  'Shopping':                       '🛒',
  'Social':                         '💬',
  'Sports & Fitness':               '⚽',
  'Test Data':                      '🧪',
  'Text Analysis':                  '🔤',
  'Tracking':                       '📍',
  'Transportation':                 '🚗',
  'URL Shorteners':                 '🔗',
  'Vehicle':                        '🚙',
  'Video':                          '🎬',
  'Weather':                        '🌤️',
};

// ── State ────────────────────────────────────────────────────────
let allApis         = [];
let categories      = [];
let currentCategory = null;
let searchQuery     = '';
let favorites       = [];
let filterState     = { auth: 'all', https: 'all', cors: 'all' };
let sortState       = { col: null, dir: 'asc' };
let theme           = 'dark';
let modalCurrentApi = null;
let toastTimer      = null;

// ── DOM Refs (populated after DOMContentLoaded) ──────────────────
let $loadingEl, $errorEl, $categoriesView, $categoryView,
    $searchView, $favoritesView, $categoriesGrid, $apiTableBody,
    $heroSection, $heroSearch, $globalSearch, $headerSearchWrap;

const $el = id => document.getElementById(id);

// ── Init ─────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  $loadingEl       = $el('loading-state');
  $errorEl         = $el('error-state');
  $categoriesView  = $el('categories-view');
  $categoryView    = $el('category-view');
  $searchView      = $el('search-view');
  $favoritesView   = $el('favorites-view');
  $categoriesGrid  = $el('categories-grid');
  $apiTableBody    = $el('api-table-body');
  $heroSection     = $el('hero-section');
  $heroSearch      = $el('hero-search');
  $globalSearch    = $el('global-search');
  $headerSearchWrap = $el('header-search-wrap');

  initTheme();
  initFavorites();
  setupHeader();
  setupSearch();
  setupFilters();
  setupSort();
  setupModal();
  setupCatFilter();
  setupKeyboard();
  loadData();
});

// ═════════════════════════════════════════════════════════════════
// THEME
// ═════════════════════════════════════════════════════════════════
function initTheme() {
  theme = localStorage.getItem('asha-theme') || 'dark';
  applyTheme();
}

function toggleTheme() {
  theme = theme === 'dark' ? 'light' : 'dark';
  localStorage.setItem('asha-theme', theme);
  applyTheme();
}

function applyTheme() {
  document.documentElement.setAttribute('data-theme', theme);
  const icon = $el('theme-icon');
  if (!icon) return;
  if (theme === 'dark') {
    // Moon icon
    icon.innerHTML = `<path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" fill="currentColor"/>`;
  } else {
    // Sun icon
    icon.innerHTML = `
      <circle cx="10" cy="10" r="3.5" fill="currentColor"/>
      <g stroke="currentColor" stroke-width="1.6" stroke-linecap="round">
        <line x1="10" y1="1.5" x2="10" y2="3.5"/>
        <line x1="10" y1="16.5" x2="10" y2="18.5"/>
        <line x1="1.5" y1="10" x2="3.5" y2="10"/>
        <line x1="16.5" y1="10" x2="18.5" y2="10"/>
        <line x1="4.1" y1="4.1" x2="5.5" y2="5.5"/>
        <line x1="14.5" y1="14.5" x2="15.9" y2="15.9"/>
        <line x1="15.9" y1="4.1" x2="14.5" y2="5.5"/>
        <line x1="5.5" y1="14.5" x2="4.1" y2="15.9"/>
      </g>`;
  }
}

// ═════════════════════════════════════════════════════════════════
// FAVORITES
// ═════════════════════════════════════════════════════════════════
function initFavorites() {
  try {
    favorites = JSON.parse(localStorage.getItem('asha-favorites') || '[]');
    if (!Array.isArray(favorites)) favorites = [];
  } catch { favorites = []; }
  updateFavBadge();
}

function toggleFavorite(apiName) {
  const idx = favorites.indexOf(apiName);
  if (idx === -1) {
    favorites.push(apiName);
    showToast('Saved to favorites ♥');
  } else {
    favorites.splice(idx, 1);
    showToast('Removed from favorites');
  }
  localStorage.setItem('asha-favorites', JSON.stringify(favorites));
  updateFavBadge();
  syncAllFavButtons(apiName);
}

function syncAllFavButtons(apiName) {
  const isFav = favorites.includes(apiName);
  // Sync table row buttons
  document.querySelectorAll('.fav-row-btn').forEach(btn => {
    if (btn.dataset.api !== apiName) return;
    btn.classList.toggle('faved', isFav);
    const svg = btn.querySelector('svg');
    if (svg) svg.setAttribute('fill', isFav ? 'currentColor' : 'none');
    btn.setAttribute('aria-label', isFav ? 'Remove from favorites' : 'Save to favorites');
  });
  // Sync search result / favorites card buttons
  document.querySelectorAll('.sr-fav-btn').forEach(btn => {
    if (btn.dataset.api !== apiName) return;
    btn.classList.toggle('faved', isFav);
    const svg = btn.querySelector('svg');
    if (svg) svg.setAttribute('fill', isFav ? 'currentColor' : 'none');
  });
  // Sync modal fav button
  const modalFavBtn = $el('modal-fav-btn');
  if (modalFavBtn && modalCurrentApi && modalCurrentApi.name === apiName) {
    modalFavBtn.classList.toggle('faved', isFav);
    const svg = modalFavBtn.querySelector('svg');
    if (svg) svg.setAttribute('fill', isFav ? 'currentColor' : 'none');
    modalFavBtn.setAttribute('aria-label', isFav ? 'Remove from favorites' : 'Add to favorites');
  }
}

function updateFavBadge() {
  const badge = $el('fav-count-badge');
  if (!badge) return;
  badge.textContent = favorites.length;
  badge.style.display = favorites.length > 0 ? '' : 'none';
  const navBtn = $el('fav-nav-btn');
  if (navBtn) navBtn.classList.toggle('has-favorites', favorites.length > 0);
}

function showFavorites() {
  const favApis = allApis.filter(api => favorites.includes(api.name));

  showState('');
  $categoriesView.classList.add('hidden');
  $categoryView.classList.add('hidden');
  $searchView.classList.add('hidden');
  $favoritesView.classList.remove('hidden');
  currentCategory = null;

  const grid    = $el('favorites-grid');
  const noFav   = $el('no-favorites');
  const subtitle = $el('fav-subtitle');
  if (subtitle) subtitle.textContent = `${favApis.length} saved API${favApis.length !== 1 ? 's' : ''}`;

  if (favApis.length === 0) {
    grid.innerHTML = '';
    noFav.classList.remove('hidden');
  } else {
    noFav.classList.add('hidden');
    grid.innerHTML = '';
    for (const api of favApis) {
      grid.appendChild(createResultCard(api, ''));
    }
  }
  window.scrollTo({ top: $heroSection.offsetHeight, behavior: 'smooth' });
}

// ═════════════════════════════════════════════════════════════════
// SURPRISE ME
// ═════════════════════════════════════════════════════════════════
function surpriseMe() {
  if (!allApis.length) { showToast('Still loading…'); return; }
  const api = allApis[Math.floor(Math.random() * allApis.length)];
  openModal(api);
}

// ═════════════════════════════════════════════════════════════════
// HEADER SCROLL
// ═════════════════════════════════════════════════════════════════
function setupHeader() {
  window.addEventListener('scroll', () => {
    const heroBottom = $heroSection.getBoundingClientRect().bottom;
    $el('site-header').classList.toggle('scrolled', heroBottom < 80);
    $headerSearchWrap.classList.toggle('visible', heroBottom < 80);
  }, { passive: true });
}

// ═════════════════════════════════════════════════════════════════
// SEARCH
// ═════════════════════════════════════════════════════════════════
function setupSearch() {
  $heroSearch.addEventListener('input', e => {
    const q = e.target.value.trim();
    $globalSearch.value = q;
    handleSearch(q);
  });
  $globalSearch.addEventListener('input', e => {
    const q = e.target.value.trim();
    $heroSearch.value = q;
    handleSearch(q);
  });
}

function handleSearch(q) {
  searchQuery = q;
  if (!q) {
    if (currentCategory) showCategoryView(currentCategory);
    else showHome();
    return;
  }
  performSearch(q);
}

function clearSearch() {
  searchQuery = '';
  $heroSearch.value = '';
  $globalSearch.value = '';
  showHome();
}

function performSearch(q) {
  currentCategory = null;
  const ql = q.toLowerCase();
  const results = allApis.filter(api =>
    api.name.toLowerCase().includes(ql) ||
    api.description.toLowerCase().includes(ql) ||
    api.category.toLowerCase().includes(ql)
  );

  showState('');
  $categoriesView.classList.add('hidden');
  $categoryView.classList.add('hidden');
  $searchView.classList.remove('hidden');
  $favoritesView.classList.add('hidden');

  $el('search-results-title').textContent =
    results.length > 0
      ? `${results.length} result${results.length !== 1 ? 's' : ''} for "${q}"`
      : `No results for "${q}"`;

  const grid  = $el('search-results-grid');
  const noRes = $el('no-results');

  if (results.length === 0) {
    grid.innerHTML = '';
    noRes.classList.remove('hidden');
    return;
  }
  noRes.classList.add('hidden');
  grid.innerHTML = '';
  for (const api of results.slice(0, 200)) {
    grid.appendChild(createResultCard(api, q));
  }
}

// ═════════════════════════════════════════════════════════════════
// CATEGORY FILTER
// ═════════════════════════════════════════════════════════════════
function setupCatFilter() {
  const input = $el('cat-filter');
  if (!input) return;
  input.addEventListener('input', e => filterCategoryGrid(e.target.value));
}

function filterCategoryGrid(q) {
  const ql = (q || '').toLowerCase().trim();
  const cards = $categoriesGrid.querySelectorAll('.category-card');
  let visible = 0;
  cards.forEach(card => {
    const name = card.querySelector('.card-name').textContent.toLowerCase();
    const show = !ql || name.includes(ql);
    card.style.display = show ? '' : 'none';
    if (show) visible++;
  });
  const noRes = $el('cat-no-results');
  if (noRes) noRes.classList.toggle('hidden', visible > 0 || !ql);
}

// ═════════════════════════════════════════════════════════════════
// FILTERS (Auth / HTTPS / CORS)
// ═════════════════════════════════════════════════════════════════
function setupFilters() {
  document.querySelectorAll('.filter-chip').forEach(btn => {
    btn.addEventListener('click', () => {
      const group = btn.dataset.filter;
      const value = btn.dataset.value;
      filterState[group] = value;
      document.querySelectorAll(`[data-filter="${group}"]`).forEach(b =>
        b.classList.toggle('active', b.dataset.value === value)
      );
      refreshTable();
    });
  });
}

function resetFilters() {
  filterState = { auth: 'all', https: 'all', cors: 'all' };
  document.querySelectorAll('.filter-chip').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.value === 'all');
  });
  refreshTable();
}

function getFilteredSorted(apis) {
  let result = apis.filter(api => {
    if (filterState.auth  !== 'all' && api.auth  !== filterState.auth)  return false;
    if (filterState.https !== 'all' && api.https !== filterState.https) return false;
    if (filterState.cors  !== 'all' && api.cors  !== filterState.cors)  return false;
    return true;
  });
  if (sortState.col) {
    result = [...result].sort((a, b) => {
      const av = (a[sortState.col] || '').toLowerCase();
      const bv = (b[sortState.col] || '').toLowerCase();
      return sortState.dir === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av);
    });
  }
  return result;
}

function refreshTable() {
  if (!currentCategory) return;
  const filtered = getFilteredSorted(currentCategory.apis);
  renderApiTable(filtered);

  const countEl   = $el('filter-results-count');
  const emptyEl   = $el('table-empty');
  const tableWrap = $el('api-table-wrap');
  const total     = currentCategory.apis.length;

  if (filtered.length === 0) {
    if (countEl) countEl.textContent = '0 results';
    tableWrap.classList.add('hidden');
    emptyEl.classList.remove('hidden');
  } else {
    if (countEl) countEl.textContent = filtered.length < total
      ? `${filtered.length} of ${total}`
      : `${total} APIs`;
    tableWrap.classList.remove('hidden');
    emptyEl.classList.add('hidden');
  }
}

// ═════════════════════════════════════════════════════════════════
// SORT (columns)
// ═════════════════════════════════════════════════════════════════
function setupSort() {
  document.querySelectorAll('.api-table th.sortable').forEach(th => {
    th.addEventListener('click', () => {
      const col = th.dataset.sort;
      if (sortState.col === col) {
        sortState.dir = sortState.dir === 'asc' ? 'desc' : 'asc';
      } else {
        sortState.col = col;
        sortState.dir = 'asc';
      }
      updateSortIndicators();
      refreshTable();
    });
  });
}

function updateSortIndicators() {
  document.querySelectorAll('.api-table th.sortable').forEach(th => {
    const icon = th.querySelector('.sort-icon');
    th.classList.remove('sort-asc', 'sort-desc');
    if (th.dataset.sort === sortState.col) {
      th.classList.add(sortState.dir === 'asc' ? 'sort-asc' : 'sort-desc');
      if (icon) icon.textContent = sortState.dir === 'asc' ? '↑' : '↓';
    } else {
      if (icon) icon.textContent = '↕';
    }
  });
}

// ═════════════════════════════════════════════════════════════════
// MODAL
// ═════════════════════════════════════════════════════════════════
function setupModal() {
  const overlay  = $el('modal-overlay');
  const closeBtn = $el('modal-close');
  if (overlay)  overlay.addEventListener('click', e => { if (e.target === overlay) closeModal(); });
  if (closeBtn) closeBtn.addEventListener('click', closeModal);
}

function openModal(api) {
  modalCurrentApi = api;
  const isFav   = favorites.includes(api.name);
  const body    = $el('modal-body');
  const fill    = isFav ? 'currentColor' : 'none';
  const ariaLbl = isFav ? 'Remove from favorites' : 'Add to favorites';

  const extIcon = `<svg viewBox="0 0 16 16" fill="none" width="12" height="12" style="flex-shrink:0">
    <path d="M7 3H3a1 1 0 0 0-1 1v9a1 1 0 0 0 1 1h9a1 1 0 0 0 1-1V9" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>
    <path d="M10 1h5v5M15 1L8 8" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>
  </svg>`;
  const heartSvg = `<svg viewBox="0 0 20 20" fill="${fill}" width="18" height="18">
    <path d="M10 17s-7-4.35-7-9a5 5 0 0 1 7-4.58A5 5 0 0 1 17 8c0 4.65-7 9-7 9z" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/>
  </svg>`;

  body.innerHTML = `
    <div class="modal-top-row">
      <span class="modal-cat-badge">${escapeHtml(api.category)}</span>
      <button class="modal-fav-btn ${isFav ? 'faved' : ''}" id="modal-fav-btn" aria-label="${ariaLbl}">
        ${heartSvg}
      </button>
    </div>
    <h2 class="modal-title" id="modal-api-name">${escapeHtml(api.name)}</h2>
    <p class="modal-desc">${escapeHtml(api.description)}</p>
    <div class="modal-chips">
      ${authChip(api.auth)}
      ${boolChip(api.https, 'HTTPS')}
      ${boolChip(api.cors, 'CORS')}
    </div>
    ${api.link ? `
      <div class="modal-link-row">
        <code class="modal-url">${escapeHtml(api.link)}</code>
      </div>
      <div class="modal-actions">
        <button class="btn-copy-url" id="btn-copy-url">
          <svg viewBox="0 0 20 20" fill="none" width="14" height="14">
            <rect x="7" y="7" width="10" height="10" rx="2" stroke="currentColor" stroke-width="1.7"/>
            <path d="M3 13V3h10" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/>
          </svg>
          Copy URL
        </button>
        <a href="${escapeHtml(api.link)}" target="_blank" rel="noopener" class="btn-visit">
          Visit API ${extIcon}
        </a>
      </div>` : `<p class="modal-no-link">No direct link available.</p>`}
  `;

  // Fav button listener
  const favBtn = $el('modal-fav-btn');
  if (favBtn) favBtn.addEventListener('click', () => toggleFavorite(api.name));

  // Copy button listener
  const copyBtn = $el('btn-copy-url');
  if (copyBtn && api.link) copyBtn.addEventListener('click', () => copyLink(api.link, copyBtn));

  $el('modal-overlay').classList.remove('hidden');
  document.body.style.overflow = 'hidden';
  setTimeout(() => { const c = $el('modal-close'); if (c) c.focus(); }, 50);
}

function closeModal() {
  $el('modal-overlay').classList.add('hidden');
  document.body.style.overflow = '';
  modalCurrentApi = null;
}

function copyLink(url, btn) {
  navigator.clipboard.writeText(url).then(() => {
    showToast('URL copied to clipboard!');
    if (btn) {
      const origHTML = btn.innerHTML;
      btn.textContent = '✓ Copied!';
      btn.style.color = '#4ADE80';
      setTimeout(() => {
        btn.innerHTML = origHTML;
        btn.style.color = '';
      }, 2000);
    }
  }).catch(() => showToast('Copy failed — please select the URL manually'));
}

// ═════════════════════════════════════════════════════════════════
// TOAST
// ═════════════════════════════════════════════════════════════════
function showToast(msg) {
  const toast = $el('toast');
  if (!toast) return;
  toast.textContent = msg;
  toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('show'), 2800);
}

// ═════════════════════════════════════════════════════════════════
// KEYBOARD NAVIGATION
// ═════════════════════════════════════════════════════════════════
function setupKeyboard() {
  document.addEventListener('keydown', e => {
    // Escape: close modal → then clear search
    if (e.key === 'Escape') {
      const overlay = $el('modal-overlay');
      if (overlay && !overlay.classList.contains('hidden')) { closeModal(); return; }
      if (searchQuery) clearSearch();
    }
    // ⌘K / Ctrl+K → focus search
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
      e.preventDefault();
      const heroVisible = $heroSection.getBoundingClientRect().bottom > 80;
      (heroVisible ? $heroSearch : $globalSearch).focus();
    }
  });

  // Arrow keys in categories grid
  if ($categoriesGrid) $categoriesGrid.addEventListener('keydown', gridKeyNav);
  // Arrow keys in API table body
  if ($apiTableBody)  $apiTableBody.addEventListener('keydown', tableKeyNav);
}

function gridKeyNav(e) {
  const KEYS = ['ArrowRight', 'ArrowLeft', 'ArrowDown', 'ArrowUp'];
  if (!KEYS.includes(e.key)) return;
  const cards = [...$categoriesGrid.querySelectorAll('.category-card')]
    .filter(c => c.style.display !== 'none');
  const idx = cards.indexOf(document.activeElement);
  if (idx === -1) return;
  e.preventDefault();

  const cols = getGridCols(cards);
  let next = idx;
  if (e.key === 'ArrowRight') next = Math.min(idx + 1, cards.length - 1);
  else if (e.key === 'ArrowLeft')  next = Math.max(idx - 1, 0);
  else if (e.key === 'ArrowDown')  next = Math.min(idx + cols, cards.length - 1);
  else if (e.key === 'ArrowUp')    next = Math.max(idx - cols, 0);
  if (next !== idx) cards[next].focus();
}

function tableKeyNav(e) {
  if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return;
  const rows = [...$apiTableBody.querySelectorAll('tr')];
  const focused = document.activeElement.closest('tr');
  const idx = rows.indexOf(focused);
  if (idx === -1) return;
  e.preventDefault();
  const next = e.key === 'ArrowDown'
    ? Math.min(idx + 1, rows.length - 1)
    : Math.max(idx - 1, 0);
  rows[next].focus();
}

function getGridCols(cards) {
  if (cards.length < 2) return 1;
  const firstTop = cards[0].getBoundingClientRect().top;
  let cols = 1;
  for (let i = 1; i < cards.length; i++) {
    if (Math.abs(cards[i].getBoundingClientRect().top - firstTop) < 8) cols++;
    else break;
  }
  return cols;
}

// ═════════════════════════════════════════════════════════════════
// DATA LOADING
// ═════════════════════════════════════════════════════════════════
async function loadData() {
  showState('loading');
  try {
    const url = 'https://raw.githubusercontent.com/public-apis/public-apis/master/README.md';
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const text = await res.text();
    parseReadme(text);
    renderStats();
    showHome();
    // Reveal surprise button
    const btn = $el('surprise-btn');
    if (btn) btn.classList.remove('hidden');
  } catch (err) {
    console.error('Failed to load data:', err);
    showState('error');
  }
}

// ═════════════════════════════════════════════════════════════════
// MARKDOWN PARSER
// ═════════════════════════════════════════════════════════════════
function parseReadme(text) {
  allApis    = [];
  categories = [];

  const lines          = text.split('\n');
  let currentCat       = null;
  let inTable          = false;

  const API_TABLE_HEADER_RE = /API.*Description.*Auth.*HTTPS.*CORS/i;
  const TABLE_ROW_RE        = /^\|([^|]+)\|([^|]+)\|([^|]+)\|([^|]+)\|([^|]+)\|/;
  const H3_RE               = /^###\s+(.+)/;
  const SEPARATOR_RE        = /^\|[-: |]+\|/;
  const SKIP_CATS           = new Set(['APIs Covered Under APILayer Suite!', 'APILayer APIs', 'MCP Servers']);

  for (const line of lines) {
    const h3Match = line.match(H3_RE);
    if (h3Match) {
      const catName = h3Match[1].trim();
      if (SKIP_CATS.has(catName)) continue;
      currentCat = { name: catName, apis: [] };
      inTable    = false;
      continue;
    }
    if (!currentCat) continue;
    if (API_TABLE_HEADER_RE.test(line)) { inTable = true; continue; }
    if (SEPARATOR_RE.test(line)) continue;
    if (inTable && line.startsWith('|')) {
      const rowMatch = line.match(TABLE_ROW_RE);
      if (!rowMatch) continue;
      const [, rawName, rawDesc, rawAuth, rawHttps, rawCors] = rowMatch;
      const nameCell  = rawName.trim();
      const desc      = rawDesc.trim();
      const auth      = parseAuth(rawAuth.trim());
      const https     = parseYesNo(rawHttps.trim());
      const cors      = parseYesNo(rawCors.trim());
      const linkMatch = nameCell.match(/\[([^\]]+)\]\(([^)]+)\)/);
      const name      = linkMatch ? linkMatch[1] : nameCell;
      const link      = linkMatch ? linkMatch[2] : null;
      if (!name || name === 'API') continue;
      const api = { name, link, description: desc, auth, https, cors, category: currentCat.name };
      currentCat.apis.push(api);
      allApis.push(api);
    } else if (inTable && !line.startsWith('|') && line.trim() !== '') {
      inTable = false;
    }
  }

  const catMap = new Map();
  for (const api of allApis) {
    if (!catMap.has(api.category)) catMap.set(api.category, []);
    catMap.get(api.category).push(api);
  }
  for (const [name, apis] of catMap) categories.push({ name, apis });
}

function parseAuth(raw) {
  const lower = raw.toLowerCase();
  if (lower.includes('oauth')) return 'OAuth';
  if (lower.includes('apikey') || lower.includes('api key')) return 'apiKey';
  if (lower.includes('no') || lower === '' || lower === '-') return 'No';
  return raw;
}

function parseYesNo(raw) {
  const lower = raw.toLowerCase();
  if (lower.includes('yes')) return 'Yes';
  if (lower.includes('no'))  return 'No';
  return 'Unknown';
}

// ═════════════════════════════════════════════════════════════════
// RENDER
// ═════════════════════════════════════════════════════════════════
function renderStats() {
  $el('stat-count').textContent = allApis.length.toLocaleString();
  $el('stat-cats').textContent  = categories.length;
}

function showState(state) {
  $loadingEl.classList.toggle('hidden', state !== 'loading');
  $errorEl.classList.toggle('hidden',   state !== 'error');
}

function showHome() {
  currentCategory = null;
  searchQuery     = '';
  if ($heroSearch)   $heroSearch.value   = '';
  if ($globalSearch) $globalSearch.value = '';

  showState('');
  $categoriesView.classList.remove('hidden');
  $categoryView.classList.add('hidden');
  $searchView.classList.add('hidden');
  $favoritesView.classList.add('hidden');

  // Reset category text filter
  const catFilter = $el('cat-filter');
  if (catFilter) { catFilter.value = ''; filterCategoryGrid(''); }

  if ($categoriesGrid.children.length === 0) renderCategories();
}

function renderCategories() {
  $categoriesGrid.innerHTML = '';
  for (const cat of categories) {
    const icon = CATEGORY_ICONS[cat.name] || '📦';
    const card = document.createElement('div');
    card.className = 'category-card';
    card.setAttribute('role', 'button');
    card.setAttribute('tabindex', '0');
    card.setAttribute('aria-label', `${cat.name} — ${cat.apis.length} APIs`);
    card.innerHTML = `
      <span class="card-icon">${icon}</span>
      <div class="card-name">${escapeHtml(cat.name)}</div>
      <div class="card-count">${cat.apis.length} API${cat.apis.length !== 1 ? 's' : ''}</div>
    `;
    card.addEventListener('click', () => showCategoryView(cat));
    card.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); showCategoryView(cat); }
    });
    $categoriesGrid.appendChild(card);
  }
}

function showCategoryView(cat) {
  currentCategory = cat;
  searchQuery     = '';
  if ($heroSearch)   $heroSearch.value   = '';
  if ($globalSearch) $globalSearch.value = '';

  // Reset filters & sort for fresh category view
  filterState = { auth: 'all', https: 'all', cors: 'all' };
  sortState   = { col: null, dir: 'asc' };
  document.querySelectorAll('.filter-chip').forEach(btn =>
    btn.classList.toggle('active', btn.dataset.value === 'all')
  );
  updateSortIndicators();

  showState('');
  $categoriesView.classList.add('hidden');
  $categoryView.classList.remove('hidden');
  $searchView.classList.add('hidden');
  $favoritesView.classList.add('hidden');

  const icon = CATEGORY_ICONS[cat.name] || '📦';
  $el('cat-icon-detail').textContent = icon;
  $el('cat-name-detail').textContent = cat.name;
  $el('cat-count-detail').textContent = `${cat.apis.length} API${cat.apis.length !== 1 ? 's' : ''}`;

  refreshTable();
  window.scrollTo({ top: $heroSection.offsetHeight, behavior: 'smooth' });
}

function renderApiTable(apis) {
  $apiTableBody.innerHTML = '';
  for (const api of apis) {
    const isFav = favorites.includes(api.name);
    const tr    = document.createElement('tr');
    tr.setAttribute('tabindex', '0');
    tr.innerHTML = `
      <td>
        ${api.link
          ? `<a href="${escapeHtml(api.link)}" target="_blank" rel="noopener" class="api-name-link">${escapeHtml(api.name)}</a>`
          : `<span class="api-name-link">${escapeHtml(api.name)}</span>`}
      </td>
      <td><span class="api-desc">${escapeHtml(api.description)}</span></td>
      <td>${authChip(api.auth)}</td>
      <td>${boolChip(api.https)}</td>
      <td>${boolChip(api.cors)}</td>
      <td>
        <button class="fav-row-btn ${isFav ? 'faved' : ''}"
                data-api="${escapeHtml(api.name)}"
                aria-label="${isFav ? 'Remove from favorites' : 'Save to favorites'}"
                title="${isFav ? 'Saved' : 'Save'}">
          <svg viewBox="0 0 20 20" fill="${isFav ? 'currentColor' : 'none'}" width="15" height="15">
            <path d="M10 17s-7-4.35-7-9a5 5 0 0 1 7-4.58A5 5 0 0 1 17 8c0 4.65-7 9-7 9z"
                  stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/>
          </svg>
        </button>
      </td>
    `;

    // Row click → open modal (unless clicking the link itself or fav btn)
    tr.addEventListener('click', e => {
      if (e.target.closest('.api-name-link') && api.link) return;
      if (e.target.closest('.fav-row-btn')) return;
      openModal(api);
    });
    tr.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openModal(api); }
    });

    // Fav btn
    const favBtn = tr.querySelector('.fav-row-btn');
    favBtn.addEventListener('click', e => { e.stopPropagation(); toggleFavorite(api.name); });

    $apiTableBody.appendChild(tr);
  }
}

// ── Shared Result Card (search results & favorites) ──────────────
function createResultCard(api, query) {
  const isFav = favorites.includes(api.name);
  const q     = query || '';
  const card  = document.createElement('div');
  card.className = 'search-result-card';
  card.setAttribute('tabindex', '0');

  const name = q ? highlight(escapeHtml(api.name), q)        : escapeHtml(api.name);
  const desc = q ? highlight(escapeHtml(api.description), q) : escapeHtml(api.description);

  card.innerHTML = `
    <div class="sr-main">
      <div class="sr-top">
        ${api.link
          ? `<a href="${escapeHtml(api.link)}" target="_blank" rel="noopener" class="sr-name">${name}</a>`
          : `<span class="sr-name">${name}</span>`}
        <span class="sr-category">${escapeHtml(api.category)}</span>
      </div>
      <div class="sr-desc">${desc}</div>
    </div>
    <div class="sr-badges">
      ${authChip(api.auth)}
      ${boolChip(api.https, 'HTTPS')}
      ${boolChip(api.cors, 'CORS')}
      <button class="sr-fav-btn ${isFav ? 'faved' : ''}"
              data-api="${escapeHtml(api.name)}"
              aria-label="${isFav ? 'Remove from favorites' : 'Save to favorites'}">
        <svg viewBox="0 0 20 20" fill="${isFav ? 'currentColor' : 'none'}" width="15" height="15">
          <path d="M10 17s-7-4.35-7-9a5 5 0 0 1 7-4.58A5 5 0 0 1 17 8c0 4.65-7 9-7 9z"
                stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/>
        </svg>
      </button>
    </div>
  `;

  // Click card → modal
  card.addEventListener('click', e => {
    if (e.target.closest('a')) return;
    if (e.target.closest('.sr-fav-btn')) return;
    openModal(api);
  });
  card.addEventListener('keydown', e => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openModal(api); }
  });

  // Fav btn
  const favBtn = card.querySelector('.sr-fav-btn');
  favBtn.addEventListener('click', e => {
    e.stopPropagation();
    toggleFavorite(api.name);
    // In favorites view, animate out if unfavorited
    if (!$favoritesView.classList.contains('hidden') && !favorites.includes(api.name)) {
      card.style.transition = 'opacity 0.25s ease, transform 0.25s ease';
      card.style.opacity    = '0';
      card.style.transform  = 'translateX(-12px)';
      setTimeout(() => {
        card.remove();
        const favApis  = allApis.filter(a => favorites.includes(a.name));
        const subtitle = $el('fav-subtitle');
        if (subtitle) subtitle.textContent = `${favApis.length} saved API${favApis.length !== 1 ? 's' : ''}`;
        if (favApis.length === 0) {
          const noFav = $el('no-favorites');
          if (noFav) noFav.classList.remove('hidden');
        }
      }, 260);
    }
  });

  return card;
}

// ═════════════════════════════════════════════════════════════════
// CHIP HELPERS
// ═════════════════════════════════════════════════════════════════
function authChip(auth) {
  if (!auth || auth === 'No') return `<span class="chip chip-auth-none">No Auth</span>`;
  if (auth === 'OAuth')        return `<span class="chip chip-auth-oauth">OAuth</span>`;
  return `<span class="chip chip-auth-apikey">API Key</span>`;
}

function boolChip(val, label = '') {
  const prefix = label ? `${label} ` : '';
  if (val === 'Yes') return `<span class="chip chip-yes">${prefix}✓</span>`;
  if (val === 'No')  return `<span class="chip chip-no">${prefix}✗</span>`;
  return `<span class="chip chip-unknown">?</span>`;
}

// ═════════════════════════════════════════════════════════════════
// TEXT HELPERS
// ═════════════════════════════════════════════════════════════════
function escapeHtml(str) {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function highlight(text, query) {
  if (!query) return text;
  const re = new RegExp(`(${escapeRegex(query)})`, 'gi');
  return text.replace(re, '<mark>$1</mark>');
}

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
