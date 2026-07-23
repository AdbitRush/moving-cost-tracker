// Moving Cost Tracker — localStorage, single-language

let categories = [];
let items = [];
let saleItems = [];
let config = { budget: 0, currency: 'ILS' };
let currentFilter = 'all';
let currentSaleFilter = 'all';
let currentSort = 'manual';
let expandedRows = new Set();
let calWeekStart = null;
let calWeekCount = 1;
let dragSrcId = null;

const CAT_COLORS = ['cat-0','cat-1','cat-2','cat-3','cat-4','cat-5','cat-6','cat-7'];

// Card background fill colors (match cat-card-N / room-chip-N in CSS)
const CAT_BG     = ['#eef3ff','#fefce8','#f0fdf4','#fff1f2','#f0f9ff','#faf5ff','#fff8f5','#f0fff4'];
const CAT_TOP    = ['#e0e9ff','#fef3c7','#d1fae5','#ffe4e6','#e0f2fe','#f3e8ff','#fff7ed','#dcfce7'];
const CAT_BORDER = ['#c7d2fe','#fde68a','#6ee7b7','#fecdd3','#bae6fd','#d8b4fe','#fed7aa','#86efac'];
const ROOM_BG    = ['#fef3c7','#e0f2fe','#d1fae5','#fce7f3','#ede9fe','#fef9c3','#d1fae5','#f3f4f6','#cffafe'];
const ROOM_TOP   = ['#fde68a','#bae6fd','#6ee7b7','#fbcfe8','#c4b5fd','#fef08a','#6ee7b7','#d1d5db','#67e8f9'];

const CAT_OPTION_STYLES = [
  'background:#eef3ff;color:#4338ca',
  'background:#fef3c7;color:#92400e',
  'background:#d1fae5;color:#065f46',
  'background:#ffe4e6;color:#9f1239',
  'background:#e0f2fe;color:#0c4a6e',
  'background:#f3e8ff;color:#6b21a8',
  'background:#fff7ed;color:#9a3412',
  'background:#f0fdf4;color:#14532d',
];

// ── Storage ───────────────────────────────────────────────
function saveItems()      { localStorage.setItem('mct-items',      JSON.stringify(items)); }
function saveCategories() { localStorage.setItem('mct-categories', JSON.stringify(categories)); }
function saveConfig() {
  // Save locally
  localStorage.setItem('mct-config', JSON.stringify(config));
  // Also persist to backend if available
  fetch('/api/config', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ budget: config.budget, currency: config.currency })
  }).catch(err => {
    console.error('Failed to save config to server:', err);
    // optional: show toast for failure
    // toast('שמירת תקציב מרחוק נכשלה', 'error');
  });
}
function saveSaleItems()  { localStorage.setItem('mct-sales',      JSON.stringify(saleItems)); }

function loadStorage() {
  items      = JSON.parse(localStorage.getItem('mct-items')      || '[]');
  categories = JSON.parse(localStorage.getItem('mct-categories') || '[]');
  config     = JSON.parse(localStorage.getItem('mct-config')     || '{"budget":0,"currency":"ILS"}');
  saleItems  = JSON.parse(localStorage.getItem('mct-sales')      || '[]');

  // remove room names that leaked into categories in a previous version
  const before = categories.length;
  categories = categories.filter(c => !ROOM_PRESETS.includes(c.name));
  if (categories.length !== before) saveCategories();

  if (!categories.length) {
    categories = [
      { id:1,  name:'הובלה ולוגיסטיקה' },
      { id:2,  name:'ריהוט' },
      { id:3,  name:'מכשירי חשמל' },
      { id:4,  name:'שיפוצים ובנייה' },
      { id:5,  name:'אינסטלציה' },
      { id:6,  name:'חשמל ותאורה' },
      { id:7,  name:'ניקיון' },
      { id:8,  name:'שירותים וחיבורים' },
      { id:9,  name:'אחסון' },
      { id:10, name:'ביטוח' },
      { id:11, name:'עיצוב ודקורציה' },
      { id:12, name:'שונות' },
      { id:13, name:'טכנולוגיה ואלקטרוניקה' },
      { id:14, name:'גינה ומרפסת' },
      { id:15, name:'ילדים ותינוק' },
      { id:16, name:'בית חכם ואבטחה' },
    ];
    saveCategories();
  }

  if (!items.length) {
    items = [
      { id:1,  name:'מובילים (הובלה)',              price:0, notes:'', category_id:1,  selected:false, status:'pending', model:'', contact_name:'', contact_phone:'', appointment:'', quotes:[] },
      { id:2,  name:'אריזות וחומרי אריזה',           price:0, notes:'', category_id:1,  selected:false, status:'pending', model:'', contact_name:'', contact_phone:'', appointment:'', quotes:[] },
      { id:3,  name:'מקרר',                          price:0, notes:'', category_id:3,  selected:false, status:'pending', model:'', contact_name:'', contact_phone:'', appointment:'', quotes:[] },
      { id:4,  name:'מדיח כלים',                     price:0, notes:'', category_id:3,  selected:false, status:'pending', model:'', contact_name:'', contact_phone:'', appointment:'', quotes:[] },
      { id:5,  name:'תנור ומיקרוגל',                 price:0, notes:'', category_id:3,  selected:false, status:'pending', model:'', contact_name:'', contact_phone:'', appointment:'', quotes:[] },
      { id:6,  name:'מכונת כביסה',                   price:0, notes:'', category_id:3,  selected:false, status:'pending', model:'', contact_name:'', contact_phone:'', appointment:'', quotes:[] },
      { id:7,  name:'מזגן',                          price:0, notes:'', category_id:6,  selected:false, status:'pending', model:'', contact_name:'', contact_phone:'', appointment:'', quotes:[] },
      { id:8,  name:'מיטה וארגז שינה',               price:0, notes:'', category_id:2,  selected:false, status:'pending', model:'', contact_name:'', contact_phone:'', appointment:'', quotes:[] },
      { id:9,  name:'ספה וסלון',                     price:0, notes:'', category_id:2,  selected:false, status:'pending', model:'', contact_name:'', contact_phone:'', appointment:'', quotes:[] },
      { id:10, name:'ארון בגדים',                    price:0, notes:'', category_id:2,  selected:false, status:'pending', model:'', contact_name:'', contact_phone:'', appointment:'', quotes:[] },
      { id:11, name:'שולחן אוכל וכיסאות',            price:0, notes:'', category_id:2,  selected:false, status:'pending', model:'', contact_name:'', contact_phone:'', appointment:'', quotes:[] },
      { id:12, name:'צבע וטיח',                      price:0, notes:'', category_id:4,  selected:false, status:'pending', model:'', contact_name:'', contact_phone:'', appointment:'', quotes:[] },
      { id:13, name:'ריצוף',                         price:0, notes:'', category_id:4,  selected:false, status:'pending', model:'', contact_name:'', contact_phone:'', appointment:'', quotes:[] },
      { id:14, name:'שיפוץ מטבח',                    price:0, notes:'', category_id:4,  selected:false, status:'pending', model:'', contact_name:'', contact_phone:'', appointment:'', quotes:[] },
      { id:15, name:'שיפוץ אמבטיה',                  price:0, notes:'', category_id:5,  selected:false, status:'pending', model:'', contact_name:'', contact_phone:'', appointment:'', quotes:[] },
      { id:16, name:'חיבור גז',                      price:0, notes:'', category_id:5,  selected:false, status:'pending', model:'', contact_name:'', contact_phone:'', appointment:'', quotes:[] },
      { id:17, name:'חיבור חשמל ולוח',               price:0, notes:'', category_id:6,  selected:false, status:'pending', model:'', contact_name:'', contact_phone:'', appointment:'', quotes:[] },
      { id:18, name:'תאורה',                         price:0, notes:'', category_id:6,  selected:false, status:'pending', model:'', contact_name:'', contact_phone:'', appointment:'', quotes:[] },
      { id:19, name:'שירות ניקיון',                  price:0, notes:'', category_id:7,  selected:false, status:'pending', model:'', contact_name:'', contact_phone:'', appointment:'', quotes:[] },
      { id:20, name:'הדברה',                         price:0, notes:'', category_id:7,  selected:false, status:'pending', model:'', contact_name:'', contact_phone:'', appointment:'', quotes:[] },
      { id:21, name:'חיבור אינטרנט',                 price:0, notes:'', category_id:8,  selected:false, status:'pending', model:'', contact_name:'', contact_phone:'', appointment:'', quotes:[] },
      { id:22, name:'העברת טלפון וגז ומים',          price:0, notes:'', category_id:8,  selected:false, status:'pending', model:'', contact_name:'', contact_phone:'', appointment:'', quotes:[] },
      { id:23, name:'ביטוח דירה',                    price:0, notes:'', category_id:10, selected:false, status:'pending', model:'', contact_name:'', contact_phone:'', appointment:'', quotes:[] },
      { id:24, name:'הוצאות שונות',                  price:0, notes:'', category_id:12, selected:false, status:'pending', model:'', contact_name:'', contact_phone:'', appointment:'', quotes:[] },
      { id:25, name:'וילונות ורולרים',                price:0, notes:'', category_id:11, selected:false, status:'pending', model:'', contact_name:'', contact_phone:'', appointment:'', quotes:[] },
      { id:26, name:'שטיחים',                        price:0, notes:'', category_id:11, selected:false, status:'pending', model:'', contact_name:'', contact_phone:'', appointment:'', quotes:[] },
      { id:27, name:'מראות',                         price:0, notes:'', category_id:11, selected:false, status:'pending', model:'', contact_name:'', contact_phone:'', appointment:'', quotes:[] },
      { id:28, name:'טלוויזיה',                      price:0, notes:'', category_id:13, selected:false, status:'pending', model:'', contact_name:'', contact_phone:'', appointment:'', quotes:[] },
      { id:29, name:'מחשב / לפטופ',                 price:0, notes:'', category_id:13, selected:false, status:'pending', model:'', contact_name:'', contact_phone:'', appointment:'', quotes:[] },
      { id:30, name:'ראוטר וציוד רשת',               price:0, notes:'', category_id:13, selected:false, status:'pending', model:'', contact_name:'', contact_phone:'', appointment:'', quotes:[] },
      { id:31, name:'מערכת שמע / סאונד בר',          price:0, notes:'', category_id:13, selected:false, status:'pending', model:'', contact_name:'', contact_phone:'', appointment:'', quotes:[] },
      { id:32, name:'כוננית טלוויזיה / ספרייה',      price:0, notes:'', category_id:2,  selected:false, status:'pending', model:'', contact_name:'', contact_phone:'', appointment:'', quotes:[] },
      { id:33, name:'שולחן עבודה / פינת עבודה',      price:0, notes:'', category_id:2,  selected:false, status:'pending', model:'', contact_name:'', contact_phone:'', appointment:'', quotes:[] },
      { id:34, name:'ריהוט גינה / מרפסת',            price:0, notes:'', category_id:14, selected:false, status:'pending', model:'', contact_name:'', contact_phone:'', appointment:'', quotes:[] },
      { id:35, name:'שמשייה / דשא סינתטי',           price:0, notes:'', category_id:14, selected:false, status:'pending', model:'', contact_name:'', contact_phone:'', appointment:'', quotes:[] },
      { id:36, name:'אזעקה ומצלמות אבטחה',           price:0, notes:'', category_id:16, selected:false, status:'pending', model:'', contact_name:'', contact_phone:'', appointment:'', quotes:[] },
      { id:37, name:'מנעול חכם / אינטרקום',           price:0, notes:'', category_id:16, selected:false, status:'pending', model:'', contact_name:'', contact_phone:'', appointment:'', quotes:[] },
      { id:38, name:'ריהוט ילדים',                   price:0, notes:'', category_id:15, selected:false, status:'pending', model:'', contact_name:'', contact_phone:'', appointment:'', quotes:[] },
      { id:39, name:'גדרות בטיחות / שערי מדרגות',    price:0, notes:'', category_id:15, selected:false, status:'pending', model:'', contact_name:'', contact_phone:'', appointment:'', quotes:[] },
      { id:40, name:'דוד שמש / בוילר',               price:0, notes:'', category_id:5,  selected:false, status:'pending', model:'', contact_name:'', contact_phone:'', appointment:'', quotes:[] },
    ];
    saveItems();
  }
}

