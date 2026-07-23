// ikea.js — 🛒 קניות איקאה: curated IKEA Israel shopping list for the new home.
// Live prices pulled from ikea.co.il on 2026-07-23 (IKEA SALE 1–29 July 2026).
// Tick what you want → "הוסף נבחרים לפריטים שלי" pushes them into the expense tracker.
// Both Rishon LeZion (Rishonim) and Netanya (Poleg) are full-line stores — every item is carried at both.

const Ikea = (() => {
  const SALE_END = '29.07.2026';
  const PICKS_KEY = 'mct-ikea-picks';
  let picks = new Set();

  // room → one of ROOM_PRESETS in script.js
  const SECTIONS = [
    { icon: '🛏️', title: 'חדר שינה — ריהוט', room: 'חדר שינה ראשי', items: [
      { sku:'SLATTUM',  name:'מסגרת מיטה מרופדת 160×200', desc:'אפור כהה, כולל בסיס מפסי עץ', price:795,  was:1100, tag:'משתלם' },
      { sku:'BRIMNES',  name:'מיטה עם אחסון + ראש מיטה 160×200', desc:'4 מגירות ענק מתחת למיטה', price:1620, was:2220 },
      { sku:'NEIDEN',   name:'מסגרת מיטה אורן מלא 140×200', desc:'המסגרת הזולה ביותר, זוגית', price:595 },
      { sku:'VESTERÖY', name:'מזרן קפיצי כיס 160×200', desc:'קשיחות גבוהה, תמיכה טובה', price:1295, was:1695, tag:'מומלץ' },
      { sku:'ÅBYGDA',   name:'מזרן ספוג 160×200', desc:'קצף זיכרון, מזרן פתיחה טוב', price:1100, was:1495 },
      { sku:'LURÖY',    name:'בסיס מיטה מפסי עץ 160×200', desc:'אם המסגרת לא כוללת בסיס', price:200 },
      { sku:'KLEPPSTAD',name:'ארון 2 דלתות', desc:'לבן, 79×176 — הארון הזול', price:450, was:595 },
      { sku:'BRIMNES',  name:'ארון 3 דלתות', desc:'לבן, 117×190', price:795, was:1100 },
      { sku:'PAX/FORSAND', name:'ארון PAX 100×201', desc:'ניתן להתאמה אישית (ידיות בנפרד)', price:1035 },
    ]},
    { icon: '🛋️', title: 'סלון — ריהוט', room: 'סלון', items: [
      { sku:'GLOSTAD',  name:'ספה דו-מושבית', desc:'אפור כהה — הספה הזולה', price:795, tag:'משתלם' },
      { sku:'EKTORP',   name:'ספה תלת-מושבית', desc:'בז\', כיסוי כביס במכונה', price:1745, was:2545 },
      { sku:'KIVIK',    name:'ספה דו-מושבית', desc:'עמוקה ונוחה מאוד', price:1635, was:2295 },
      { sku:'KLIPPAN',  name:'ספה דו-מושבית', desc:'הקלאסיקה, כיסוי נשלף', price:1395 },
      { sku:'BILLY',    name:'ארון ספרים 80×202', desc:'לבן, הכי נמכר בעולם', price:295, was:395 },
      { sku:'BESTÅ',    name:'מערכת אחסון לטלוויזיה 60×202', desc:'לבן, עם דלתות', price:445, was:585 },
    ]},
    { icon: '🍽️', title: 'פינת אוכל', room: 'סלון', items: [
      { sku:'HÄGERNÄS', name:'שולחן + 4 כיסאות', desc:'שחור, סט שלם בקופסה', price:995, tag:'הכי משתלם' },
      { sku:'PINNTORP', name:'שולחן + 4 כיסאות', desc:'עץ מלא, מראה כפרי', price:1630 },
      { sku:'VIHALS',   name:'שולחן אוכל נפתח', desc:'לבן, 120→180 (כיסאות בנפרד)', price:395, was:545 },
      { sku:'NORDVIKEN',name:'שולחן נפתח ל-4/6 סועדים', desc:'מראה עתיק, 152→223', price:1295, was:1995 },
    ]},
    { icon: '🍳', title: 'מטבח — כלים', room: 'מטבח', items: [
      { sku:'IKEA 365+', name:'סט סירים 6 חלקים', desc:'פלדת אל-חלד, לכל הכיריים', price:150, was:195, tag:'התחלה' },
      { sku:'IKEA 365+', name:'סט סירים 9 חלקים', desc:'יותר גדלים + סוטאז\'', price:295, was:375 },
      { sku:'HEMKOMST',  name:'סט סירים + מחבת 7 חלקים', desc:'פלדת אל-חלד', price:350, was:450 },
      { sku:'IKEA 365+', name:'מחבת נון-סטיק 24 ס"מ', desc:'ציפוי מונע הידבקות', price:49, was:69 },
      { sku:'VARDAGEN',  name:'מחבת ברזל יצוק 28 ס"מ', desc:'לצלייה, מחזיק שנים', price:175 },
      { sku:'IKEA 365+', name:'סט סכו"ם 24 חלקים', desc:'ל-6 סועדים', price:125 },
      { sku:'IKEA 365+', name:'סט סכינים 3 יחידות', desc:'שף, ירקות, קילוף', price:175 },
      { sku:'IKEA 365+', name:'סט כלים (צלחות) 18 חלקים', desc:'פורצלן עמיד, ל-6', price:145, was:225 },
      { sku:'FÄRGKLAR',  name:'סט כלים 18 חלקים', desc:'צלחות + קערות, מט צבעוני', price:125, was:169 },
      { sku:'IKEA 365+', name:'כוסות זכוכית 6 יח\'', desc:'20 סל"צ', price:25 },
      { sku:'VARDAGEN',  name:'כוסות זכוכית 6 יח\'', desc:'43 סל"צ', price:35 },
    ]},
    { icon: '🌙', title: 'מצעים וטקסטיל למיטה', room: 'חדר שינה ראשי', items: [
      { sku:'ÄNGSLILJA', name:'ציפה + 2 ציפיות', desc:'כותנה, 200×220', price:95, was:145, tag:'משתלם' },
      { sku:'DOFTAKLEJA',name:'ציפה + 2 ציפיות', desc:'כותנה, דוגמה', price:145 },
      { sku:'SKOGSFRÄKEN',name:'שמיכת פוך בינונית 150×200', desc:'לכל השנה', price:175 },
      { sku:'SMÅSPORRE', name:'שמיכת פוך 150×200', desc:'דרגת חום בינונית', price:59, was:95 },
      { sku:'DVALA',     name:'סדין גומי 160×200', desc:'כותנה', price:55 },
      { sku:'ULLVIDE',   name:'סדין גומי 160×200', desc:'סאטן רך', price:75 },
    ]},
    { icon: '🪟', title: 'וילונות ושטיחים', room: 'סלון', items: [
      { sku:'BENGTA',      name:'וילון האפלה (יחידה)', desc:'האפלה מלאה, 210×300', price:65 },
      { sku:'HÄLLEBRÄCKA', name:'וילון שקוף (זוג)', desc:'לבן, 145×300', price:125, was:175 },
      { sku:'MÄSTERROT',   name:'וילון (זוג)', desc:'סינון אור קל, 145×300', price:125 },
      { sku:'TIPHEDE',     name:'שטיח אריגה שטוחה 120×180', desc:'טבעי/שחור', price:69, tag:'זול ויפה' },
      { sku:'ÄRENDE',      name:'שטיח שאגי 120×180', desc:'סיבים ארוכים, רך', price:125, was:175 },
      { sku:'LOHALS',      name:'שטיח 160×230', desc:'יוטה טבעית, לסלון', price:595 },
    ]},
    { icon: '💡', title: 'תאורה', room: 'סלון', note:'הנורות נמכרות בנפרד', items: [
      { sku:'BARLAST',  name:'מנורה עומדת 150 ס"מ', desc:'שחור/לבן — הזולה', price:49 },
      { sku:'TÅGARP',   name:'מנורה עומדת (תאורה עילית)', desc:'שחור/לבן', price:69 },
      { sku:'ÅRSTID',   name:'מנורה עומדת פליז', desc:'קלאסית ומחמיאה', price:195, was:275 },
      { sku:'HEKTAR',   name:'מנורה עומדת', desc:'אפור כהה, תעשייתית', price:295 },
      { sku:'RÖDFLIK',  name:'מנורת קריאה עומדת', desc:'לצד הספה/הכורסה', price:125, was:195 },
    ]},
    { icon: '🛁', title: 'חדר אמבטיה — מגבות', room: 'חדר אמבטיה', items: [
      { sku:'VÅGSJÖN', name:'מגבת רחצה 70×140', desc:'כותנה, מבחר צבעים', price:19, was:25, tag:'משתלם' },
      { sku:'GULVIAL', name:'מגבת רחצה 100×150', desc:'גדולה ורכה', price:49, was:75 },
      { sku:'BROKGLIM',name:'מגבת רחצה 100×150', desc:'איכות מלון', price:89 },
      { sku:'VÅGSJÖN', name:'מגבת ידיים 40×70', desc:'לכיור', price:7 },
    ]},
  ];

  // flat lookup by key
  function keyOf(sec, it) { return sec.title + '::' + it.sku + '::' + it.name; }

  function fmt(n) { return '₪' + Number(n).toLocaleString('en-US'); }

  function loadPicks() {
    try { picks = new Set(JSON.parse(localStorage.getItem(PICKS_KEY) || '[]')); }
    catch (e) { picks = new Set(); }
  }
  function savePicks() { localStorage.setItem(PICKS_KEY, JSON.stringify([...picks])); }

  function esc(t) { return String(t).replace(/[<>&"]/g, c => ({'<':'&lt;','>':'&gt;','&':'&amp;','"':'&quot;'}[c])); }

  // ── selection totals ────────────────────────────────────────────────────────
  function selection() {
    const chosen = [];
    SECTIONS.forEach(sec => sec.items.forEach(it => {
      if (picks.has(keyOf(sec, it))) chosen.push({ sec, it });
    }));
    return chosen;
  }

  function toggle(key, checked) {
    if (checked) picks.add(key); else picks.delete(key);
    savePicks();
    updateBar();
    const row = document.querySelector('.ik-row[data-key="' + cssEsc(key) + '"]');
    if (row) row.classList.toggle('ik-on', checked);
  }
  function cssEsc(s) { return s.replace(/"/g, '\\"'); }

  function updateBar() {
    const chosen = selection();
    const sum = chosen.reduce((a, c) => a + c.it.price, 0);
    const cEl = document.getElementById('ikCount');
    const tEl = document.getElementById('ikTotal');
    const btn = document.getElementById('ikAddBtn');
    if (cEl) cEl.textContent = chosen.length;
    if (tEl) tEl.textContent = fmt(sum);
    if (btn) btn.disabled = chosen.length === 0;
  }

  function clearPicks() {
    picks.clear(); savePicks();
    document.querySelectorAll('.ik-row').forEach(r => r.classList.remove('ik-on'));
    document.querySelectorAll('.ik-row input').forEach(c => { c.checked = false; });
    updateBar();
  }

  // ── push chosen items into the expense tracker (script.js globals) ───────────
  function addSelected() {
    const chosen = selection();
    if (!chosen.length) return;
    if (typeof items === 'undefined' || typeof nextId !== 'function') {
      alert('לא ניתן להוסיף כרגע'); return;
    }
    let base = nextId(items);
    chosen.forEach(({ sec, it }, i) => {
      items.push({
        id: base + i,
        name: it.sku + ' — ' + it.name,
        price: it.price,
        currency: 'ILS',
        category_id: null,
        room: sec.room,
        notes: 'IKEA' + (it.was ? ' · מחיר סייל (רגיל ' + fmt(it.was) + ')' : '') + (it.desc ? ' · ' + it.desc : ''),
        status: 'pending',
        model: it.sku,
        contact_name: '', contact_phone: '', appointment: '',
        selected: false, quotes: []
      });
    });
    saveItems();
    const n = chosen.length;
    clearPicks();
    if (typeof renderItemsTable === 'function') renderItemsTable();
    if (typeof updateSummary === 'function') updateSummary();
    if (typeof toast === 'function') toast(n + ' פריטים נוספו לרשימת הפריטים ✓', 'success');
    if (typeof showTab === 'function') showTab('items');
  }

  // ── render ──────────────────────────────────────────────────────────────────
  function render() {
    const root = document.getElementById('ikeaRoot');
    if (!root) return;
    loadPicks();

    const sectionsHtml = SECTIONS.map(sec => {
      const rows = sec.items.map(it => {
        const key = keyOf(sec, it);
        const on = picks.has(key);
        const priceHtml = (it.was ? '<span class="ik-was">' + fmt(it.was) + '</span>' : '') +
          '<span class="ik-now">' + fmt(it.price) + '</span>' +
          (it.was ? '<span class="ik-badge">מבצע</span>' : '');
        const tag = it.tag ? '<span class="ik-tag">' + esc(it.tag) + '</span>' : '';
        return '<label class="ik-row' + (on ? ' ik-on' : '') + '" data-key="' + esc(key) + '">' +
            '<input type="checkbox" ' + (on ? 'checked' : '') +
              ' onchange="Ikea.toggle(this.closest(\'.ik-row\').dataset.key, this.checked)">' +
            '<span class="ik-info"><span class="ik-name">' + esc(it.sku) + ' · ' + esc(it.name) + tag + '</span>' +
              '<span class="ik-desc">' + esc(it.desc || '') + '</span></span>' +
            '<span class="ik-price">' + priceHtml + '</span>' +
          '</label>';
      }).join('');
      const note = sec.note ? '<span class="ik-secnote">' + esc(sec.note) + '</span>' : '';
      return '<div class="ik-sec"><div class="ik-sechead"><span class="ik-secicon">' + sec.icon +
        '</span><h3>' + esc(sec.title) + '</h3><span class="ik-secroom">' + esc(sec.room) + '</span>' + note +
        '</div><div class="ik-list">' + rows + '</div></div>';
    }).join('');

    root.innerHTML = '<style>' + STYLE + '</style>' +
      '<div class="ik-hero">' +
        '<div class="ik-hero-top"><span class="ik-logo">IKEA</span>' +
          '<span class="ik-hero-title">רשימת קניות לבית החדש</span></div>' +
        '<p class="ik-hero-sub">מחירים עדכניים מ-ikea.co.il · סמנו מה שאתם רוצים והוסיפו ישירות לרשימת הפריטים והתקציב.</p>' +
        '<div class="ik-sale">🔖 מבצע IKEA SALE — המחירים המחוקים בתוקף עד <b>' + SALE_END + '</b></div>' +
        '<div class="ik-stores">📍 זמין גם בראשון לציון (הראשונים) וגם בנתניה (פולג) — שתיהן חנויות מלאות עם כל הפריטים.</div>' +
      '</div>' +
      sectionsHtml +
      '<div style="height:80px"></div>' +
      '<div class="ik-bar">' +
        '<div class="ik-bar-info"><span class="ik-bar-lbl"><span id="ikCount">0</span> פריטים נבחרו</span>' +
          '<span class="ik-bar-tot" id="ikTotal">₪0</span></div>' +
        '<div class="ik-bar-actions">' +
          '<button class="ik-btn ghost" onclick="Ikea.clear()">נקה</button>' +
          '<button class="ik-btn" id="ikAddBtn" onclick="Ikea.add()">➕ הוסף נבחרים לפריטים שלי</button>' +
        '</div>' +
      '</div>';

    updateBar();
  }

  const STYLE = `
    #ikeaRoot{padding-bottom:20px}
    .ik-hero{background:linear-gradient(135deg,#0058A3,#00437c);color:#fff;border-radius:var(--radius,14px);
      padding:20px 22px;margin-bottom:18px;box-shadow:var(--shadow)}
    .ik-hero-top{display:flex;align-items:center;gap:12px;flex-wrap:wrap}
    .ik-logo{background:#FFDB00;color:#0058A3;font-weight:800;letter-spacing:.02em;padding:3px 10px;border-radius:6px;font-size:1.1rem}
    .ik-hero-title{font-size:1.3rem;font-weight:800}
    .ik-hero-sub{margin:10px 0 0;color:#dcebf8;font-size:.9rem;max-width:70ch;line-height:1.5}
    .ik-sale{margin-top:12px;background:#FFDB00;color:#12233a;border-radius:8px;padding:8px 12px;font-weight:700;font-size:.85rem;display:inline-block}
    .ik-stores{margin-top:8px;color:#cfe4f6;font-size:.82rem}
    .ik-sec{background:var(--surface,#fff);border:1px solid var(--border,#e5ddd4);border-radius:var(--radius,14px);
      margin-bottom:14px;overflow:hidden;box-shadow:var(--shadow)}
    .ik-sechead{display:flex;align-items:center;gap:10px;padding:14px 16px;border-bottom:1px solid var(--border,#e5ddd4);
      background:var(--surface2,#f7f4f0);flex-wrap:wrap}
    .ik-secicon{font-size:1.3rem}
    .ik-sechead h3{font-size:1.02rem;font-weight:800;color:var(--text,#1c1917);margin:0}
    .ik-secroom{font-size:.72rem;font-weight:700;color:var(--accent,#d4673a);background:var(--accent-light,#fdf0ea);
      padding:2px 9px;border-radius:20px}
    .ik-secnote{font-size:.72rem;color:var(--text-muted,#78716c)}
    .ik-list{display:flex;flex-direction:column}
    .ik-row{display:grid;grid-template-columns:24px 1fr auto;gap:13px;align-items:center;padding:12px 16px;
      border-top:1px solid var(--border,#e5ddd4);cursor:pointer;transition:background .12s}
    .ik-row:first-child{border-top:none}
    .ik-row:hover{background:var(--surface2,#f7f4f0)}
    .ik-row.ik-on{background:var(--accent-light,#fdf0ea)}
    .ik-row input{width:19px;height:19px;accent-color:var(--accent,#d4673a);cursor:pointer;margin:0}
    .ik-info{display:flex;flex-direction:column;min-width:0}
    .ik-name{font-weight:700;font-size:.93rem;color:var(--text,#1c1917)}
    .ik-desc{font-size:.79rem;color:var(--text-muted,#78716c);margin-top:1px}
    .ik-tag{display:inline-block;background:#0d9488;color:#fff;font-size:.64rem;font-weight:800;padding:1px 7px;
      border-radius:20px;margin-inline-start:7px;vertical-align:middle}
    .ik-price{text-align:left;white-space:nowrap;display:flex;flex-direction:column;align-items:flex-start}
    .ik-now{font-weight:800;font-size:1rem;color:var(--text,#1c1917)}
    .ik-was{color:var(--text-muted,#a8a29e);text-decoration:line-through;font-size:.76rem}
    .ik-badge{background:#FFDB00;color:#7a5a00;font-weight:800;font-size:.62rem;padding:1px 6px;border-radius:4px;margin-top:2px}
    .ik-bar{position:sticky;bottom:0;background:var(--surface,#fff);border:1px solid var(--border,#e5ddd4);
      border-radius:var(--radius,14px);box-shadow:0 -6px 24px rgba(0,0,0,.1);padding:12px 16px;display:flex;
      align-items:center;justify-content:space-between;gap:14px;flex-wrap:wrap}
    .ik-bar-info{display:flex;flex-direction:column}
    .ik-bar-lbl{font-size:.78rem;color:var(--text-muted,#78716c);font-weight:600}
    .ik-bar-tot{font-size:1.4rem;font-weight:800;color:var(--text,#1c1917)}
    .ik-bar-actions{display:flex;gap:8px;flex-wrap:wrap}
    .ik-btn{background:var(--accent,#d4673a);color:#fff;border:none;border-radius:9px;padding:10px 16px;font-weight:700;
      font-size:.86rem;cursor:pointer;font-family:inherit}
    .ik-btn:hover{background:var(--accent2,#e8855a)}
    .ik-btn:disabled{opacity:.45;cursor:not-allowed}
    .ik-btn.ghost{background:transparent;color:var(--text-muted,#78716c);border:1px solid var(--border,#e5ddd4)}
  `;

  return { render, toggle, add: addSelected, clear: clearPicks };
})();
