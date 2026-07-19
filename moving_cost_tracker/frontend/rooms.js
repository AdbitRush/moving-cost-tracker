// rooms.js — 🚪 תכנון חדרים: per-room planning + personal wishlists.
// Rooms are user-addable ("החדר של גלי", "החדר של נטע"…); every item records
// who asked for it, priority, and can be checked off. Server-backed (rooms.json).

const Rooms = (() => {
  let data = { rooms: [], items: [] };
  let openRoomId = null;
  let filter = 'all'; // all | open | done

  const ICONS = ['🚪','🛋️','🍳','🛏️','🛁','👶','🧸','💻','📚','🎮','🌿','🧺','🚗','🐕'];
  const PRIO = { high: { he: 'חובה', cls: 'rp-high' }, normal: { he: 'רגיל', cls: 'rp-normal' }, low: { he: 'אם יוצא', cls: 'rp-low' } };

  async function api(url, method = 'GET', body) {
    const opt = { method, headers: { 'Content-Type': 'application/json' } };
    if (body) opt.body = JSON.stringify(body);
    const r = await fetch(url, opt);
    if (!r.ok) throw new Error((await r.json().catch(() => ({}))).error || r.status);
    return r.json();
  }

  async function load() {
    try { data = await api('/api/rooms'); } catch (e) { console.error('rooms load', e); }
    render();
    const badge = document.getElementById('sb-rooms-count');
    if (badge) badge.textContent = data.items.filter(i => !i.done).length;
  }

  function esc(t) { return String(t).replace(/[<>&"]/g, c => ({'<':'&lt;','>':'&gt;','&':'&amp;','"':'&quot;'}[c])); }

  function roomStats(id) {
    const its = data.items.filter(i => i.roomId === id);
    return { total: its.length, done: its.filter(i => i.done).length };
  }

  // ── Rendering ──────────────────────────────────────────────────────────────

  function render() {
    const root = document.getElementById('roomsRoot');
    if (!root) return;
    root.innerHTML = `<style>
      .rm-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:14px;margin-bottom:18px}
      .rm-card{background:var(--panel-bg,#141a2e);border:1px solid var(--panel-border,#2a3352);border-radius:16px;
        padding:18px;cursor:pointer;text-align:center;transition:transform .15s,border-color .15s;position:relative}
      .rm-card:hover{transform:translateY(-3px);border-color:#d4a94e}
      .rm-card.rm-open{border-color:#d4a94e;box-shadow:0 0 0 1px #d4a94e}
      .rm-icon{font-size:2.4rem;margin-bottom:6px}
      .rm-name{font-weight:800;font-size:1.05rem}
      .rm-owner{font-size:.75rem;color:#d4a94e;min-height:1em}
      .rm-progress{height:6px;border-radius:4px;background:rgba(255,255,255,.08);margin-top:10px;overflow:hidden}
      .rm-progress>div{height:100%;background:linear-gradient(90deg,#d4a94e,#f6c048);transition:width .3s}
      .rm-count{font-size:.72rem;color:var(--text-muted,#8b93b0);margin-top:5px}
      .rm-del{position:absolute;top:8px;left:8px;background:none;border:none;color:#64708f;cursor:pointer;font-size:.85rem}
      .rm-del:hover{color:#ef4444}
      .rm-add{border:2px dashed #2a3352;background:none;display:flex;flex-direction:column;justify-content:center;min-height:130px;color:#8b93b0}
      .rm-add:hover{color:#d4a94e}
      .rm-panel{background:var(--panel-bg,#141a2e);border:1px solid #2a3352;border-radius:16px;padding:18px}
      .rm-form{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:14px}
      .rm-form input,.rm-form select{background:#0d1322;border:1px solid #2a3352;color:#e8ecf8;border-radius:10px;padding:10px 12px;font-size:.95rem}
      .rm-form input[type=text]{flex:2;min-width:160px}
      .rm-btn{background:linear-gradient(135deg,#d4a94e,#b8860b);color:#101010;font-weight:800;border:none;border-radius:10px;padding:10px 20px;cursor:pointer}
      .rm-item{display:flex;align-items:center;gap:10px;padding:10px 12px;border-bottom:1px solid rgba(255,255,255,.06)}
      .rm-item.done .rm-text{text-decoration:line-through;opacity:.45}
      .rm-check{width:22px;height:22px;accent-color:#d4a94e;cursor:pointer;flex-shrink:0}
      .rm-text{flex:1;font-size:1rem}
      .rm-by{font-size:.72rem;background:rgba(212,169,78,.15);color:#d4a94e;border-radius:20px;padding:2px 10px;white-space:nowrap}
      .rp-high{background:rgba(239,68,68,.18);color:#f87171}.rp-normal{background:rgba(96,165,250,.15);color:#93c5fd}.rp-low{background:rgba(148,163,184,.15);color:#94a3b8}
      .rm-prio{font-size:.7rem;border-radius:20px;padding:2px 9px;white-space:nowrap}
      .rm-x{background:none;border:none;color:#64708f;cursor:pointer}.rm-x:hover{color:#ef4444}
      .rm-filters{display:flex;gap:6px;margin-bottom:8px}
      .rm-f{background:none;border:1px solid #2a3352;color:#8b93b0;border-radius:20px;padding:4px 14px;cursor:pointer;font-size:.8rem}
      .rm-f.on{border-color:#d4a94e;color:#d4a94e}
      .rm-iconpick{display:flex;gap:4px;flex-wrap:wrap}
      .rm-iconpick button{background:none;border:1px solid #2a3352;border-radius:8px;font-size:1.15rem;padding:4px 7px;cursor:pointer}
      .rm-iconpick button.on{border-color:#d4a94e;background:rgba(212,169,78,.15)}
      .rm-empty{text-align:center;color:#64708f;padding:26px;font-size:.9rem}
    </style>` + renderCards() + (openRoomId ? renderRoom() : '') + renderAddRoom();
  }

  function renderCards() {
    let h = '<div class="rm-grid">';
    data.rooms.forEach(r => {
      const st = roomStats(r.id);
      const pct = st.total ? Math.round(st.done / st.total * 100) : 0;
      h += `<div class="rm-card${openRoomId === r.id ? ' rm-open' : ''}" onclick="Rooms.open(${r.id})">
        <button class="rm-del" onclick="event.stopPropagation();Rooms.delRoom(${r.id})" title="מחק חדר">✖</button>
        <div class="rm-icon">${r.icon}</div>
        <div class="rm-name">${esc(r.name)}</div>
        <div class="rm-owner">${r.owner ? '👤 ' + esc(r.owner) : ''}</div>
        <div class="rm-progress"><div style="width:${pct}%"></div></div>
        <div class="rm-count">${st.done}/${st.total} הושלמו</div>
      </div>`;
    });
    h += `<div class="rm-card rm-add" onclick="document.getElementById('rmNewName').focus()">＋<br>חדר חדש</div></div>`;
    return h;
  }

  function renderRoom() {
    const room = data.rooms.find(r => r.id === openRoomId);
    if (!room) return '';
    let items = data.items.filter(i => i.roomId === openRoomId);
    if (filter === 'open') items = items.filter(i => !i.done);
    if (filter === 'done') items = items.filter(i => i.done);
    items.sort((a, b) => (a.done - b.done) || ({high:0,normal:1,low:2}[a.priority] - {high:0,normal:1,low:2}[b.priority]));

    let h = `<div class="rm-panel" style="margin-bottom:18px">
      <h3 style="margin:0 0 12px">${room.icon} ${esc(room.name)} — רשימת משאלות</h3>
      <div class="rm-form">
        <input type="text" id="rmItemText" placeholder="מה צריך בחדר? (ספה, מנורה, שטיח…)" onkeydown="if(event.key==='Enter')Rooms.addItem()">
        <input type="text" id="rmItemBy" placeholder="מי ביקש?" style="flex:1;min-width:100px">
        <select id="rmItemPrio"><option value="high">🔴 חובה</option><option value="normal" selected>🔵 רגיל</option><option value="low">⚪ אם יוצא</option></select>
        <button class="rm-btn" onclick="Rooms.addItem()">➕ הוסף</button>
      </div>
      <div class="rm-filters">
        ${['all','open','done'].map(f => `<button class="rm-f${filter===f?' on':''}" onclick="Rooms.setFilter('${f}')">${f==='all'?'הכל':f==='open'?'פתוחים':'הושלמו'}</button>`).join('')}
      </div>`;
    if (!items.length) h += `<div class="rm-empty">אין פריטים עדיין — הוסיפו את המשאלה הראשונה 🌟</div>`;
    items.forEach(i => {
      h += `<div class="rm-item${i.done ? ' done' : ''}">
        <input type="checkbox" class="rm-check" ${i.done ? 'checked' : ''} onchange="Rooms.toggle(${i.id},this.checked)">
        <span class="rm-text">${esc(i.text)}</span>
        ${i.addedBy ? `<span class="rm-by">👤 ${esc(i.addedBy)}</span>` : ''}
        <span class="rm-prio ${PRIO[i.priority] ? PRIO[i.priority].cls : 'rp-normal'}">${PRIO[i.priority] ? PRIO[i.priority].he : ''}</span>
        <button class="rm-x" onclick="Rooms.delItem(${i.id})">🗑</button>
      </div>`;
    });
    return h + '</div>';
  }

  let pickedIcon = '🚪';
  function renderAddRoom() {
    return `<div class="rm-panel">
      <h3 style="margin:0 0 10px">➕ הוסף חדר / קטגוריה</h3>
      <div class="rm-form">
        <input type="text" id="rmNewName" placeholder="שם החדר (החדר של גלי, החדר של נטע…)" onkeydown="if(event.key==='Enter')Rooms.addRoom()">
        <input type="text" id="rmNewOwner" placeholder="של מי החדר? (רשות)" style="flex:1;min-width:110px">
        <button class="rm-btn" onclick="Rooms.addRoom()">צור חדר</button>
      </div>
      <div class="rm-iconpick" id="rmIconPick">
        ${ICONS.map(i => `<button class="${i === pickedIcon ? 'on' : ''}" onclick="Rooms.pickIcon('${i}',this)">${i}</button>`).join('')}
      </div>
    </div>`;
  }

  // ── Actions ────────────────────────────────────────────────────────────────

  function open(id) { openRoomId = openRoomId === id ? null : id; filter = 'all'; render(); }
  function setFilter(f) { filter = f; render(); }
  function pickIcon(i, btn) {
    pickedIcon = i;
    document.querySelectorAll('#rmIconPick button').forEach(b => b.classList.remove('on'));
    btn.classList.add('on');
  }

  async function addRoom() {
    const name = document.getElementById('rmNewName').value.trim();
    if (!name) return;
    const owner = document.getElementById('rmNewOwner').value.trim();
    await api('/api/rooms', 'POST', { name, owner, icon: pickedIcon });
    await load();
  }

  async function delRoom(id) {
    const st = roomStats(id);
    if (st.total && !confirm(`למחוק את החדר וכל ${st.total} הפריטים שבו?`)) return;
    await api('/api/rooms/' + id, 'DELETE');
    if (openRoomId === id) openRoomId = null;
    await load();
  }

  async function addItem() {
    const text = document.getElementById('rmItemText').value.trim();
    if (!text || !openRoomId) return;
    await api('/api/room-items', 'POST', {
      roomId: openRoomId, text,
      addedBy: document.getElementById('rmItemBy').value.trim(),
      priority: document.getElementById('rmItemPrio').value,
    });
    await load();
  }

  async function toggle(id, done) { await api('/api/room-items/' + id, 'PUT', { done }); await load(); }
  async function delItem(id) { await api('/api/room-items/' + id, 'DELETE'); await load(); }

  return { load, open, setFilter, pickIcon, addRoom, delRoom, addItem, toggle, delItem };
})();