function nextId(arr) { return arr.length ? Math.max(...arr.map(x => x.id)) + 1 : 1; }

// ── Sales income ──────────────────────────────────────────
function salesIncome() {
  return saleItems.filter(s => s.status === 'sold')
    .reduce((sum, s) => sum + (Number(s.soldPrice) || 0), 0);
}

function potentialSalesIncome() {
  return saleItems.filter(s => s.status === 'forsale')
    .reduce((sum, s) => sum + (Number(s.askPrice) || 0), 0);
}

// ── Tabs ──────────────────────────────────────────────────
const TAB_TITLES = {
  dashboard: '📊 לוח בקרה',
  calendar:  '📅 לוח זמנים',
  rooms:     '🚪 תכנון חדרים',
  items:     '📋 פריטים ועלויות',
  cats:      '🏷 קטגוריות',
  sales:     '💵 פריטים למכירה',
  charts:    '📈 גרפים',
  ikea:      '🛒 קניות איקאה',
};

function showTab(name) {
  document.querySelectorAll('.tab-page').forEach(p => { p.style.display = 'none'; });
  const page = document.getElementById('tab-' + name);
  if (page) page.style.display = '';
  document.querySelectorAll('.sidebar-link[data-tab]').forEach(l => l.classList.remove('active'));
  const link = document.querySelector('.sidebar-link[data-tab="' + name + '"]');
  if (link) link.classList.add('active');
  const title = document.getElementById('topbarTitle');
  if (title) title.textContent = TAB_TITLES[name] || '';
  document.getElementById('sidebar').classList.remove('open');
  if (name === 'calendar') renderCalendar();
  if (name === 'rooms' && typeof Rooms !== 'undefined') Rooms.load();
  if (name === 'cats') { renderCategoryChips(); renderRoomChips(); renderCategoryDropdown(); }
  if (name === 'sales') renderSaleItems();
  if (name === 'charts') renderCharts();
  if (name === 'ikea' && typeof Ikea !== 'undefined') Ikea.render();
}

// ── Sidebar ───────────────────────────────────────────────
function toggleSidebar() {
  document.getElementById('sidebar').classList.toggle('open');
}

// ── Toast ─────────────────────────────────────────────────
function toast(msg, type = '') {
  const c = document.getElementById('toast-container');
  const t = document.createElement('div');
  t.className = 'toast' + (type ? ' ' + type : '');
  t.textContent = msg;
  c.appendChild(t);
  setTimeout(() => t.remove(), 2800);
}

// ── Panel toggle ──────────────────────────────────────────
function togglePanel(id) {
  document.getElementById(id).classList.toggle('collapsed');
}

