// Moving Cost Tracker — enhanced frontend

let categories = [];
let items = [];
let config = { budget: 0, currency: 'ILS' };
let currentFilter = 'all';
let currentLang = localStorage.getItem('mct-lang') || 'he';
let expandedRows = new Set();

const CAT_COLORS = ['cat-0','cat-1','cat-2','cat-3','cat-4','cat-5','cat-6','cat-7'];

function catColorClass(catId) {
  if (!catId) return '';
  const idx = categories.findIndex(c => c.id === catId);
  return CAT_COLORS[idx % CAT_COLORS.length] || '';
}

async function api(path, method = 'GET', data) {
  const opts = { method, headers: { 'Content-Type': 'application/json' } };
  if (data !== undefined) opts.body = JSON.stringify(data);
  const resp = await fetch(path, opts);
  if (!resp.ok) throw new Error('API ' + resp.status);
  return resp.json();
}

// ── Language ──────────────────────────────────────────────
function setLang(lang) {
  currentLang = lang;
  localStorage.setItem('mct-lang', lang);
  document.documentElement.lang = lang;
  document.documentElement.dir = lang === 'he' ? 'rtl' : 'ltr';
  document.body.classList.toggle('lang-en', lang === 'en');
  document.getElementById('btnHe').classList.toggle('active', lang === 'he');
  document.getElementById('btnEn').classList.toggle('active', lang === 'en');
  document.querySelectorAll('[data-he][data-en]').forEach(el => {
    el.textContent = el.getAttribute('data-' + lang);
  });
  renderItemsTable();
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

// ── Config ────────────────────────────────────────────────
async function loadConfig() {
  config = await api('/api/config');
  document.getElementById('budgetInput').value = config.budget || '';
  updateSummary();
}

async function saveBudget() {
  const val = Number(document.getElementById('budgetInput').value) || 0;
  config.budget = val;
  await api('/api/config', 'PUT', { budget: val });
  updateSummary();
  toast(currentLang === 'he' ? 'תקציב נשמר ✓' : 'Budget saved ✓', 'success');
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

  document.getElementById('kpiTotal').textContent    = items.filter(i => i.status !== 'cancelled').length;
  document.getElementById('kpiPaid').textContent     = '₪' + fmt(paidTotal);
  document.getElementById('kpiPending').textContent  = '₪' + fmt(pendTotal);
  const remEl = document.getElementById('kpiRemaining');
  remEl.textContent = '₪' + fmt(Math.abs(remaining));
  remEl.className = 'kpi-value ' + (remaining < 0 ? 'red' : remaining < budget * 0.2 ? 'amber' : 'green');

  const bar = document.getElementById('progressBar');
  bar.style.width = pct + '%';
  bar.className = 'progress-bar' + (pct >= 100 ? ' danger' : pct >= 80 ? ' warn' : '');
  document.getElementById('progressPct').textContent = pct + '%';
  document.getElementById('progressSpent').textContent = '₪' + fmt(allTotal) + ' ' + (currentLang === 'he' ? 'הוצא' : 'spent');
  document.getElementById('progressBudgetVal').textContent = '₪' + fmt(budget);
}

function fmt(n) {
  return Number(n).toLocaleString('he-IL', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

// ── Categories ────────────────────────────────────────────
async function loadCategories() {
  categories = await api('/api/categories');
  renderCategoryChips();
  renderCategoryDropdown();
}

function renderCategoryChips() {
  const wrap = document.getElementById('catChips');
  wrap.innerHTML = '';
  if (!categories.length) {
    wrap.innerHTML = '<span style="font-size:.8rem;color:var(--text-muted)">' +
      (currentLang === 'he' ? 'אין קטגוריות עדיין' : 'No categories yet') + '</span>';
    return;
  }
  categories.forEach((cat, idx) => {
    const chip = document.createElement('span');
    chip.className = 'cat-chip ' + CAT_COLORS[idx % CAT_COLORS.length];
    const label = cat.name_he || cat.name_en;
    chip.innerHTML = label + ' <span class="del-chip" title="' +
      (currentLang === 'he' ? 'מחק' : 'Delete') +
      '" onclick="deleteCat(' + cat.id + ')">&#x2715;</span>';
    wrap.appendChild(chip);
  });
}

async function deleteCat(id) {
  if (!confirm(currentLang === 'he' ? 'למחוק קטגוריה?' : 'Delete category?')) return;
  await api('/api/categories/' + id, 'DELETE');
  await loadCategories();
  renderItemsTable();
  toast(currentLang === 'he' ? 'קטגוריה נמחקה' : 'Category deleted');
}

function renderCategoryDropdown() {
  const sel = document.getElementById('newItemCategory');
  sel.innerHTML = '<option value="">' + (currentLang === 'he' ? '— ללא —' : '— None —') + '</option>';
  categories.forEach(cat => {
    const opt = document.createElement('option');
    opt.value = cat.id;
    opt.textContent = cat.name_he || cat.name_en;
    sel.appendChild(opt);
  });
}

async function addCategory() {
  const he = document.getElementById('newCatNameHe').value.trim();
  const en = document.getElementById('newCatNameEn').value.trim();
  if (!he && !en) {
    toast(currentLang === 'he' ? 'הזן שם קטגוריה' : 'Enter category name', 'error');
    return;
  }
  await api('/api/categories', 'POST', { name_he: he, name_en: en });
  document.getElementById('newCatNameHe').value = '';
  document.getElementById('newCatNameEn').value = '';
  await loadCategories();
  renderItemsTable();
  toast(currentLang === 'he' ? 'קטגוריה נוספה ✓' : 'Category added ✓', 'success');
}

// ── Items ─────────────────────────────────────────────────
async function loadItems() {
  items = await api('/api/items');
  renderItemsTable();
  updateSummary();
}

function visibleItems() {
  const q = (document.getElementById('searchInput').value || '').toLowerCase();
  return items.filter(item => {
    const status = item.status || 'pending';
    if (currentFilter !== 'all' && status !== currentFilter) return false;
    if (q) {
      const hay = (item.name_he + ' ' + item.name_en + ' ' + (item.notes || '')).toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });
}

const STATUS_CYCLE = ['pending', 'paid', 'cancelled'];
const STATUS_LABEL_HE = { pending: 'ממתין', paid: 'שולם', cancelled: 'בוטל' };
const STATUS_LABEL_EN = { pending: 'Pending', paid: 'Paid', cancelled: 'Cancelled' };

function statusLabel(s) {
  return currentLang === 'he' ? STATUS_LABEL_HE[s] : STATUS_LABEL_EN[s];
}

function renderItemsTable() {
  const tbody = document.getElementById('itemsTbody');
  const empty = document.getElementById('emptyState');
  tbody.innerHTML = '';
  const vis = visibleItems();
  empty.style.display = vis.length ? 'none' : 'block';

  vis.forEach(item => {
    const cat = categories.find(c => c.id === item.category_id);
    const isExpanded = expandedRows.has(item.id);
    const status = item.status || 'pending';

    const tr = document.createElement('tr');
    if (status === 'paid') tr.classList.add('selected');

    // Build category options
    const catOpts = categories.map((c, i) =>
      '<option value="' + c.id + '"' + (c.id === item.category_id ? ' selected' : '') + '>' +
      (c.name_he || c.name_en) + '</option>'
    ).join('');

    tr.innerHTML =
      '<td style="text-align:center">' +
        '<input type="checkbox"' + (item.selected ? ' checked' : '') +
        ' onchange="toggleSelect(' + item.id + ',this.checked)" /></td>' +
      '<td><input type="text" value="' + esc(item.name_he) + '" style="min-width:90px"' +
        ' onblur="patchItem(' + item.id + ',{name_he:this.value})" /></td>' +
      '<td><input type="text" value="' + esc(item.name_en) + '" style="min-width:90px"' +
        ' onblur="patchItem(' + item.id + ',{name_en:this.value})" /></td>' +
      '<td><div class="price-cell"><span class="currency">₪</span>' +
        '<input type="number" value="' + (item.price || 0) + '" min="0" style="width:80px"' +
        ' onchange="patchItem(' + item.id + ',{price:Number(this.value)});updateSummary()" /></div></td>' +
      '<td><select onchange="patchItem(' + item.id + ',{category_id:this.value?Number(this.value):null})">' +
        '<option value="">—</option>' + catOpts + '</select></td>' +
      '<td onclick="cycleStatus(' + item.id + ')" style="cursor:pointer">' +
        '<span class="status-badge status-' + status + '" title="' +
        (currentLang === 'he' ? 'לחץ לשינוי' : 'Click to change') + '">' +
        statusLabel(status) + '</span></td>' +
      '<td style="text-align:center">' +
        '<button class="expand-btn" onclick="toggleExpand(' + item.id + ',this)">' +
        (isExpanded ? '▲' : '⋯') + '</button></td>' +
      '<td style="text-align:center">' +
        '<button class="btn btn-danger btn-sm" onclick="deleteItem(' + item.id + ')">🗑</button></td>';

    tbody.appendChild(tr);

    if (isExpanded) {
      const dtr = document.createElement('tr');
      dtr.className = 'details-row';
      dtr.innerHTML =
        '<td></td><td colspan="7">' +
        '<div class="details-grid">' +
          '<div><label>' + (currentLang === 'he' ? 'דגם / פרט' : 'Model / Spec') + '</label>' +
          '<input type="text" value="' + esc(item.model || '') + '"' +
          ' onblur="patchItem(' + item.id + ',{model:this.value})"' +
          ' placeholder="' + (currentLang === 'he' ? 'לדוגמה: LG GBB61' : 'e.g. LG GBB61') + '" /></div>' +
          '<div><label>' + (currentLang === 'he' ? 'שם ספק' : 'Vendor name') + '</label>' +
          '<input type="text" value="' + esc(item.contact_name || '') + '"' +
          ' onblur="patchItem(' + item.id + ',{contact_name:this.value})"' +
          ' placeholder="' + (currentLang === 'he' ? 'שם' : 'Name') + '" /></div>' +
          '<div><label>' + (currentLang === 'he' ? 'טלפון ספק' : 'Vendor phone') + '</label>' +
          '<input type="text" value="' + esc(item.contact_phone || '') + '"' +
          ' onblur="patchItem(' + item.id + ',{contact_phone:this.value})"' +
          ' placeholder="050-..." /></div>' +
          '<div style="grid-column:span 3"><label>' + (currentLang === 'he' ? 'הערות' : 'Notes') + '</label>' +
          '<input type="text" value="' + esc(item.notes || '') + '"' +
          ' onblur="patchItem(' + item.id + ',{notes:this.value})"' +
          ' placeholder="' + (currentLang === 'he' ? 'הערות חופשיות...' : 'Free notes...') + '" /></div>' +
        '</div></td>';
      tbody.appendChild(dtr);
    }
  });
}

function esc(s) { return (s || '').replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;'); }

async function patchItem(id, patch) {
  const idx = items.findIndex(i => i.id === id);
  if (idx === -1) return;
  Object.assign(items[idx], patch);
  await api('/api/items/' + id, 'PUT', patch);
  updateSummary();
}

async function toggleSelect(id, checked) {
  await patchItem(id, { selected: checked });
  renderItemsTable();
}

async function cycleStatus(id) {
  const item = items.find(i => i.id === id);
  if (!item) return;
  const cur = item.status || 'pending';
  const next = STATUS_CYCLE[(STATUS_CYCLE.indexOf(cur) + 1) % STATUS_CYCLE.length];
  await patchItem(id, { status: next });
  renderItemsTable();
}

function toggleExpand(id) {
  if (expandedRows.has(id)) { expandedRows.delete(id); } else { expandedRows.add(id); }
  renderItemsTable();
}

async function deleteItem(id) {
  if (!confirm(currentLang === 'he' ? 'למחוק פריט זה?' : 'Delete this item?')) return;
  await api('/api/items/' + id, 'DELETE');
  items = items.filter(i => i.id !== id);
  expandedRows.delete(id);
  renderItemsTable();
  updateSummary();
  toast(currentLang === 'he' ? 'פריט נמחק' : 'Item deleted');
}

async function addItem() {
  const he    = document.getElementById('newItemHe').value.trim();
  const en    = document.getElementById('newItemEn').value.trim();
  const price = Number(document.getElementById('newItemPrice').value) || 0;
  const catId = document.getElementById('newItemCategory').value ?
    Number(document.getElementById('newItemCategory').value) : null;
  if (!he && !en) {
    toast(currentLang === 'he' ? 'הזן שם לפריט' : 'Enter item name', 'error');
    return;
  }
  const newItem = await api('/api/items', 'POST', {
    name_he: he, name_en: en, price, currency: 'ILS', category_id: catId, notes: '', status: 'pending'
  });
  items.push(newItem);
  document.getElementById('newItemHe').value = '';
  document.getElementById('newItemEn').value = '';
  document.getElementById('newItemPrice').value = '';
  document.getElementById('newItemCategory').value = '';
  renderItemsTable();
  updateSummary();
  toast(currentLang === 'he' ? 'פריט נוסף ✓' : 'Item added ✓', 'success');
}

// ── CSV Export ────────────────────────────────────────────
function exportCsv() {
  const headers = ['ID','Name HE','Name EN','Price','Status','Category','Model','Contact','Phone','Notes'];
  const rows = items.map(i => {
    const cat = categories.find(c => c.id === i.category_id);
    return [
      i.id, i.name_he, i.name_en, i.price, i.status || 'pending',
      cat ? (cat.name_he || cat.name_en) : '',
      i.model || '', i.contact_name || '', i.contact_phone || '', i.notes || ''
    ].map(v => '"' + String(v).replace(/"/g, '""') + '"').join(',');
  });
  const csv = [headers.join(','), ...rows].join('\n');
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'moving-costs.csv';
  a.click();
}

// ── Init ──────────────────────────────────────────────────
window.addEventListener('DOMContentLoaded', async () => {
  setLang(currentLang);

  document.getElementById('saveBudget').addEventListener('click', saveBudget);
  document.getElementById('addCategory').addEventListener('click', addCategory);
  document.getElementById('addItem').addEventListener('click', addItem);
  document.getElementById('exportCsvBtn').addEventListener('click', exportCsv);

  ['newItemHe','newItemEn','newItemPrice'].forEach(id => {
    document.getElementById(id).addEventListener('keydown', e => { if (e.key === 'Enter') addItem(); });
  });

  await loadCategories();
  await loadItems();
  await loadConfig();
});
