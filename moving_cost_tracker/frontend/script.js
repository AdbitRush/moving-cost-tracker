// Moving Cost Tracker — localStorage, single-language

let categories = [];
let items = [];
let config = { budget: 0, currency: 'ILS' };
let currentFilter = 'all';
let expandedRows = new Set();

const CAT_COLORS = ['cat-0','cat-1','cat-2','cat-3','cat-4','cat-5','cat-6','cat-7'];

// ── Storage ───────────────────────────────────────────────
function saveItems()      { localStorage.setItem('mct-items',      JSON.stringify(items)); }
function saveCategories() { localStorage.setItem('mct-categories', JSON.stringify(categories)); }
function saveConfig()     { localStorage.setItem('mct-config',     JSON.stringify(config)); }

function loadStorage() {
  items      = JSON.parse(localStorage.getItem('mct-items')      || '[]');
  categories = JSON.parse(localStorage.getItem('mct-categories') || '[]');
  config     = JSON.parse(localStorage.getItem('mct-config')     || '{"budget":0,"currency":"ILS"}');

  if (!items.length) {
    items = [
      { id:1,  name:'מובילים (הובלה)',   price:0, notes:'', category_id:null, selected:false, status:'pending', model:'', contact_name:'', contact_phone:'' },
      { id:2,  name:'אריזות',             price:0, notes:'', category_id:null, selected:false, status:'pending', model:'', contact_name:'', contact_phone:'' },
      { id:3,  name:'מקרר',              price:0, notes:'', category_id:null, selected:false, status:'pending', model:'', contact_name:'', contact_phone:'' },
      { id:4,  name:'מדיח',              price:0, notes:'', category_id:null, selected:false, status:'pending', model:'', contact_name:'', contact_phone:'' },
      { id:5,  name:'תנור',              price:0, notes:'', category_id:null, selected:false, status:'pending', model:'', contact_name:'', contact_phone:'' },
      { id:6,  name:'מיטה',              price:0, notes:'', category_id:null, selected:false, status:'pending', model:'', contact_name:'', contact_phone:'' },
      { id:7,  name:'ספה',               price:0, notes:'', category_id:null, selected:false, status:'pending', model:'', contact_name:'', contact_phone:'' },
      { id:8,  name:'שירות ניקיון',       price:0, notes:'', category_id:null, selected:false, status:'pending', model:'', contact_name:'', contact_phone:'' },
      { id:9,  name:'דמי העברת שירותים', price:0, notes:'', category_id:null, selected:false, status:'pending', model:'', contact_name:'', contact_phone:'' },
      { id:10, name:'הוצאות שונות',       price:0, notes:'', category_id:null, selected:false, status:'pending', model:'', contact_name:'', contact_phone:'' },
    ];
    saveItems();
  }
}

function nextId(arr) { return arr.length ? Math.max(...arr.map(x => x.id)) + 1 : 1; }

// ── Sidebar ───────────────────────────────────────────────
function toggleSidebar() {
  document.getElementById('sidebar').classList.toggle('open');
}
function scrollTo(id) {
  const el = document.getElementById(id);
  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  document.getElementById('sidebar').classList.remove('open');
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
  document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  renderItemsTable();
}

// ── Budget ────────────────────────────────────────────────
function saveBudget() {
  config.budget = Number(document.getElementById('budgetInput').value) || 0;
  saveConfig();
  updateSummary();
  toast('תקציב נשמר ✓', 'success');
}

// ── Summary ───────────────────────────────────────────────
function updateSummary() {
  const paid      = items.filter(i => i.status === 'paid');
  const pending   = items.filter(i => (i.status || 'pending') === 'pending');
  const paidTotal = paid.reduce((s, i) => s + (Number(i.price) || 0), 0);
  const pendTotal = pending.reduce((s, i) => s + (Number(i.price) || 0), 0);
  const allTotal  = paidTotal + pendTotal;
  const budget    = Number(config.budget) || 0;
  const remaining = budget - allTotal;
  const pct       = budget > 0 ? Math.min(100, Math.round((allTotal / budget) * 100)) : 0;

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
  document.getElementById('heroTitle').textContent = '₪' + fmt(allTotal) + ' / ₪' + fmt(budget);

  // Sidebar stats
  document.getElementById('sb-paid').textContent      = '₪' + fmt(paidTotal);
  document.getElementById('sb-pending').textContent   = '₪' + fmt(pendTotal);
  document.getElementById('sb-remaining').textContent = (remaining < 0 ? '-' : '') + '₪' + fmt(Math.abs(remaining));
  document.getElementById('sb-items-count').textContent = activeCount;
  document.getElementById('sb-cats-count').textContent  = categories.length;
}

