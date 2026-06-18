// Frontend script for Moving Cost Tracker
// Provides CRUD for items and categories, budget handling,
// selection highlighting, and summary/progress bar.

// Global caches
let categories = [];
let items = [];
let config = { budget: 0, currency: 'ILS' };

// Helper to call REST API
async function api(path, method = 'GET', data) {
  const opts = { method, headers: { 'Content-Type': 'application/json' } };
  if (data !== undefined) opts.body = JSON.stringify(data);
  const resp = await fetch(path, opts);
  if (!resp.ok) {
    const txt = await resp.text();
    console.error('API error', resp.status, txt);
    throw new Error('API error ' + resp.status);
  }
  return resp.json();
}

// Load config (budget, currency)
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
}

// Categories ---------------------------------------------------
async function loadCategories() {
  categories = await api('/api/categories');
  renderCategoryList();
  renderCategoryDropdown();
}

function renderCategoryList() {
  const ul = document.getElementById('categoryList');
  ul.innerHTML = '';
  categories.forEach(cat => {
    const li = document.createElement('li');
    li.textContent = `${cat.name_he} / ${cat.name_en}`;
    const delBtn = document.createElement('button');
    delBtn.textContent = '🗑️';
    delBtn.title = 'מחיקה';
    delBtn.addEventListener('click', async () => {
      if (!confirm('למחוק את הקטגוריה? הפריטים יישארו ללא קטגוריה.')) return;
      await api(`/api/categories/${cat.id}`, 'DELETE');
      await loadCategories();
      await loadItems();
    });
    li.appendChild(delBtn);
    ul.appendChild(li);
  });
}

function renderCategoryDropdown() {
  const select = document.getElementById('newItemCategory');
  // clear
  select.innerHTML = '';
  const noneOption = document.createElement('option');
  noneOption.value = '';
  noneOption.textContent = '— ללא קטגוריה —';
  select.appendChild(noneOption);
  categories.forEach(cat => {
    const opt = document.createElement('option');
    opt.value = cat.id;
    opt.textContent = `${cat.name_he} / ${cat.name_en}`;
    select.appendChild(opt);
  });
}

async function addCategory() {
  const nameEn = document.getElementById('newCatNameEn').value.trim();
  const nameHe = document.getElementById('newCatNameHe').value.trim();
  if (!nameEn && !nameHe) { alert('הזן שם עבור הקטגוריה'); return; }
  await api('/api/categories', 'POST', { name_en: nameEn, name_he: nameHe });
  document.getElementById('newCatNameEn').value = '';
  document.getElementById('newCatNameHe').value = '';
  await loadCategories();
}

// Items --------------------------------------------------------
async function loadItems() {
  items = await api('/api/items');
  renderItemsTable();
  updateSummary();
}

function renderItemsTable() {
  const tbody = document.querySelector('#itemsTable tbody');
  tbody.innerHTML = '';
  items.forEach(item => {
    const tr = document.createElement('tr');
    if (item.selected) tr.classList.add('selected');

    // Checkbox cell
    const tdCheck = document.createElement('td');
    const chk = document.createElement('input');
    chk.type = 'checkbox';
    chk.checked = !!item.selected;
    chk.addEventListener('change', async () => {
      await api(`/api/items/${item.id}`, 'PUT', { selected: chk.checked });
      item.selected = chk.checked;
      if (chk.checked) tr.classList.add('selected'); else tr.classList.remove('selected');
      updateSummary();
    });
    tdCheck.appendChild(chk);
    tr.appendChild(tdCheck);

    // EN name (readonly)
    const tdEn = document.createElement('td');
    tdEn.textContent = item.name_en;
    tr.appendChild(tdEn);

    // HE name (readonly)
    const tdHe = document.createElement('td');
    tdHe.textContent = item.name_he;
    tr.appendChild(tdHe);

    // Price input
    const tdPrice = document.createElement('td');
    const priceInp = document.createElement('input');
    priceInp.type = 'number';
    priceInp.min = '0';
    priceInp.value = item.price;
    priceInp.style.width = '80px';
    priceInp.addEventListener('change', async () => {
      const newPrice = Number(priceInp.value) || 0;
      await api(`/api/items/${item.id}`, 'PUT', { price: newPrice });
      item.price = newPrice;
      updateSummary();
    });
    tdPrice.appendChild(priceInp);
    tr.appendChild(tdPrice);

    // Category selector
    const tdCat = document.createElement('td');
    const catSelect = document.createElement('select');
    const emptyOpt = document.createElement('option');
    emptyOpt.value = '';
    emptyOpt.textContent = '—';
    catSelect.appendChild(emptyOpt);
    categories.forEach(cat => {
      const opt = document.createElement('option');
      opt.value = cat.id;
      opt.textContent = `${cat.name_he}/${cat.name_en}`;
      catSelect.appendChild(opt);
    });
    catSelect.value = item.category_id || '';
    catSelect.addEventListener('change', async () => {
      const newCatId = catSelect.value ? Number(catSelect.value) : null;
      await api(`/api/items/${item.id}`, 'PUT', { category_id: newCatId });
      item.category_id = newCatId;
      updateSummary();
    });
    tdCat.appendChild(catSelect);
    tr.appendChild(tdCat);

    // Notes textarea
    const tdNotes = document.createElement('td');
    const notesArea = document.createElement('textarea');
    notesArea.value = item.notes || '';
    notesArea.rows = 2;
    notesArea.cols = 20;
    notesArea.addEventListener('blur', async () => {
      if (notesArea.value !== item.notes) {
        await api(`/api/items/${item.id}`, 'PUT', { notes: notesArea.value });
        item.notes = notesArea.value;
      }
    });
    tdNotes.appendChild(notesArea);
    tr.appendChild(tdNotes);

    // Actions cell (delete button)
    const tdAct = document.createElement('td');
    const delBtn = document.createElement('button');
    delBtn.textContent = '🗑️';
    delBtn.title = 'מחיקה';
    delBtn.addEventListener('click', async () => {
      if (!confirm('למחוק את הפריט?')) return;
      await api(`/api/items/${item.id}`, 'DELETE');
      await loadItems();
    });
    tdAct.appendChild(delBtn);
    tr.appendChild(tdAct);

    tbody.appendChild(tr);
  });
}