// ── Filter ────────────────────────────────────────────────
function setFilter(btn, filter) {
  currentFilter = filter;
  document.querySelectorAll('#tab-items .filter-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  renderItemsTable();
}

// ── Budget ────────────────────────────────────────────────
function saveBudget() {
  config.budget = Number(document.getElementById('budgetInput').value) || 0;
  saveConfig();
  updateSummary();
  toast('תקציב נשמר ✓', 'success');
  if (localStorage.getItem('mct-sync-pwd')) saveToServer();
}

// ── Summary ───────────────────────────────────────────────
function updateSummary() {
  const paid      = items.filter(i => i.status === 'paid');
  const pending   = items.filter(i => (i.status || 'pending') === 'pending');
  const paidTotal = paid.reduce((s, i) => s + (Number(i.price) || 0), 0);
  const pendTotal = pending.reduce((s, i) => s + (Number(i.price) || 0), 0);
  const allTotal  = paidTotal + pendTotal;
  const budget    = Number(config.budget) || 0;
  const income    = salesIncome();
  const effectiveBudget = budget + income;
  const remaining = effectiveBudget - allTotal;
  const pct       = effectiveBudget > 0 ? Math.min(100, Math.round((allTotal / effectiveBudget) * 100)) : 0;

  const activeCount = items.filter(i => i.status !== 'cancelled').length;
  document.getElementById('kpiTotal').textContent   = activeCount;
  document.getElementById('kpiPaid').textContent    = '₪' + fmt(paidTotal);
  document.getElementById('kpiPending').textContent = '₪' + fmt(pendTotal);
  const remEl = document.getElementById('kpiRemaining');
  remEl.textContent = (remaining < 0 ? '-' : '') + '₪' + fmt(Math.abs(remaining));
  remEl.className = 'kpi-value' + (remaining < 0 ? ' danger' : '');

  const bar = document.getElementById('progressBar');
  bar.style.width = pct + '%';
  bar.className = 'hero-progress-bar' + (pct >= 100 ? ' danger' : pct >= 80 ? ' warn' : '');
  document.getElementById('progressPct').textContent = pct + '%';
  document.getElementById('progressSpent').textContent = '₪' + fmt(allTotal) + ' הוצא';
  document.getElementById('heroTitle').textContent = '₪' + fmt(allTotal) + ' / ₪' + fmt(effectiveBudget);

  const salesRow = document.getElementById('heroSalesRow');
  if (income > 0) {
    salesRow.style.display = 'flex';
    document.getElementById('heroSalesAmount').textContent = '₪' + fmt(income);
  } else {
    salesRow.style.display = 'none';
  }

  const potential = potentialSalesIncome();
  const projRow = document.getElementById('heroProjectedRow');
  if (potential > 0) {
    projRow.style.display = 'flex';
    const projectedTotal = income + potential;
    const projectedRemaining = (budget + projectedTotal) - allTotal;
    document.getElementById('heroProjectedAmount').textContent = '₪' + fmt(projectedTotal);
    const remEl = document.getElementById('heroProjectedRemaining');
    remEl.textContent = '| יתרה: ' + (projectedRemaining < 0 ? '-' : '') + '₪' + fmt(Math.abs(projectedRemaining));
    remEl.style.color = projectedRemaining < 0 ? '#fca5a5' : '#86efac';
  } else {
    projRow.style.display = 'none';
  }

  document.getElementById('sb-paid').textContent      = '₪' + fmt(paidTotal);
  document.getElementById('sb-pending').textContent   = '₪' + fmt(pendTotal);
  document.getElementById('sb-remaining').textContent = (remaining < 0 ? '-' : '') + '₪' + fmt(Math.abs(remaining));
  document.getElementById('sb-items-count').textContent = activeCount;
  document.getElementById('sb-cats-count').textContent  = categories.length;
  const apptEl = document.getElementById('sb-appt-count');
  if (apptEl) apptEl.textContent = items.filter(i => i.appointment).length;
  const sbSalesIncome = document.getElementById('sb-sales-income');
  if (sbSalesIncome) sbSalesIncome.textContent = '₪' + fmt(income);
  const sbSalesCount = document.getElementById('sb-sales-count');
  if (sbSalesCount) sbSalesCount.textContent = saleItems.filter(s => s.status !== 'removed').length;

  renderCalendar();
  renderUpcoming();
  renderCatBreakdown();
}

function renderUpcoming() {
  const panel = document.getElementById('upcomingPanel');
  if (!panel) return;
  const now = new Date();
  const horizon = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  const upcoming = items
    .filter(i => i.appointment && new Date(i.appointment) >= now && new Date(i.appointment) <= horizon)
    .sort((a, b) => a.appointment.localeCompare(b.appointment));
  if (!upcoming.length) {
    panel.innerHTML = '<span style="font-size:.85rem;color:var(--text-muted)">אין הגעות מתוכננות בשבוע הקרוב</span>';
    return;
  }
  panel.innerHTML = upcoming.map(it => {
    const d = new Date(it.appointment);
    const days = ['א׳','ב׳','ג׳','ד׳','ה׳','ו׳','ש׳'];
    const dateStr = days[d.getDay()] + ' ' +
      d.toLocaleDateString('he-IL', { day:'2-digit', month:'2-digit' }) + ' ' +
      d.toLocaleTimeString('he-IL', { hour:'2-digit', minute:'2-digit' }) + apptEndStr(it);
    const diffH = Math.round((d - now) / 3600000);
    const urgency = diffH < 24 ? 'upcoming-today' : diffH < 72 ? 'upcoming-near' : '';
    return '<div class="upcoming-row ' + urgency + '" onclick="expandItem(' + it.id + ')">' +
      '<div class="upcoming-date">📅 ' + dateStr + '</div>' +
      '<div class="upcoming-name">' + esc(it.name) + '</div>' +
      '<span class="status-badge status-' + (it.status||'pending') + '">' + STATUS_LABEL[it.status||'pending'] + '</span>' +
      '</div>';
  }).join('');
}

function renderCatBreakdown() {
  const panel = document.getElementById('catBreakdown');
  if (!panel) return;
  if (!categories.length) { panel.innerHTML = '<span style="font-size:.85rem;color:var(--text-muted)">אין קטגוריות</span>'; return; }
  const totals = categories.map((cat, idx) => {
    const catItems = items.filter(i => i.category_id === cat.id && i.status !== 'cancelled');
    const total = catItems.reduce((s, i) => s + (Number(i.price) || 0), 0);
    return { cat, total, idx, count: catItems.length };
  }).filter(x => x.count > 0).sort((a, b) => b.total - a.total);
  if (!totals.length) { panel.innerHTML = '<span style="font-size:.85rem;color:var(--text-muted)">אין פריטים עם קטגוריות</span>'; return; }
  const maxTotal = totals[0].total || 1;
  panel.innerHTML = '<div class="cat-breakdown-list">' + totals.map(({ cat, total, idx, count }) =>
    '<div class="cat-breakdown-row">' +
      '<span class="cat-chip ' + CAT_COLORS[idx % CAT_COLORS.length] + '" style="min-width:0">' + esc(cat.name) + '</span>' +
      '<div class="cat-bar-wrap"><div class="cat-bar" style="width:' + Math.round((total/maxTotal)*100) + '%"></div></div>' +
      '<span class="cat-breakdown-val">₪' + fmt(total) + '</span>' +
      '<span class="cat-breakdown-count">' + count + ' פריטים</span>' +
    '</div>'
  ).join('') + '</div>';
}

function fmt(n) {
  return Number(n).toLocaleString('he-IL', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

// Use local date parts — toISOString() converts to UTC which is off by one in UTC+2/+3
function localDateStr(d) {
  return d.getFullYear() + '-' +
    String(d.getMonth() + 1).padStart(2, '0') + '-' +
    String(d.getDate()).padStart(2, '0');
}

// ── Categories ────────────────────────────────────────────
function renderRoomChips() {
  const wrap = document.getElementById('roomChips');
  if (!wrap) return;
  wrap.innerHTML = '';
  ROOM_PRESETS.forEach((room, idx) => {
    const chip = document.createElement('span');
    chip.className = 'cat-chip room-chip-' + idx;
    chip.textContent = room;
    wrap.appendChild(chip);
  });
}

function renderCategoryChips() {
  const wrap = document.getElementById('catChips');
  wrap.innerHTML = '';
  if (!categories.length) {
    wrap.innerHTML = '<span style="font-size:.8rem;color:var(--text-muted)">אין קטגוריות עדיין</span>';
    return;
  }
  categories.forEach((cat, idx) => {
    const chip = document.createElement('span');
    chip.className = 'cat-chip ' + CAT_COLORS[idx % CAT_COLORS.length];
    chip.innerHTML = esc(cat.name) +
      ' <span class="del-chip" title="מחק" onclick="deleteCat(' + cat.id + ')">&#x2715;</span>';
    wrap.appendChild(chip);
  });
}

function deleteCat(id) {
  if (!confirm('למחוק קטגוריה?')) return;
  categories = categories.filter(c => c.id !== id);
  items.forEach(i => { if (i.category_id === id) i.category_id = null; });
  saveCategories();
  saveItems();
  renderCategoryChips();
  renderCategoryDropdown();
  renderItemsTable();
  toast('קטגוריה נמחקה');
}

function renderCategoryDropdown() {
  const sel = document.getElementById('newItemCategory');
  sel.innerHTML = '<option value="">— ללא —</option>';
  categories.forEach(cat => {
    const opt = document.createElement('option');
    opt.value = cat.id;
    opt.textContent = cat.name;
    sel.appendChild(opt);
  });
}

function addCategory() {
  const name = document.getElementById('newCatName').value.trim();
  if (!name) { toast('הזן שם קטגוריה', 'error'); return; }
  const newCat = { id: nextId(categories), name };
  categories.push(newCat);
  saveCategories();
  document.getElementById('newCatName').value = '';
  renderCategoryChips();
  renderCategoryDropdown();
  renderItemsTable();
  toast('קטגוריה נוספה ✓', 'success');
  return newCat;
}

const ROOM_PRESETS = [
  'כללי', 'חדר שינה ראשי', 'חדר ילדים', 'חדר תינוק',
  'סלון', 'מטבח', 'מרפסת', 'חדר עבודה', 'חדר אמבטיה',
];
const ROOM_OPTION_STYLES = [
  'background:#fef3c7;color:#92400e',
  'background:#e0f2fe;color:#0c4a6e',
  'background:#d1fae5;color:#065f46',
  'background:#fce7f3;color:#9d174d',
  'background:#ede9fe;color:#5b21b6',
  'background:#fef9c3;color:#713f12',
  'background:#d1fae5;color:#14532d',
  'background:#f3f4f6;color:#374151',
  'background:#cffafe;color:#155e75',
];


// Add category inline from within an item card's expanded detail
function addCatFromItem(itemId, inp) {
  const name = inp.value.trim();
  if (!name) return;
  const newCat = { id: nextId(categories), name };
  categories.push(newCat);
  saveCategories();
  patch(itemId, 'category_id', newCat.id);
  inp.value = '';
  renderCategoryChips();
  renderCategoryDropdown();
  renderItemsTable();
  toast('קטגוריה נוספה ✓', 'success');
}

// Update item category from the inline select in the card top
function patchCat(id, sel) {
  patch(id, 'category_id', sel.value ? Number(sel.value) : null);
  renderItemsTable();
}

// Update item room from the inline select in the card top
function patchRoom(id, sel) {
  patch(id, 'room', sel.value || null);
}

// ── Sort ──────────────────────────────────────────────────
function setSort(btn, sort) {
  currentSort = sort;
  document.querySelectorAll('#tab-items .sort-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  renderItemsTable();
}

function sortedItems(vis) {
  if (currentSort === 'price-desc') return [...vis].sort((a, b) => (Number(b.price)||0) - (Number(a.price)||0));
  if (currentSort === 'price-asc')  return [...vis].sort((a, b) => (Number(a.price)||0) - (Number(b.price)||0));
  if (currentSort === 'room') {
    return [...vis].sort((a, b) => {
      if (!a.room && !b.room) return 0;
      if (!a.room) return 1;
      if (!b.room) return -1;
      const ri = ROOM_PRESETS.indexOf(a.room);
      const rj = ROOM_PRESETS.indexOf(b.room);
      return (ri < 0 ? 99 : ri) - (rj < 0 ? 99 : rj);
    });
  }
  if (currentSort === 'cat') {
    return [...vis].sort((a, b) => {
      const ca = categories.find(c => c.id === a.category_id);
      const cb = categories.find(c => c.id === b.category_id);
      if (!ca && !cb) return 0;
      if (!ca) return 1;
      if (!cb) return -1;
      return (ca.name || '').localeCompare(cb.name || '', 'he');
    });
  }
  return vis;
}

// ── Items ─────────────────────────────────────────────────
function visibleItems() {
  const q = (document.getElementById('searchInput').value || '').toLowerCase();
  return items.filter(item => {
    const status = item.status || 'pending';
    if (currentFilter !== 'all' && status !== currentFilter) return false;
    if (q) {
      const hay = (item.name + ' ' + (item.notes || '')).toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });
}

const STATUS_CYCLE = ['pending', 'paid', 'cancelled'];
const STATUS_LABEL = { pending: 'ממתין', paid: 'שולם', cancelled: 'בוטל' };

// Build the quotes comparison section HTML for expanded card view
function buildQuotesHtml(item) {
  const qs = item.quotes || [];
  const prices = qs.map(q => Number(q.price) || 0).filter(p => p > 0);
  const minPrice = prices.length ? Math.min(...prices) : null;

  const rows = qs.map(q => {
    const price = Number(q.price) || 0;
    const isBest = minPrice !== null && price === minPrice && price > 0 && prices.length > 1;
    return '<div class="quote-row' + (isBest ? ' quote-best' : '') + '">' +
      '<input class="quote-supplier" type="text" value="' + esc(q.supplier || '') + '" placeholder="שם ספק / חברה"' +
        ' onblur="patchQuote(' + item.id + ',' + q.id + ',\'supplier\',this.value)" />' +
      '<div class="quote-price-wrap">' +
        '<span class="quote-curr">₪</span>' +
        '<input class="quote-price-inp" type="number" value="' + (q.price || 0) + '" min="0" placeholder="0"' +
          ' onchange="patchQuote(' + item.id + ',' + q.id + ',\'price\',Number(this.value));renderItemsTable()" />' +
      '</div>' +
      (isBest ? '<span class="quote-best-badge">⭐ הכי זול</span>' : '<span></span>') +
      '<button class="icard-btn btn-sm quote-apply-btn" onclick="applyQuote(' + item.id + ',' + q.id + ')" title="העתק מחיר לפריט">✓ הגדר</button>' +
      '<button class="icard-btn icard-del" onclick="deleteQuote(' + item.id + ',' + q.id + ')">✕</button>' +
    '</div>';
  }).join('');

  return '<div class="quotes-section">' +
    '<div class="quotes-header">🏆 השוואת הצעות מחיר</div>' +
    (rows || '<div class="quotes-empty">לחץ על ״+ הוסף הצעה״ להשוואת ספקים</div>') +
    '<button class="btn btn-ghost btn-sm" onclick="addQuote(' + item.id + ')" style="margin-top:8px">+ הוסף הצעה</button>' +
  '</div>';
}

function renderItemsTable() {
  const grid  = document.getElementById('itemsGrid');
  const empty = document.getElementById('emptyState');
  if (!grid) return;
  grid.innerHTML = '';
  const vis = sortedItems(visibleItems());
  empty.style.display = vis.length ? 'none' : 'flex';

  let lastGroup = null;

  vis.forEach(item => {
    const isExpanded = expandedRows.has(item.id);
    const status = item.status || 'pending';
    const cat = categories.find(c => c.id === item.category_id);
    const catIdx = cat ? categories.indexOf(cat) : -1;

    // ── Group header (room / category sort) ──
    if (currentSort === 'room' || currentSort === 'cat') {
      const group = currentSort === 'room'
        ? (item.room || 'ללא חדר')
        : (cat ? cat.name : 'ללא קטגוריה');
      if (group !== lastGroup) {
        const hdr = document.createElement('div');
        hdr.className = 'group-header';
        hdr.textContent = (currentSort === 'room' ? '🏠 ' : '🏷 ') + group;
        grid.appendChild(hdr);
        lastGroup = group;
      }
    }

    // ── Category chip select ──
    const colorClass = cat ? CAT_COLORS[catIdx % CAT_COLORS.length] : 'cat-unset';
    const catOpts = '<option value="" style="background:#fff;color:#78716c">ללא קטגוריה</option>' +
      categories.map((c, idx) =>
        '<option value="' + c.id + '"' + (c.id === item.category_id ? ' selected' : '') +
        ' style="' + CAT_OPTION_STYLES[idx % CAT_OPTION_STYLES.length] + '">' + esc(c.name) + '</option>'
      ).join('');
    const catSelect = '<select class="cat-chip ' + colorClass + ' inline-cat-select" onchange="patchCat(' + item.id + ',this)">' +
      catOpts + '</select>';

    // ── Room chip select ──
    const roomIdx = item.room ? ROOM_PRESETS.indexOf(item.room) : -1;
    const roomColorClass = roomIdx >= 0 ? 'room-chip-' + roomIdx : 'cat-unset';
    const roomOpts = '<option value="" style="background:#fff;color:#78716c">🏠 חדר...</option>' +
      ROOM_PRESETS.map((r, idx) =>
        '<option value="' + r + '"' + (item.room === r ? ' selected' : '') +
        ' style="' + ROOM_OPTION_STYLES[idx] + '">' + r + '</option>'
      ).join('');
    const roomSelect = '<select class="cat-chip room-chip ' + roomColorClass + ' inline-cat-select" onchange="patchRoom(' + item.id + ',this)">' +
      roomOpts + '</select>';

    // ── Card split-color background ──
    const ci         = catIdx >= 0 ? catIdx % 8 : -1;
    const cardCatBg  = ci >= 0 ? CAT_BG[ci]    : null;
    const cardCatTop = ci >= 0 ? CAT_TOP[ci]   : null;
    const cardBorder = ci >= 0 ? CAT_BORDER[ci] : null;
    const cardRoomBg  = roomIdx >= 0 ? ROOM_BG[roomIdx]  : null;
    const cardRoomTop = roomIdx >= 0 ? ROOM_TOP[roomIdx] : null;

    const dragGrip = currentSort === 'manual'
      ? '<span class="drag-handle" title="גרור לסידור">⠿</span>'
      : '';

    const apptBadge = item.appointment
      ? '<div class="appt-badge' + (isUpcoming(item.appointment) ? ' appt-soon' : '') + '">📅 ' + fmtAppt(item.appointment) + apptEndStr(item) + '</div>'
      : '';

    const phoneDisplay = item.contact_phone
      ? '<div class="icard-phone">📞 <a href="tel:' + esc(item.contact_phone) + '">' + esc(item.contact_phone) + '</a></div>'
      : '';

    const catOptsDetail = '<option value="" style="background:#fff;color:#78716c">— ללא —</option>' +
      categories.map((c, idx) =>
        '<option value="' + c.id + '"' + (c.id === item.category_id ? ' selected' : '') +
        ' style="' + CAT_OPTION_STYLES[idx % CAT_OPTION_STYLES.length] + '">' + esc(c.name) + '</option>'
      ).join('');

    const detail = isExpanded ? (
      '<div class="item-card-detail">' +
        '<div class="icard-detail-grid">' +
          '<div><label>דגם / פרט</label>' +
            '<input type="text" value="' + esc(item.model || '') + '"' +
            ' onblur="patch(' + item.id + ',\'model\',this.value)" placeholder="LG GBB61..." /></div>' +
          '<div><label>שם ספק</label>' +
            '<input type="text" value="' + esc(item.contact_name || '') + '"' +
            ' onblur="patch(' + item.id + ',\'contact_name\',this.value)" placeholder="שם" /></div>' +
          '<div class="icard-span2"><label>📞 טלפון ספק</label>' +
            '<input type="tel" class="icard-phone-input" value="' + esc(item.contact_phone || '') + '"' +
            ' onblur="patch(' + item.id + ',\'contact_phone\',this.value)" placeholder="054-0000000" /></div>' +
          '<div><label>📅 תאריך ושעת התחלה</label>' +
            '<input type="datetime-local" value="' + esc(item.appointment || '') + '"' +
            ' onchange="patch(' + item.id + ',\'appointment\',this.value);renderItemsTable()" /></div>' +
          '<div><label>🕒 שעת סיום</label>' +
            '<input type="time" value="' + esc(item.appointment_end || '') + '"' +
            ' onchange="patch(' + item.id + ',\'appointment_end\',this.value);renderItemsTable()" /></div>' +
          '<div><label>הערות</label>' +
            '<input type="text" value="' + esc(item.notes || '') + '"' +
            ' onblur="patch(' + item.id + ',\'notes\',this.value)" placeholder="הערות חופשיות..." /></div>' +
          '<div class="icard-span2"><label>קטגוריה (סוג הוצאה)</label>' +
            '<div style="display:flex;gap:6px;align-items:center;flex-wrap:wrap">' +
              '<select style="flex:1;min-width:130px" onchange="patchCat(' + item.id + ',this)">' +
              catOptsDetail + '</select>' +
              '<input type="text" class="inline-cat-add" placeholder="+ קטגוריה חדשה"' +
                ' onkeydown="if(event.key===\'Enter\')addCatFromItem(' + item.id + ',this)" />' +
            '</div></div>' +
        '</div>' +
        buildQuotesHtml(item) +
      '</div>'
    ) : '';

    const card = document.createElement('div');
    card.className = 'item-card status-card-' + status;
    card.innerHTML =
      '<div class="item-card-top">' +
        dragGrip +
        catSelect +
        '<div class="item-card-top-actions">' +
          '<button class="icard-btn" onclick="toggleExpand(' + item.id + ')">' + (isExpanded ? '▲' : '⋯') + '</button>' +
          '<button class="icard-btn icard-del" onclick="deleteItem(' + item.id + ')">🗑</button>' +
        '</div>' +
      '</div>' +
      '<div class="item-card-room">' +
        roomSelect +
      '</div>' +
      '<div class="item-card-body">' +
        '<input class="icard-name" type="text" value="' + esc(item.name) + '"' +
          ' onblur="patch(' + item.id + ',\'name\',this.value)" />' +
        '<div class="icard-price-row">' +
          '<span class="icard-curr">₪</span>' +
          '<input class="icard-price" type="number" value="' + (item.price || 0) + '" min="0"' +
            ' onchange="patch(' + item.id + ',\'price\',Number(this.value));updateSummary()" />' +
        '</div>' +
        phoneDisplay +
      '</div>' +
      '<div class="item-card-footer">' +
        '<span class="status-badge status-' + status + '" onclick="cycleStatus(' + item.id + ')" title="לחץ לשינוי">' + STATUS_LABEL[status] + '</span>' +
        apptBadge +
      '</div>' +
      detail;

    // ── Two-bar colors: category bar on top, room bar below ──
    if (cardBorder) card.style.borderColor = cardBorder;
    const topEl  = card.querySelector('.item-card-top');
    const roomEl = card.querySelector('.item-card-room');
    if (topEl  && cardCatTop)  topEl.style.background  = cardCatTop;
    if (roomEl && cardRoomBg)  roomEl.style.background = cardRoomBg;

    // ── Drag & drop (manual sort only) ──
    if (currentSort === 'manual') {
      card.setAttribute('draggable', 'true');
      card.addEventListener('dragstart', e => {
        dragSrcId = item.id;
        e.dataTransfer.effectAllowed = 'move';
        setTimeout(() => card.classList.add('dragging'), 0);
      });
      card.addEventListener('dragend', () => card.classList.remove('dragging'));
      card.addEventListener('dragover', e => { e.preventDefault(); card.classList.add('drag-over'); });
      card.addEventListener('dragleave', e => { if (!card.contains(e.relatedTarget)) card.classList.remove('drag-over'); });
      card.addEventListener('drop', e => {
        e.preventDefault();
        card.classList.remove('drag-over');
        if (dragSrcId === item.id) return;
        const srcIdx = items.findIndex(i => i.id === dragSrcId);
        const tgtIdx = items.findIndex(i => i.id === item.id);
        if (srcIdx < 0 || tgtIdx < 0) return;
        const [moved] = items.splice(srcIdx, 1);
        items.splice(tgtIdx, 0, moved);
        dragSrcId = null;
        saveItems();
        renderItemsTable();
      });
    }

    grid.appendChild(card);
  });
}

function esc(s) { return (s||'').replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;'); }

function fmtAppt(dt) {
  if (!dt) return '';
  const d = new Date(dt);
  const days = ['א׳','ב׳','ג׳','ד׳','ה׳','ו׳','ש׳'];
  return days[d.getDay()] + ' ' +
    d.toLocaleDateString('he-IL', { day:'2-digit', month:'2-digit' }) + ' ' +
    d.toLocaleTimeString('he-IL', { hour:'2-digit', minute:'2-digit' });
}

function isUpcoming(dt) {
  if (!dt) return false;
  const diff = new Date(dt) - new Date();
  return diff > 0 && diff < 3 * 24 * 60 * 60 * 1000;
}

// End of an appointment window, e.g. " – 17:30" (empty if no finish time set)
function apptEndStr(item) {
  const e = item && item.appointment_end;
  return e ? ' – ' + e : '';
}

function patch(id, key, value) {
  const item = items.find(i => i.id === id);
  if (!item) return;
  item[key] = value;
  saveItems();
  updateSummary();
}

function toggleSelect(id, checked) { patch(id, 'selected', checked); renderItemsTable(); }

function cycleStatus(id) {
  const item = items.find(i => i.id === id);
  if (!item) return;
  const cur = item.status || 'pending';
  patch(id, 'status', STATUS_CYCLE[(STATUS_CYCLE.indexOf(cur) + 1) % STATUS_CYCLE.length]);
  renderItemsTable();
}

function toggleExpand(id) {
  if (expandedRows.has(id)) { expandedRows.delete(id); } else { expandedRows.add(id); }
  renderItemsTable();
}

function deleteItem(id) {
  if (!confirm('למחוק פריט זה?')) return;
  items = items.filter(i => i.id !== id);
  expandedRows.delete(id);
  saveItems();
  renderItemsTable();
  updateSummary();
  toast('פריט נמחק');
}

function togglePhoneField() {
  const grp = document.getElementById('newPhoneGroup');
  const btn = document.getElementById('togglePhoneBtn');
  const visible = grp.style.display !== 'none';
  grp.style.display = visible ? 'none' : 'flex';
  grp.style.flexDirection = 'column';
  btn.textContent = visible ? '+ טלפון' : '− טלפון';
  if (!visible) document.getElementById('newItemPhone').focus();
}

function addItem() {
  const name  = document.getElementById('newItemName').value.trim();
  const price = Number(document.getElementById('newItemPrice').value) || 0;
  const catId = document.getElementById('newItemCategory').value ?
    Number(document.getElementById('newItemCategory').value) : null;
  const phone = document.getElementById('newItemPhone').value.trim();
  const room  = document.getElementById('newItemRoom').value || null;
  if (!name) { toast('הזן שם לפריט', 'error'); return; }

  items.push({
    id: nextId(items), name, price, currency: 'ILS',
    category_id: catId, room, notes: '', status: 'pending',
    model: '', contact_name: '', contact_phone: phone,
    appointment: '', selected: false, quotes: []
  });
  saveItems();

  document.getElementById('newItemName').value     = '';
  document.getElementById('newItemPrice').value    = '';
  document.getElementById('newItemCategory').value = '';
  document.getElementById('newItemRoom').value     = '';
  document.getElementById('newItemPhone').value    = '';
  document.getElementById('newPhoneGroup').style.display = 'none';
  document.getElementById('togglePhoneBtn').textContent  = '+ טלפון';

  renderItemsTable();
  updateSummary();
  toast('פריט נוסף ✓', 'success');
}

// ── Quotes ────────────────────────────────────────────────
function addQuote(itemId) {
  const item = items.find(i => i.id === itemId);
  if (!item) return;
  if (!item.quotes) item.quotes = [];
  item.quotes.push({ id: nextId(item.quotes), supplier: '', price: 0 });
  saveItems();
  renderItemsTable();
}

function patchQuote(itemId, quoteId, key, value) {
  const item = items.find(i => i.id === itemId);
  if (!item || !item.quotes) return;
  const q = item.quotes.find(q => q.id === quoteId);
  if (!q) return;
  q[key] = value;
  saveItems();
}

function applyQuote(itemId, quoteId) {
  const item = items.find(i => i.id === itemId);
  if (!item || !item.quotes) return;
  const q = item.quotes.find(q => q.id === quoteId);
  if (!q) return;
  item.price = q.price;
  saveItems();
  renderItemsTable();
  updateSummary();
  toast('מחיר עודכן: ₪' + fmt(q.price), 'success');
}

function deleteQuote(itemId, quoteId) {
  const item = items.find(i => i.id === itemId);
  if (!item || !item.quotes) return;
  item.quotes = item.quotes.filter(q => q.id !== quoteId);
  saveItems();
  renderItemsTable();
}

// ── CSV Export ────────────────────────────────────────────
function exportCsv() {
  const headers = ['ID','שם','מחיר','סטטוס','קטגוריה','חדר','דגם','ספק','טלפון','הערות','מועד הגעה'];
  const rows = items.map(i => {
    const cat = categories.find(c => c.id === i.category_id);
    return [
      i.id, i.name, i.price, STATUS_LABEL[i.status||'pending'],
      cat ? cat.name : '', i.room || '', i.model||'', i.contact_name||'', i.contact_phone||'', i.notes||'',
      i.appointment ? fmtAppt(i.appointment) + apptEndStr(i) : ''
    ].map(v => '"' + String(v).replace(/"/g,'""') + '"').join(',');
  });
  const blob = new Blob(['﻿' + [headers.join(','), ...rows].join('\n')], { type: 'text/csv;charset=utf-8;' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'moving-costs.csv';
  a.click();
}

// ── Calendar ──────────────────────────────────────────────
function getWeekStart(d) {
  const dt = new Date(d);
  dt.setDate(dt.getDate() - dt.getDay());
  dt.setHours(0, 0, 0, 0);
  return dt;
}

function renderCalendar() {
  const grid = document.getElementById('calGrid');
  if (!grid) return;
  if (!calWeekStart) calWeekStart = getWeekStart(new Date());

  const HEB_DAYS = ['א׳ ראשון','ב׳ שני','ג׳ שלישי','ד׳ רביעי','ה׳ חמישי','ו׳ שישי','ש׳ שבת'];
  const todayStr = localDateStr(new Date());

  const weekEnd = new Date(calWeekStart);
  weekEnd.setDate(weekEnd.getDate() + calWeekCount * 7 - 1);
  document.getElementById('calWeekLabel').textContent =
    calWeekStart.toLocaleDateString('he-IL', { day:'2-digit', month:'2-digit' }) +
    ' — ' + weekEnd.toLocaleDateString('he-IL', { day:'2-digit', month:'2-digit', year:'numeric' });

  grid.innerHTML = '';
  for (let i = 0; i < calWeekCount * 7; i++) {
    const day = new Date(calWeekStart);
    day.setDate(day.getDate() + i);
    const dayStr = localDateStr(day);
    const isToday = dayStr === todayStr;

    const dayItems = items
      .filter(it => it.appointment && it.appointment.slice(0, 10) === dayStr)
      .sort((a, b) => a.appointment.localeCompare(b.appointment));

    const col = document.createElement('div');
    col.className = 'cal-day' + (isToday ? ' cal-today' : '');

    const events = dayItems.map(it => {
      const time = new Date(it.appointment).toLocaleTimeString('he-IL', { hour:'2-digit', minute:'2-digit' });
      const endT = it.appointment_end ? '–' + it.appointment_end : '';
      const soon = isUpcoming(it.appointment);
      return '<div class="cal-event' + (soon ? ' cal-event-soon' : '') + '" onclick="expandItem(' + it.id + ')">' +
        '<span class="cal-event-time">' + time + endT + '</span>' +
        '<span class="cal-event-name">' + esc(it.name) + '</span>' +
        '<span class="cal-event-badge status-' + (it.status||'pending') + '">' + STATUS_LABEL[it.status||'pending'] + '</span>' +
        '</div>';
    }).join('');

    col.innerHTML =
      '<div class="cal-day-header">' +
        '<span class="cal-day-name">' + HEB_DAYS[i] + '</span>' +
        '<span class="cal-day-date">' + day.toLocaleDateString('he-IL', { day:'2-digit', month:'2-digit' }) + '</span>' +
      '</div>' +
      '<div class="cal-events">' + (events || '<div class="cal-empty">ריק</div>') + '</div>';

    grid.appendChild(col);
  }
}

function calPrevWeek() { calWeekStart.setDate(calWeekStart.getDate() - calWeekCount * 7); renderCalendar(); }
function calNextWeek() { calWeekStart.setDate(calWeekStart.getDate() + calWeekCount * 7); renderCalendar(); }
function calToday()    { calWeekStart = getWeekStart(new Date()); renderCalendar(); }
function calToggleWeeks() {
  calWeekCount = calWeekCount === 1 ? 2 : 1;
  const btn = document.getElementById('calToggleBtn');
  if (btn) btn.textContent = calWeekCount === 1 ? '2 שבועות ▼' : 'שבוע ▲';
  renderCalendar();
}

function expandItem(id) {
  expandedRows.add(id);
  showTab('items');
  renderItemsTable();
}

// ── Sale Items ────────────────────────────────────────────
const SALE_STATUS_CYCLE = ['forsale', 'sold', 'removed'];
const SALE_STATUS_LABEL = { forsale: 'למכירה', sold: 'נמכר', removed: 'הוסר' };

function setSaleFilter(btn, filter) {
  currentSaleFilter = filter;
  document.querySelectorAll('#tab-sales .filter-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  renderSaleItems();
}

function renderSaleItems() {
  const grid    = document.getElementById('saleGrid');
  const empty   = document.getElementById('saleEmpty');
  const summary = document.getElementById('salesSummary');
  if (!grid) return;

  const income       = salesIncome();
  const forSaleCount = saleItems.filter(s => s.status === 'forsale').length;
  const soldCount    = saleItems.filter(s => s.status === 'sold').length;

  summary.innerHTML =
    '<div class="sales-summary-row">' +
      '<div class="sale-stat"><div class="sale-stat-num">' + forSaleCount + '</div><div class="sale-stat-lbl">💰 למכירה</div></div>' +
      '<div class="sale-stat"><div class="sale-stat-num">' + soldCount    + '</div><div class="sale-stat-lbl">✅ נמכר</div></div>' +
      '<div class="sale-stat sale-stat-income"><div class="sale-stat-num">₪' + fmt(income) + '</div><div class="sale-stat-lbl">💵 הכנסות</div></div>' +
    '</div>';

  const vis = saleItems.filter(s => currentSaleFilter === 'all' || s.status === currentSaleFilter);
  grid.innerHTML = '';
  empty.style.display = vis.length ? 'none' : 'flex';

  vis.forEach(item => {
    const status = item.status || 'forsale';

    const soldPriceHtml = status === 'sold'
      ? '<div class="icard-price-row" style="margin-top:6px">' +
          '<span class="icard-curr" style="color:var(--teal);font-size:.85rem">נמכר בפועל ₪</span>' +
          '<input class="icard-price" type="number" value="' + (item.soldPrice || 0) + '" min="0"' +
            ' style="font-size:1.3rem;color:var(--teal)"' +
            ' onchange="patchSale(' + item.id + ',\'soldPrice\',Number(this.value));updateSummary()" />' +
        '</div>'
      : '';

    const notesHtml = item.notes
      ? '<span style="font-size:.75rem;color:var(--text-muted);margin-right:6px">📝 ' + esc(item.notes) + '</span>'
      : '';

    const soldBtn = status === 'forsale'
      ? '<button class="sale-got-money-btn" onclick="cycleSaleStatus(' + item.id + ')">✅ קיבלתי את הכסף!</button>'
      : '';
    const undoBtn = status === 'sold'
      ? '<button class="sale-undo-btn" onclick="undoSale(' + item.id + ')">↩ לא נמכר בסוף</button>'
      : '';

    const card = document.createElement('div');
    card.className = 'item-card sale-card-' + status;
    card.innerHTML =
      '<div class="item-card-top">' +
        '<span class="cat-chip cat-2" style="font-size:.7rem;padding:3px 10px">מבוקש ₪' + fmt(item.askPrice || 0) + '</span>' +
        '<button class="icard-btn icard-del" onclick="deleteSaleItem(' + item.id + ')">🗑</button>' +
      '</div>' +
      '<div class="item-card-body">' +
        '<input class="icard-name" type="text" value="' + esc(item.name) + '"' +
          ' onblur="patchSale(' + item.id + ',\'name\',this.value)" />' +
        '<div class="icard-price-row">' +
          '<span class="icard-curr">₪</span>' +
          '<input class="icard-price" type="number" value="' + (item.askPrice || 0) + '" min="0"' +
            ' onchange="patchSale(' + item.id + ',\'askPrice\',Number(this.value));renderSaleItems();updateSummary()" />' +
        '</div>' +
        soldPriceHtml +
      '</div>' +
      soldBtn +
      '<div class="item-card-footer">' +
        '<span class="status-badge status-' + status + '"' +
          (status === 'sold' ? ' onclick="undoSale(' + item.id + ')" title="לחץ לביטול מכירה"' : '') + '>' +
          SALE_STATUS_LABEL[status] + '</span>' +
        undoBtn +
        notesHtml +
      '</div>';

    grid.appendChild(card);
  });
}

function patchSale(id, key, value) {
  const item = saleItems.find(s => s.id === id);
  if (!item) return;
  item[key] = value;
  saveSaleItems();
}

function cycleSaleStatus(id) {
  const item = saleItems.find(s => s.id === id);
  if (!item) return;
  const cur = item.status || 'forsale';
  item.status = SALE_STATUS_CYCLE[(SALE_STATUS_CYCLE.indexOf(cur) + 1) % SALE_STATUS_CYCLE.length];
  if (item.status === 'sold' && !item.soldPrice) {
    item.soldPrice = item.askPrice || 0;
  }
  saveSaleItems();
  renderSaleItems();
  updateSummary();
}

function undoSale(id) {
  const item = saleItems.find(s => s.id === id);
  if (!item) return;
  item.status = 'forsale';
  saveSaleItems();
  renderSaleItems();
  updateSummary();
  toast('מכירה בוטלה ↩', 'info');
}

function deleteSaleItem(id) {
  if (!confirm('למחוק פריט זה?')) return;
  saleItems = saleItems.filter(s => s.id !== id);
  saveSaleItems();
  renderSaleItems();
  updateSummary();
  toast('פריט נמחק');
}

function addSaleItem() {
  const name     = document.getElementById('newSaleName').value.trim();
  const askPrice = Number(document.getElementById('newSaleAskPrice').value) || 0;
  const notes    = document.getElementById('newSaleNotes').value.trim();
  if (!name) { toast('הזן שם לפריט', 'error'); return; }

  saleItems.push({ id: nextId(saleItems), name, askPrice, soldPrice: 0, status: 'forsale', notes });
  saveSaleItems();

  document.getElementById('newSaleName').value     = '';
  document.getElementById('newSaleAskPrice').value = '';
  document.getElementById('newSaleNotes').value    = '';

  renderSaleItems();
  updateSummary();
  toast('פריט נוסף ✓', 'success');
}

// ── Export / Import JSON ──────────────────────────────────
function exportJSON() {
  const data = {
    items,
    categories,
    config,
    saleItems,
    exportedAt: new Date().toISOString()
  };
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `moving-tracker-backup-${new Date().toISOString().slice(0,10)}.json`;
  a.click();
  URL.revokeObjectURL(a.href);
  toast('גיבוי JSON הורד ✓', 'success');
}

function importJSON(event) {
  const file = event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = e => {
    try {
      const data = JSON.parse(e.target.result);
      if (data.items)      { items      = data.items;      saveItems(); }
      if (data.categories) { categories = data.categories; saveCategories(); }
      if (data.config)     { config     = data.config;     saveConfig(); }
      if (data.saleItems)  { saleItems  = data.saleItems;  saveSaleItems(); }
      renderCategoryChips();
      renderCategoryDropdown();
      renderItemsTable();
      renderSaleItems();
      updateSummary();
      document.getElementById('budgetInput').value = config.budget || '';
      toast('נתונים יובאו בהצלחה ✓', 'success');
    } catch {
      toast('שגיאה: קובץ לא תקין', 'error');
    }
    event.target.value = '';
  };
  reader.readAsText(file);
}

// ── Server Sync — load and save via the backend at /api/sync ─────────────────
// When served from the Node server (port 3456), /api/sync is relative and just works.
// From any other origin (GitHub Pages etc.) set mct-api-url in localStorage to
// point at the server, e.g. http://YOUR-SERVER-IP:3456/api/sync
const SYNC_API = localStorage.getItem('mct-api-url') ||
  (window.location.hostname.includes('github.io')
    ? 'http://178.105.148.72:3456/api/sync'
    : '/api/sync');

async function loadFromServer() {
  toast('טוען מהשרת...', 'info');
  try {
    const res = await fetch(SYNC_API);
    if (!res.ok) throw new Error(res.status);
    const data = await res.json();
    if (data.items)      { items      = data.items;      saveItems(); }
    if (data.config)     { config     = data.config;     saveConfig(); document.getElementById('budgetInput').value = config.budget || ''; }
    if (data.categories) { categories = data.categories; saveCategories(); }
    if (data.sales)      { saleItems  = data.sales;      saveSaleItems(); }
    renderCategoryChips(); renderRoomChips(); renderCategoryDropdown();
    renderItemsTable(); renderSaleItems(); updateSummary();
    toast('נטען מהשרת ✓', 'success');
  } catch (err) {
    toast('שגיאה בטעינה: ' + err.message, 'error');
  }
}

function resetSyncPassword() {
  localStorage.removeItem('mct-sync-pwd');
  toast('סיסמה נמחקה — לחץ "שמור לשרת" להזנת סיסמה חדשה', 'info');
}

async function saveToServer() {
  let pwd = localStorage.getItem('mct-sync-pwd');
  if (!pwd) {
    pwd = prompt('הכנס סיסמת סנכרון:');
    if (!pwd) return;
    localStorage.setItem('mct-sync-pwd', pwd.trim());
    pwd = pwd.trim();
  }

  toast('שומר לשרת...', 'info');
  try {
    const res = await fetch(SYNC_API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: pwd, items, config, categories, sales: saleItems }),
    });
    if (res.status === 401) {
      localStorage.removeItem('mct-sync-pwd');
      toast('סיסמה שגויה — נמחקה. לחץ שוב', 'error');
      return;
    }
    if (!res.ok) throw new Error(await res.text());
    toast('נשמר בשרת ✓', 'success');
  } catch (err) {
    toast('שגיאה: ' + err.message, 'error');
  }
}

// ── Charts ────────────────────────────────────────────────
const _charts = {};
const CHART_COLORS = ['#818cf8','#fbbf24','#34d399','#f87171','#38bdf8','#c084fc','#fb923c','#4ade80','#a78bfa','#6ee7b7','#fde68a','#fca5a5','#67e8f9','#fcd34d'];

function _mkChart(id, cfg) {
  if (_charts[id]) { _charts[id].destroy(); delete _charts[id]; }
  const el = document.getElementById(id);
  if (!el) return;
  _charts[id] = new Chart(el, cfg);
}

function renderCharts() {
  // 1. הוצאות לפי קטגוריה (donut)
  const catTotals = categories.map((cat, i) => ({
    name: cat.name,
    total: items.filter(it => it.category_id === cat.id && it.status !== 'cancelled')
                .reduce((s, it) => s + (Number(it.price) || 0), 0),
    color: CHART_COLORS[i % CHART_COLORS.length],
  })).filter(c => c.total > 0).sort((a, b) => b.total - a.total);

  _mkChart('chartCats', {
    type: 'doughnut',
    data: {
      labels: catTotals.map(c => c.name),
      datasets: [{ data: catTotals.map(c => c.total), backgroundColor: catTotals.map(c => c.color), borderWidth: 2, borderColor: '#fff' }],
    },
    options: {
      responsive: true, maintainAspectRatio: true,
      plugins: {
        legend: { position: 'bottom', labels: { font: { family: 'Inter', size: 11 }, padding: 10 } },
        tooltip: { callbacks: { label: ctx => ' ₪' + fmt(ctx.raw) } },
      },
    },
  });

  // 2. סטטוס פריטים (donut)
  const paid      = items.filter(i => i.status === 'paid').length;
  const pending   = items.filter(i => (i.status || 'pending') === 'pending').length;
  const cancelled = items.filter(i => i.status === 'cancelled').length;
  _mkChart('chartStatus', {
    type: 'doughnut',
    data: {
      labels: ['שולם', 'ממתין', 'בוטל'],
      datasets: [{ data: [paid, pending, cancelled], backgroundColor: ['#14b8a6','#f59e0b','#9ca3af'], borderWidth: 2, borderColor: '#fff' }],
    },
    options: {
      responsive: true, maintainAspectRatio: true,
      plugins: {
        legend: { position: 'bottom', labels: { font: { family: 'Inter', size: 11 }, padding: 10 } },
        tooltip: { callbacks: { label: ctx => ' ' + ctx.raw + ' פריטים' } },
      },
    },
  });

  // 3. תקציב vs הוצאות (bar אופקי)
  const paidAmt    = items.filter(i => i.status === 'paid').reduce((s, i) => s + (Number(i.price) || 0), 0);
  const pendAmt    = items.filter(i => (i.status || 'pending') === 'pending').reduce((s, i) => s + (Number(i.price) || 0), 0);
  const budget     = Number(config.budget) || 0;
  const salesAmt   = salesIncome();
  const effective  = budget + salesAmt;
  const remaining  = effective - paidAmt - pendAmt;
  _mkChart('chartBudget', {
    type: 'bar',
    data: {
      labels: ['שולם', 'ממתין לתשלום', 'יתרת תקציב', 'תקציב כולל'],
      datasets: [{
        data: [paidAmt, pendAmt, Math.max(0, remaining), effective],
        backgroundColor: ['#14b8a6','#f59e0b', remaining < 0 ? '#f87171' : '#4ade80','#818cf8'],
        borderRadius: 8, borderSkipped: false,
      }],
    },
    options: {
      indexAxis: 'y',
      responsive: true, maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: { callbacks: { label: ctx => ' ₪' + fmt(ctx.raw) } },
      },
      scales: {
        x: { ticks: { callback: v => '₪' + fmt(v), font: { family: 'Inter', size: 10 } } },
        y: { ticks: { font: { family: 'Inter', size: 11 } } },
      },
    },
  });

  // 4. מכירות (donut)
  const forSaleAmt = saleItems.filter(s => s.status === 'forsale').reduce((s, i) => s + (Number(i.askPrice) || 0), 0);
  const soldAmt    = saleItems.filter(s => s.status === 'sold').reduce((s, i) => s + (Number(i.soldPrice) || 0), 0);
  const removedCnt = saleItems.filter(s => s.status === 'removed').length;
  if (forSaleAmt + soldAmt + removedCnt > 0) {
    _mkChart('chartSales', {
      type: 'doughnut',
      data: {
        labels: ['מוצע למכירה', 'נמכר בפועל', 'הוסר'],
        datasets: [{ data: [forSaleAmt, soldAmt, removedCnt], backgroundColor: ['#f59e0b','#14b8a6','#9ca3af'], borderWidth: 2, borderColor: '#fff' }],
      },
      options: {
        responsive: true, maintainAspectRatio: true,
        plugins: {
          legend: { position: 'bottom', labels: { font: { family: 'Inter', size: 11 }, padding: 10 } },
          tooltip: { callbacks: { label: ctx => ctx.label === 'הוסר' ? ' ' + ctx.raw + ' פריטים' : ' ₪' + fmt(ctx.raw) } },
        },
      },
    });
  } else {
    if (_charts['chartSales']) { _charts['chartSales'].destroy(); delete _charts['chartSales']; }
    const el = document.getElementById('chartSales');
    if (el) el.parentElement.innerHTML = '<span style="font-size:.85rem;color:var(--text-muted)">אין נתוני מכירות עדיין</span>';
  }
}

// ── Init ──────────────────────────────────────────────────
window.addEventListener('DOMContentLoaded', () => {
  // Close button for sidebar (mobile view)
  const closeBtn = document.getElementById('closeSidebar');
  if (closeBtn) {
    closeBtn.addEventListener('click', () => {
      document.getElementById('sidebar').classList.remove('open');
    });
  }

  loadStorage();

  document.getElementById('saveBudget').addEventListener('click', saveBudget);
  document.getElementById('addCategory').addEventListener('click', addCategory);
  document.getElementById('addItem').addEventListener('click', addItem);
  document.getElementById('addSaleItem').addEventListener('click', addSaleItem);
  document.getElementById('exportCsvBtn').addEventListener('click', exportCsv);
  document.getElementById('sb-export').addEventListener('click', exportCsv);
  document.getElementById('budgetInput').value = config.budget || '';

  document.getElementById('newCatName').addEventListener('keydown', e => { if (e.key === 'Enter') addCategory(); });
  ['newItemName','newItemPrice','newItemPhone'].forEach(id => {
    document.getElementById(id).addEventListener('keydown', e => { if (e.key === 'Enter') addItem(); });
  });
  ['newSaleName','newSaleAskPrice'].forEach(id => {
    document.getElementById(id).addEventListener('keydown', e => { if (e.key === 'Enter') addSaleItem(); });
  });

  renderCategoryChips();
  renderCategoryDropdown();
  renderItemsTable();
  updateSummary();
  showTab('dashboard');
});