function fmt(n) {
  return Number(n).toLocaleString('he-IL', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

// ── Categories ────────────────────────────────────────────
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
  categories.push({ id: nextId(categories), name });
  saveCategories();
  document.getElementById('newCatName').value = '';
  renderCategoryChips();
  renderCategoryDropdown();
  toast('קטגוריה נוספה ✓', 'success');
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

function renderItemsTable() {
  const tbody = document.getElementById('itemsTbody');
  const empty = document.getElementById('emptyState');
  tbody.innerHTML = '';
  const vis = visibleItems();
  empty.style.display = vis.length ? 'none' : 'block';

  vis.forEach(item => {
    const isExpanded = expandedRows.has(item.id);
    const status = item.status || 'pending';

    const tr = document.createElement('tr');
    if (status === 'paid') tr.classList.add('selected');

    const catOpts = categories.map(c =>
      '<option value="' + c.id + '"' + (c.id === item.category_id ? ' selected' : '') + '>' +
      esc(c.name) + '</option>'
    ).join('');

    tr.innerHTML =
      '<td style="text-align:center">' +
        '<input type="checkbox"' + (item.selected ? ' checked' : '') +
        ' onchange="toggleSelect(' + item.id + ',this.checked)" /></td>' +
      '<td><input type="text" value="' + esc(item.name) + '" style="min-width:120px"' +
        ' onblur="patch(' + item.id + ',\'name\',this.value)" /></td>' +
      '<td><div class="price-cell"><span class="currency">₪</span>' +
        '<input type="number" value="' + (item.price || 0) + '" min="0" style="width:90px"' +
        ' onchange="patch(' + item.id + ',\'price\',Number(this.value));updateSummary()" /></div></td>' +
      '<td><select onchange="patch(' + item.id + ',\'category_id\',this.value?Number(this.value):null)">' +
        '<option value="">—</option>' + catOpts + '</select></td>' +
      '<td onclick="cycleStatus(' + item.id + ')" style="cursor:pointer">' +
        '<span class="status-badge status-' + status + '" title="לחץ לשינוי">' + STATUS_LABEL[status] + '</span></td>' +
      '<td style="text-align:center">' +
        '<button class="expand-btn" onclick="toggleExpand(' + item.id + ')">' + (isExpanded ? '▲' : '⋯') + '</button></td>' +
      '<td style="text-align:center">' +
        '<button class="btn btn-danger btn-sm" onclick="deleteItem(' + item.id + ')">🗑</button></td>';

    tbody.appendChild(tr);

    if (isExpanded) {
      const dtr = document.createElement('tr');
      dtr.className = 'details-row';
      dtr.innerHTML =
        '<td></td><td colspan="6"><div class="details-grid">' +
        '<div><label>דגם / פרט</label>' +
        '<input type="text" value="' + esc(item.model || '') + '"' +
        ' onblur="patch(' + item.id + ',\'model\',this.value)" placeholder="לדוגמה: LG GBB61" /></div>' +
        '<div><label>שם ספק</label>' +
        '<input type="text" value="' + esc(item.contact_name || '') + '"' +
        ' onblur="patch(' + item.id + ',\'contact_name\',this.value)" placeholder="שם" /></div>' +
        '<div><label>טלפון ספק</label>' +
        '<input type="text" value="' + esc(item.contact_phone || '') + '"' +
        ' onblur="patch(' + item.id + ',\'contact_phone\',this.value)" placeholder="050-..." /></div>' +
        '<div style="grid-column:span 3"><label>הערות</label>' +
        '<input type="text" value="' + esc(item.notes || '') + '"' +
        ' onblur="patch(' + item.id + ',\'notes\',this.value)" placeholder="הערות חופשיות..." /></div>' +
        '</div></td>';
      tbody.appendChild(dtr);
    }
  });
}

function esc(s) { return (s||'').replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;'); }

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
  if (!name) { toast('הזן שם לפריט', 'error'); return; }

  items.push({
    id: nextId(items), name, price, currency: 'ILS',
    category_id: catId, notes: '', status: 'pending',
    model: '', contact_name: '', contact_phone: phone, selected: false
  });
  saveItems();

  document.getElementById('newItemName').value     = '';
  document.getElementById('newItemPrice').value    = '';
  document.getElementById('newItemCategory').value = '';
  document.getElementById('newItemPhone').value    = '';
  document.getElementById('newPhoneGroup').style.display = 'none';
  document.getElementById('togglePhoneBtn').textContent  = '+ טלפון';

  renderItemsTable();
  updateSummary();
  toast('פריט נוסף ✓', 'success');
}

// ── CSV Export ────────────────────────────────────────────
function exportCsv() {
  const headers = ['ID','שם','מחיר','סטטוס','קטגוריה','דגם','ספק','טלפון','הערות'];
  const rows = items.map(i => {
    const cat = categories.find(c => c.id === i.category_id);
    return [
      i.id, i.name, i.price, STATUS_LABEL[i.status||'pending'],
      cat ? cat.name : '', i.model||'', i.contact_name||'', i.contact_phone||'', i.notes||''
    ].map(v => '"' + String(v).replace(/"/g,'""') + '"').join(',');
  });
  const blob = new Blob(['﻿' + [headers.join(','), ...rows].join('\n')], { type: 'text/csv;charset=utf-8;' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'moving-costs.csv';
  a.click();
}

// ── Init ──────────────────────────────────────────────────
window.addEventListener('DOMContentLoaded', () => {
  loadStorage();

  document.getElementById('saveBudget').addEventListener('click', saveBudget);
  document.getElementById('addCategory').addEventListener('click', addCategory);
  document.getElementById('addItem').addEventListener('click', addItem);
  document.getElementById('exportCsvBtn').addEventListener('click', exportCsv);
  document.getElementById('sb-export').addEventListener('click', exportCsv);
  document.getElementById('budgetInput').value = config.budget || '';

  document.getElementById('newCatName').addEventListener('keydown', e => { if (e.key === 'Enter') addCategory(); });
  ['newItemName','newItemPrice','newItemPhone'].forEach(id => {
    document.getElementById(id).addEventListener('keydown', e => { if (e.key === 'Enter') addItem(); });
  });

  renderCategoryChips();
  renderCategoryDropdown();
  renderItemsTable();
  updateSummary();
});