async function addItem() {
  const nameEn = document.getElementById('newItemEn').value.trim();
  const nameHe = document.getElementById('newItemHe').value.trim();
  const price = Number(document.getElementById('newItemPrice').value) || 0;
  const catId = document.getElementById('newItemCategory').value ? Number(document.getElementById('newItemCategory').value) : null;
  if (!nameEn && !nameHe) {
    alert('הזן שם לפריט (אנגלית או עברית)');
    return;
  }
  await api('/api/items', 'POST', {
    name_en: nameEn,
    name_he: nameHe,
    price,
    currency: config.currency || 'ILS',
    category_id: catId,
    notes: ''
  });
  // clear inputs
  document.getElementById('newItemEn').value = '';
  document.getElementById('newItemHe').value = '';
  document.getElementById('newItemPrice').value = '';
  document.getElementById('newItemCategory').value = '';
  await loadItems();
}

// Summary & progress bar ---------------------------------------
function updateSummary() {
  const selectedItems = items.filter(i => i.selected);
  const total = selectedItems.reduce((sum, i) => sum + (Number(i.price) || 0), 0);
  const budget = Number(config.budget) || 0;
  const remaining = Math.max(0, budget - total);
  const percent = budget > 0 ? Math.min(100, Math.round((total / budget) * 100)) : 0;

  const summaryDiv = document.getElementById('summary');
  // Build per-category sums
  const perCat = {};
  selectedItems.forEach(i => {
    const catId = i.category_id || 'uncat';
    perCat[catId] = (perCat[catId] || 0) + (Number(i.price) || 0);
  });

  let html = `<div><strong>סה״כ נבחר:</strong> ₪${total.toFixed(2)} של תקציב ₪${budget.toFixed(2)} (${percent}%)</div>`;
  html += `<div><strong>נותר:</strong> ₪${remaining.toFixed(2)}</div>`;
  html += '<ul>';
  // Uncategorised
  if (perCat['uncat']) {
    html += `<li>⧗ ללא קטגוריה: ₪${perCat['uncat'].toFixed(2)}</li>`;
  }
  categories.forEach(cat => {
    const sum = perCat[cat.id] || 0;
    if (sum) {
      html += `<li>${cat.name_he}/${cat.name_en}: ₪${sum.toFixed(2)}</li>`;
    }
  });
  html += '</ul>';
  summaryDiv.innerHTML = html;

  const bar = document.getElementById('budgetBar');
  bar.max = 100;
  bar.value = percent;
}

// Init ---------------------------------------------------------
window.addEventListener('DOMContentLoaded', async () => {
  document.getElementById('saveBudget').addEventListener('click', saveBudget);
  document.getElementById('addCategory').addEventListener('click', addCategory);
  document.getElementById('addItem').addEventListener('click', addItem);

  await loadCategories();
  await loadItems();
  await loadConfig();
});
