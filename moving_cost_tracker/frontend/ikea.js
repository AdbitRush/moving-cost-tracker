// ikea.js — 🛒 קניות איקאה: curated IKEA Israel shopping list for the new home.
// Furniture + lights: real photo, product link, live per-store stock (Netanya/Rishon),
// and a W×H×D fit-finder ("enter the space you have → see what fits").
// Prices/data from ikea.co.il (2026-07). Stock via IKEA availability API — undocumented, degrades to a store link.
// See memory: ikea-il-data-integration (store 206=Netanya, 217=Rishon; client-id below).

const Ikea = (() => {
  const STORES = { '217': 'ראשון לציון', '206': 'נתניה' };
  const AVAIL_CLIENT = 'b6c117e5-ae61-4ef5-b4cc-e0b1e37f0631';
  const IKEA = 'https://www.ikea.com/il/he';
  const PICKS_KEY = 'mct-ikea-picks';
  const SPACE_KEY = 'mct-ikea-space';
  const STORE_KEY = 'mct-ikea-store';
  const SALE_END = '29.07.2026';

  let picks = new Set();
  let space = { w: 0, h: 0, d: 0 };
  let store = '217';
  let stock = {};          // stock[itemNo] = { '217': {msg,qty}, '206': {...} }
  let stockLoaded = false;
  let fitOnly = false;

  // ── Furniture + lights dataset (w×d×h = external cm; wExt = extended width) ──
  // img holds the IKEA CDN photo; product URL is derived from it + itemNo.
  const FURN = [
    { icon:'🚪', title:'ארונות בגדים', room:'חדר שינה ראשי', items:[
      { sku:'KLEPPSTAD', name:'ארון 2 דלתות', price:450, was:595, itemNo:'80437234', w:79, d:55, h:176, tag:'הכי זול', img:'kleppstad-wardrobe-with-2-doors-white__0733324_pe748781' },
      { sku:'KLEPPSTAD', name:'ארון 3 דלתות', price:595, was:845, itemNo:'00441758', w:117, d:55, h:176, img:'kleppstad-wardrobe-with-3-doors-white__0753594_pe748782' },
      { sku:'BRIMNES', name:'ארון 2 דלתות', price:595, was:795, itemNo:'40400478', w:78, d:50, h:190, img:'brimnes-wardrobe-with-2-doors-white__0140624_pe300605' },
      { sku:'BRIMNES', name:'ארון 3 דלתות', price:795, was:1100, itemNo:'40407922', w:117, d:50, h:190, img:'brimnes-wardrobe-with-3-doors-white__0176787_pe329567' },
      { sku:'PAX/FORSAND', name:'ארון PAX (ידיות בנפרד)', price:1035, itemNo:'s79503017', w:100, d:60, h:201, img:'pax-forsand-wardrobe-white-white__1197811_pe903757' },
    ]},
    { icon:'🛏️', title:'מיטות', room:'חדר שינה ראשי', items:[
      { sku:'SLATTUM', name:'מסגרת מיטה מרופדת 160×200', desc:'כולל בסיס מפסי עץ', price:795, was:1100, itemNo:'40571248', w:166, d:211, h:86, tag:'משתלם', img:'slattum-upholstered-bed-frame-vissle-dark-grey__1259335_pe926650' },
      { sku:'NEIDEN', name:'מסגרת מיטה אורן 140×200', price:595, itemNo:'70395239', w:147, d:205, h:70, img:'neiden-bed-frame-pine__0749131_pe745500' },
    ]},
    { icon:'🛋️', title:'ספות', room:'סלון', items:[
      { sku:'GLOSTAD', name:'ספה דו-מושבית', price:795, itemNo:'50489012', w:155, d:72, h:74, tag:'הכי זולה', img:'glostad-2-seat-sofa-knisa-dark-grey__1577178_pe1033002' },
      { sku:'GLOSTAD', name:'ספה תלת-מושבית', price:995, itemNo:'40573285', w:197, d:72, h:74, img:'glostad-3-seat-sofa-knisa-dark-grey__1234948_pe917261' },
      { sku:'KLIPPAN', name:'ספה דו-מושבית', desc:'כיסוי נשלף', price:1395, itemNo:'s79010614', w:180, d:88, h:66, img:'klippan-2-seat-sofa-vissle-grey__1576907_pe1032801' },
      { sku:'EKTORP', name:'ספה דו-מושבית', desc:'כיסוי כביס', price:1495, was:2195, itemNo:'s79509019', w:179, d:88, h:88, img:'ektorp-2-seat-sofa-karlshov-beige-multicolour__1194837_pe902083' },
      { sku:'EKTORP', name:'ספה תלת-מושבית', desc:'כיסוי כביס', price:1745, was:2545, itemNo:'s99509004', w:218, d:88, h:88, img:'ektorp-3-seat-sofa-karlshov-beige-multicolour__1194859_pe902109' },
      { sku:'KIVIK', name:'ספה דו-מושבית', desc:'עמוקה ונוחה', price:1635, was:2295, itemNo:'s19482819', w:190, d:95, h:83, img:'kivik-2-seat-sofa-tresund-light-beige__1577606_pe1033354' },
    ]},
    { icon:'🍽️', title:'שולחנות אוכל', room:'סלון', items:[
      { sku:'VIHALS', name:'שולחן נפתח', desc:'נפתח ל-180 ס"מ', price:395, was:545, itemNo:'20589777', w:120, wExt:180, d:70, h:74, img:'vihals-extendable-table-white__1370472_pe958745' },
      { sku:'LISABO', name:'שולחן', desc:'פורניר מילה', price:695, was:895, itemNo:'70294339', w:140, d:78, h:74, img:'lisabo-table-ash-veneer__0737105_pe740883' },
      { sku:'PINNTORP', name:'שולחן + 4 כיסאות', price:1630, itemNo:'s89564449', w:125, d:75, h:75, tag:'סט שלם', img:'pinntorp-table-and-4-chairs-light-brown-stained-white-stained-light-brown-stained__1301604_pe937493' },
    ]},
    { icon:'🪑', title:'כיסאות לפינת אוכל', room:'סלון', items:[
      { sku:'SANDSBERG', name:'כיסא', desc:'עץ, קומפקטי', price:69, itemNo:'10605424', tag:'הכי זול', img:'sandsberg-chair-white__1390727_pe965548' },
      { sku:'KÄTTIL', name:'כיסא מרופד', price:225, was:295, itemNo:'60500325', img:'kaettil-chair-white-knisa-light-grey__1016338_pe830329' },
      { sku:'TOBIAS', name:'כיסא שקוף', desc:'עיצוב מודרני', price:450, itemNo:'80349671', img:'tobias-chair-transparent-chrome-plated__0727342_pe735614' },
    ]},
    { icon:'📺', title:'אחסון וסלון', room:'סלון', items:[
      { sku:'BESTÅ', name:'יחידת טלוויזיה', price:445, was:585, itemNo:'70299879', w:180, d:40, h:64, img:'besta-tv-bench-white__0377001_pe516832' },
      { sku:'BILLY', name:'ארון ספרים 80 ס"מ', price:295, was:395, itemNo:'00263850', w:80, d:28, h:202, tag:'קלאסיקה', img:'billy-bookcase-white__0625599_pe692385' },
      { sku:'BILLY', name:'ארון ספרים 40 ס"מ', price:225, was:295, itemNo:'50263838', w:40, d:28, h:202, img:'billy-bookcase-white__0644260_pe702536' },
    ]},
    { icon:'🟫', title:'שטיחים', room:'סלון', note:'רוחב×אורך — הזינו את שטח הרצפה ברוחב+עומק', items:[
      { sku:'TIPHEDE', name:'שטיח אריגה שטוחה', desc:'טבעי/שחור', price:69, itemNo:'40456757', w:120, d:180, h:0, tag:'זול ויפה', img:'tiphede-rug-flatwoven-natural-black__0772066_pe755879' },
      { sku:'STARREKLINTE', name:'שטיח אריגה שטוחה', price:145, itemNo:'20569133', w:120, d:180, h:0, img:'starreklinte-rug-flatwoven-natural-black__1205718_pe907217' },
      { sku:'LOHALS', name:'שטיח יוטה גדול', price:595, itemNo:'50277393', w:160, d:230, h:0, img:'lohals-rug-flatwoven-natural__0280221_pe419173' },
    ]},
    { icon:'💡', title:'תאורה — מנורות עומדות', room:'סלון', note:'הנורות נמכרות בנפרד', items:[
      { sku:'BARLAST', name:'מנורה עומדת', price:49, itemNo:'10430368', w:25, d:25, h:150, tag:'הכי זולה', img:'barlast-floor-lamp-black-white__0957676_pe805130' },
      { sku:'TÅGARP', name:'מנורה עומדת (תאורה עילית)', price:69, itemNo:'20404095', w:28, d:20, h:175, img:'tagarp-floor-uplighter-black-white__0810840_pe771436' },
      { sku:'LAUTERS', name:'מנורה עומדת עץ מילה', price:195, was:295, itemNo:'30405042', w:28, d:28, h:141, img:'lauters-floor-lamp-ash-white__0663863_pe712536' },
      { sku:'ÅRSTID', name:'מנורה עומדת פליז', price:195, was:275, itemNo:'00321317', w:28, d:28, h:156, img:'arstid-floor-lamp-brass-white__0390610_pe566328' },
      { sku:'HEKTAR', name:'מנורה עומדת', desc:'תעשייתית', price:295, itemNo:'00215307', w:30, d:30, h:181, img:'hektar-floor-lamp-dark-grey__0149974_pe308131' },
    ]},
  ];

  // ── Consumables (photo + link + live stock; size shown where relevant, no fit) ──
  const CONSUM = [
    { icon:'🍳', title:'מטבח — כלים', room:'מטבח', items:[
      { sku:'IKEA 365+', name:'סט סירים 6 חלקים', desc:'פלדת אל-חלד', price:150, was:195, itemNo:'80484329', img:'ikea-365-cookware-set-of-6-stainless-steel__1006151_pe825738' },
      { sku:'IKEA 365+', name:'מחבת 24 ס"מ', desc:'פלדת אל-חלד', price:59, was:79, itemNo:'20582733', img:'ikea-365-frying-pan-stainless-steel__1257430_pe925809' },
      { sku:'FÄRGKLAR', name:'סט כלים 18 חלקים', desc:'צלחות + קערות ל-6', price:125, was:169, itemNo:'80564689', img:'faergklar-18-piece-service-matt-light-turquoise__1188584_pe899529' },
      { sku:'IKEA 365+', name:'כוס זכוכית', desc:'נמכרת ביחידה', price:5, itemNo:'60279711', img:'ikea-365-glass-clear-glass__0928963_pe790099' },
    ]},
    { icon:'🌙', title:'מצעים', room:'חדר שינה ראשי', items:[
      { sku:'ÄNGSLILJA', name:'ציפה + 2 ציפיות', size:'200×220', price:95, was:145, itemNo:'20592534', tag:'משתלם', img:'aengslilja-duvet-cover-and-2-pillowcases-grey-green__1316055_pe940620' },
      { sku:'DVALA', name:'סדין גומי', size:'160×200', price:55, itemNo:'70621143', img:'dvala-fitted-sheet-white__0604085_pe681026' },
    ]},
    { icon:'🪟', title:'וילונות', room:'סלון', items:[
      { sku:'BENGTA', name:'וילון האפלה (יחידה)', size:'210×300', price:65, itemNo:'00602162', img:'bengta-block-out-curtain-1-piece-light-pink-with-heading-tape__1341510_pe948773' },
      { sku:'STENFRÖ', name:'וילון שקוף', size:'300×300', price:125, itemNo:'10597706', img:'stenfroe-sheer-curtain-1-piece-white-with-heading-tape__1320508_pe941259' },
      { sku:'LILL', name:'וילון רשת (זוג)', size:'280×300', price:19, itemNo:'10070262', tag:'הכי זול', img:'lill-net-curtains-1-pair-white-with-rod-pocket__0598717_pe677784' },
    ]},
    { icon:'🛁', title:'מגבות', room:'חדר אמבטיה', items:[
      { sku:'VÅGSJÖN', name:'מגבת רחצה', size:'70×140', price:19, was:25, itemNo:'20609134', img:'vagsjoen-bath-towel-dark-grey__0604997_pe681580' },
    ]},
    { icon:'🪞', title:'מראות', room:'כללי', items:[
      { sku:'NISSEDAL', name:'מראה', size:'65×150', price:345, itemNo:'80605487', img:'nissedal-mirror-white__0637799_pe698595' },
      { sku:'LINDBYN', name:'מראה', size:'60×170', price:450, itemNo:'80597232', img:'lindbyn-mirror-black__1374978_pe960159' },
      { sku:'HOVET', name:'מראה גדולה', size:'78×196', price:695, itemNo:'70515915', img:'hovet-mirror-black__1100010_pe866038' },
    ]},
  ];

  // ── helpers ──
  function fmt(n){ return '₪' + Number(n).toLocaleString('en-US'); }
  function esc(t){ return String(t).replace(/[<>&"]/g,c=>({'<':'&lt;','>':'&gt;','&':'&amp;','"':'&quot;'}[c])); }
  function photo(it){ return it.img ? IKEA+'/images/products/'+it.img+'_s5.jpg' : ''; }
  function prodUrl(it){ const slug = it.img ? it.img.split('__')[0] : ''; return slug ? IKEA+'/p/'+slug+'-'+it.itemNo+'/' : IKEA+'/search/?q='+encodeURIComponent(it.sku); }
  function keyOf(sec,it){ return sec.title+'::'+it.sku+'::'+it.name; }
  function allItems(){ const a=[]; FURN.concat(CONSUM).forEach(s=>s.items.forEach(it=>a.push({sec:s,it}))); return a; }

  function loadState(){
    try{ picks=new Set(JSON.parse(localStorage.getItem(PICKS_KEY)||'[]')); }catch(e){ picks=new Set(); }
    try{ space=Object.assign({w:0,h:0,d:0}, JSON.parse(localStorage.getItem(SPACE_KEY)||'{}')); }catch(e){}
    store = localStorage.getItem(STORE_KEY) || '217';
    if(!STORES[store]) store='217';
  }
  const saveP=()=>localStorage.setItem(PICKS_KEY,JSON.stringify([...picks]));
  const saveS=()=>localStorage.setItem(SPACE_KEY,JSON.stringify(space));

  // ── fit check ──
  function fit(it){
    if(!it.w) return null;               // non-sized item
    if(!space.w && !space.h && !space.d) return null; // no space entered
    const bad=[];
    if(space.w && it.w>space.w) bad.push('רוחב');
    if(space.d && it.d>space.d) bad.push('עומק');
    if(space.h && it.h>space.h) bad.push('גובה');
    return { ok:bad.length===0, bad };
  }

  // ── live stock ──
  async function loadStock(){
    const nums=[]; FURN.concat(CONSUM).forEach(s=>s.items.forEach(it=>{ if(/^\d+$/.test(it.itemNo)) nums.push(it.itemNo); }));
    try{
      const res=await fetch('https://api.ingka.ikea.com/cia/availabilities/ru/il?itemNos='+nums.join(',')+'&expand=StoresList',
        {headers:{'x-client-id':AVAIL_CLIENT,'Accept':'application/json;version=2'}});
      if(!res.ok) throw new Error(res.status);
      const j=await res.json();
      (j.availabilities||[]).forEach(a=>{
        const item=a.itemKey&&a.itemKey.itemNo, code=a.classUnitKey&&a.classUnitKey.classUnitCode;
        if(!item||!STORES[code]) return;
        const cc=a.buyingOption&&a.buyingOption.cashCarry&&a.buyingOption.cashCarry.availability;
        const msg=cc&&cc.probability&&cc.probability.thisDay&&cc.probability.thisDay.messageType;
        (stock[item]=stock[item]||{})[code]={ msg, qty: cc&&cc.quantity };
      });
    }catch(e){ /* graceful: cards show a store link */ }
    stockLoaded=true;
  }

  function stockBadge(it){
    if(!/^\d+$/.test(it.itemNo)) return '<a class="ik-stocklink" href="'+prodUrl(it)+'" target="_blank" rel="noopener">בדקו בחנות ↗</a>';
    if(!stockLoaded) return '<span class="ik-stk ik-stk-load">בודק מלאי…</span>';
    const s=stock[it.itemNo]&&stock[it.itemNo][store];
    if(!s||!s.msg) return '<a class="ik-stocklink" href="'+prodUrl(it)+'" target="_blank" rel="noopener">בדקו בחנות ↗</a>';
    if(s.msg==='HIGH_IN_STOCK') return '<span class="ik-stk ik-stk-ok">✓ במלאי'+(s.qty?' ('+s.qty+')':'')+'</span>';
    if(s.msg==='LOW_IN_STOCK')  return '<span class="ik-stk ik-stk-low">אוזל'+(s.qty?' ('+s.qty+')':'')+'</span>';
    return '<span class="ik-stk ik-stk-out">אזל ב'+STORES[store]+'</span>';
  }

  // ── selection ──
  function selection(){ const c=[]; allItems().forEach(x=>{ if(picks.has(keyOf(x.sec,x.it))) c.push(x); }); return c; }
  function updateBar(){
    const c=selection(), sum=c.reduce((a,x)=>a+x.it.price,0);
    const el=id=>document.getElementById(id);
    if(el('ikCount')) el('ikCount').textContent=c.length;
    if(el('ikTotal')) el('ikTotal').textContent=fmt(sum);
    if(el('ikAddBtn')) el('ikAddBtn').disabled=c.length===0;
  }

  // ── public actions ──
  function toggle(key,on){ if(on)picks.add(key);else picks.delete(key); saveP(); updateBar();
    const row=document.querySelector('.ik-card[data-key="'+key.replace(/"/g,'\\"')+'"]'); if(row) row.classList.toggle('ik-on',on); }
  function setStore(code){ if(!STORES[code])return; store=code; localStorage.setItem(STORE_KEY,code); render(); }
  function setSpace(dim,val){ space[dim]=Math.max(0,parseInt(val,10)||0); saveS(); renderCards(); }
  function toggleFitOnly(v){ fitOnly=v; renderCards(); }
  function clearPicks(){ picks.clear(); saveP(); document.querySelectorAll('.ik-card.ik-on').forEach(r=>r.classList.remove('ik-on')); document.querySelectorAll('.ik-card input').forEach(c=>c.checked=false); updateBar(); }

  function addSelected(){
    const c=selection(); if(!c.length) return;
    if(typeof items==='undefined'||typeof nextId!=='function'){ alert('לא ניתן להוסיף כרגע'); return; }
    let base=nextId(items);
    c.forEach(({sec,it},i)=>{
      const dims=it.w?(' · '+it.w+'×'+it.d+'×'+it.h+' ס"מ'):'';
      items.push({ id:base+i, name:it.sku+' — '+it.name, price:it.price, currency:'ILS', category_id:null, room:sec.room,
        notes:'IKEA'+(it.was?' · מחיר סייל (רגיל '+fmt(it.was)+')':'')+dims, status:'pending', model:it.sku,
        contact_name:'', contact_phone:'', appointment:'', selected:false, quotes:[] });
    });
    saveItems(); const n=c.length; clearPicks();
    if(typeof renderItemsTable==='function') renderItemsTable();
    if(typeof updateSummary==='function') updateSummary();
    if(typeof toast==='function') toast(n+' פריטים נוספו לרשימת הפריטים ✓','success');
    if(typeof showTab==='function') showTab('items');
  }

  // ── render one card ──
  function card(sec,it){
    const key=keyOf(sec,it), on=picks.has(key), f=fit(it);
    if(fitOnly && f && !f.ok) return '';
    const priceHtml=(it.was?'<span class="ik-was">'+fmt(it.was)+'</span>':'')+'<span class="ik-now">'+fmt(it.price)+'</span>'+(it.was?'<span class="ik-badge">מבצע</span>':'');
    const tag=it.tag?'<span class="ik-tag">'+esc(it.tag)+'</span>':'';
    let dimStr='';
    if(it.w){ const p=[it.w+(it.wExt?('→'+it.wExt):'')]; if(it.d)p.push(it.d); if(it.h)p.push(it.h); dimStr='<span class="ik-dim">'+p.join('×')+' ס"מ</span>'; }
    else if(it.size){ dimStr='<span class="ik-dim">'+it.size+' ס"מ</span>'; }
    let fitHtml='';
    if(f) fitHtml=f.ok?'<span class="ik-fit ik-fit-ok">מתאים למקום ✓</span>'
                     :'<span class="ik-fit ik-fit-no">גדול מדי ב'+f.bad.join(', ')+'</span>';
    const ph=photo(it);
    const thumb=ph?'<img class="ik-photo" src="'+ph+'" alt="" loading="lazy">':'<div class="ik-photo ik-nophoto">🛒</div>';
    return '<label class="ik-card'+(on?' ik-on':'')+(f&&!f.ok?' ik-toobig':'')+'" data-key="'+esc(key)+'">'
      +'<input type="checkbox" '+(on?'checked':'')+' onchange="Ikea.toggle(this.closest(\'.ik-card\').dataset.key,this.checked)">'
      +thumb
      +'<div class="ik-body"><div class="ik-nm">'+esc(it.sku)+' · '+esc(it.name)+tag+'</div>'
      +(it.desc?'<div class="ik-desc">'+esc(it.desc)+'</div>':'')
      +'<div class="ik-meta">'+dimStr+fitHtml+'</div>'
      +'<div class="ik-foot">'+stockBadge(it)+'<a class="ik-plink" href="'+prodUrl(it)+'" target="_blank" rel="noopener">דף המוצר ↗</a></div></div>'
      +'<div class="ik-price">'+priceHtml+'</div></label>';
  }

  function sectionHtml(sec,fitSec){
    const rows=sec.items.map(it=>card(sec,it)).join('');
    if(!rows) return '';
    const note=sec.note?'<span class="ik-secnote">'+esc(sec.note)+'</span>':'';
    return '<div class="ik-sec"><div class="ik-sechead"><span class="ik-secicon">'+sec.icon+'</span><h3>'+esc(sec.title)+'</h3>'
      +'<span class="ik-secroom">'+esc(sec.room)+'</span>'+note+'</div><div class="ik-grid">'+rows+'</div></div>';
  }

  function renderCards(){
    const host=document.getElementById('ikCards'); if(!host) return;
    host.innerHTML = FURN.map(s=>sectionHtml(s,true)).join('')
      + '<div class="ik-divider">כלים, מצעים, וילונות ומגבות</div>'
      + CONSUM.map(s=>sectionHtml(s,false)).join('');
    updateBar();
  }

  // ── full render ──
  function render(){
    const root=document.getElementById('ikeaRoot'); if(!root) return;
    loadState();
    const sBtn=(c)=>'<button class="ik-storebtn'+(store===c?' on':'')+'" onclick="Ikea.store(\''+c+'\')">'+STORES[c]+'</button>';
    root.innerHTML='<style>'+STYLE+'</style>'
      +'<div class="ik-hero"><div class="ik-hero-top"><span class="ik-logo">IKEA</span><span class="ik-hero-title">רשימת קניות לבית החדש</span></div>'
      +'<p class="ik-hero-sub">רהיטים ותאורה עם תמונה, קישור, מלאי חי בחנות, ובדיקת התאמה למידות שלכם. סמנו והוסיפו לרשימת הפריטים.</p>'
      +'<div class="ik-sale">🔖 מבצע IKEA SALE — המחירים המחוקים בתוקף עד <b>'+SALE_END+'</b></div></div>'
      // controls
      +'<div class="ik-controls">'
        +'<div class="ik-ctl"><span class="ik-ctl-lbl">🏪 מלאי בחנות</span><div class="ik-stores">'+sBtn('217')+sBtn('206')+'</div></div>'
        +'<div class="ik-ctl"><span class="ik-ctl-lbl">📐 המקום שיש לי (ס"מ)</span><div class="ik-space">'
          +'<label>רוחב<input type="number" min="0" placeholder="0" value="'+(space.w||'')+'" oninput="Ikea.space(\'w\',this.value)"></label>'
          +'<label>גובה<input type="number" min="0" placeholder="0" value="'+(space.h||'')+'" oninput="Ikea.space(\'h\',this.value)"></label>'
          +'<label>עומק<input type="number" min="0" placeholder="0" value="'+(space.d||'')+'" oninput="Ikea.space(\'d\',this.value)"></label>'
        +'</div></div>'
        +'<label class="ik-fitonly"><input type="checkbox" onchange="Ikea.fitOnly(this.checked)"> הצג רק מה שמתאים</label>'
      +'</div>'
      +'<div id="ikCards"></div>'
      +'<div style="height:80px"></div>'
      +'<div class="ik-bar"><div class="ik-bar-info"><span class="ik-bar-lbl"><span id="ikCount">0</span> פריטים נבחרו</span>'
        +'<span class="ik-bar-tot" id="ikTotal">₪0</span></div><div class="ik-bar-actions">'
        +'<button class="ik-btn ghost" onclick="Ikea.clear()">נקה</button>'
        +'<button class="ik-btn" id="ikAddBtn" onclick="Ikea.add()">➕ הוסף נבחרים לפריטים שלי</button></div></div>';
    renderCards();
    if(!stockLoaded) loadStock().then(()=>renderCards());
  }

  const STYLE = `
    #ikeaRoot{padding-bottom:20px}
    .ik-hero{background:linear-gradient(135deg,#0058A3,#00437c);color:#fff;border-radius:var(--radius,14px);padding:20px 22px;margin-bottom:14px;box-shadow:var(--shadow)}
    .ik-hero-top{display:flex;align-items:center;gap:12px;flex-wrap:wrap}
    .ik-logo{background:#FFDB00;color:#0058A3;font-weight:800;padding:3px 10px;border-radius:6px;font-size:1.1rem}
    .ik-hero-title{font-size:1.3rem;font-weight:800}
    .ik-hero-sub{margin:10px 0 0;color:#dcebf8;font-size:.9rem;max-width:72ch;line-height:1.5}
    .ik-sale{margin-top:12px;background:#FFDB00;color:#12233a;border-radius:8px;padding:7px 12px;font-weight:700;font-size:.83rem;display:inline-block}
    .ik-controls{background:var(--surface,#fff);border:1px solid var(--border,#e5ddd4);border-radius:var(--radius,14px);box-shadow:var(--shadow);padding:14px 16px;margin-bottom:14px;display:flex;gap:22px;flex-wrap:wrap;align-items:flex-end}
    .ik-ctl-lbl{display:block;font-size:.75rem;font-weight:700;color:var(--text-muted,#78716c);margin-bottom:6px}
    .ik-stores{display:flex;gap:6px}
    .ik-storebtn{background:var(--surface2,#f7f4f0);border:1px solid var(--border,#e5ddd4);color:var(--text,#1c1917);border-radius:8px;padding:8px 14px;font-weight:700;font-size:.85rem;cursor:pointer;font-family:inherit}
    .ik-storebtn.on{background:var(--accent,#d4673a);color:#fff;border-color:var(--accent,#d4673a)}
    .ik-space{display:flex;gap:8px}
    .ik-space label{display:flex;flex-direction:column;font-size:.68rem;color:var(--text-muted,#78716c);gap:3px}
    .ik-space input{width:74px;padding:7px 8px;border:1px solid var(--border,#e5ddd4);border-radius:8px;font-family:inherit;font-size:.9rem;background:var(--surface,#fff);color:var(--text,#1c1917)}
    .ik-fitonly{display:flex;align-items:center;gap:7px;font-size:.83rem;font-weight:600;color:var(--text,#1c1917);cursor:pointer}
    .ik-fitonly input{width:17px;height:17px;accent-color:var(--accent,#d4673a)}
    .ik-sec{margin-bottom:16px}
    .ik-sechead{display:flex;align-items:center;gap:10px;margin-bottom:10px;flex-wrap:wrap}
    .ik-secicon{font-size:1.25rem}
    .ik-sechead h3{font-size:1.05rem;font-weight:800;color:var(--text,#1c1917);margin:0}
    .ik-secroom{font-size:.7rem;font-weight:700;color:var(--accent,#d4673a);background:var(--accent-light,#fdf0ea);padding:2px 9px;border-radius:20px}
    .ik-secnote{font-size:.72rem;color:var(--text-muted,#78716c)}
    .ik-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:12px}
    .ik-card{display:grid;grid-template-columns:22px 78px 1fr auto;gap:11px;align-items:center;background:var(--surface,#fff);border:1px solid var(--border,#e5ddd4);border-radius:12px;padding:11px 13px;box-shadow:var(--shadow);cursor:pointer;transition:border-color .12s}
    .ik-card:hover{border-color:var(--accent2,#e8855a)}
    .ik-card.ik-on{border-color:var(--accent,#d4673a);box-shadow:0 0 0 1px var(--accent,#d4673a)}
    .ik-card.ik-toobig{opacity:.62}
    .ik-card>input{width:19px;height:19px;accent-color:var(--accent,#d4673a);cursor:pointer;margin:0}
    .ik-photo{width:78px;height:78px;object-fit:contain;background:#fff;border-radius:8px}
    .ik-nophoto{display:flex;align-items:center;justify-content:center;font-size:1.6rem;background:var(--surface2,#f7f4f0)}
    .ik-body{min-width:0}
    .ik-nm{font-weight:700;font-size:.9rem;color:var(--text,#1c1917)}
    .ik-desc{font-size:.76rem;color:var(--text-muted,#78716c);margin-top:1px}
    .ik-meta{display:flex;gap:8px;flex-wrap:wrap;align-items:center;margin-top:4px}
    .ik-dim{font-size:.72rem;color:var(--text-muted,#78716c);font-variant-numeric:tabular-nums}
    .ik-tag{display:inline-block;background:#0d9488;color:#fff;font-size:.62rem;font-weight:800;padding:1px 7px;border-radius:20px;margin-inline-start:6px;vertical-align:middle}
    .ik-fit{font-size:.68rem;font-weight:800;padding:1px 7px;border-radius:20px}
    .ik-fit-ok{background:#dcfce7;color:#166534}
    .ik-fit-no{background:#fee2e2;color:#991b1b}
    .ik-foot{display:flex;gap:10px;align-items:center;margin-top:6px;flex-wrap:wrap}
    .ik-stk{font-size:.7rem;font-weight:800;padding:1px 7px;border-radius:6px}
    .ik-stk-ok{background:#dcfce7;color:#166534}
    .ik-stk-low{background:#fef9c3;color:#854d0e}
    .ik-stk-out{background:#fee2e2;color:#991b1b}
    .ik-stk-load{background:var(--surface2,#f2f2f2);color:var(--text-muted,#78716c)}
    .ik-stocklink,.ik-plink{font-size:.72rem;font-weight:700;color:var(--accent,#d4673a);text-decoration:none}
    .ik-stocklink:hover,.ik-plink:hover{text-decoration:underline}
    .ik-price{text-align:left;white-space:nowrap;display:flex;flex-direction:column;align-items:flex-start}
    .ik-now{font-weight:800;font-size:1rem;color:var(--text,#1c1917)}
    .ik-was{color:var(--text-muted,#a8a29e);text-decoration:line-through;font-size:.74rem}
    .ik-badge{background:#FFDB00;color:#7a5a00;font-weight:800;font-size:.6rem;padding:1px 5px;border-radius:4px;margin-top:2px}
    .ik-divider{margin:22px 0 12px;font-size:.8rem;font-weight:700;color:var(--text-muted,#78716c);border-top:1px dashed var(--border,#e5ddd4);padding-top:14px}
    .ik-bar{position:sticky;bottom:0;background:var(--surface,#fff);border:1px solid var(--border,#e5ddd4);border-radius:var(--radius,14px);box-shadow:0 -6px 24px rgba(0,0,0,.1);padding:12px 16px;display:flex;align-items:center;justify-content:space-between;gap:14px;flex-wrap:wrap}
    .ik-bar-lbl{font-size:.78rem;color:var(--text-muted,#78716c);font-weight:600;display:block}
    .ik-bar-tot{font-size:1.4rem;font-weight:800;color:var(--text,#1c1917)}
    .ik-bar-actions{display:flex;gap:8px;flex-wrap:wrap}
    .ik-btn{background:var(--accent,#d4673a);color:#fff;border:none;border-radius:9px;padding:10px 16px;font-weight:700;font-size:.86rem;cursor:pointer;font-family:inherit}
    .ik-btn:hover{background:var(--accent2,#e8855a)}
    .ik-btn:disabled{opacity:.45;cursor:not-allowed}
    .ik-btn.ghost{background:transparent;color:var(--text-muted,#78716c);border:1px solid var(--border,#e5ddd4)}
  `;

  return { render, toggle, add:addSelected, clear:clearPicks, store:setStore, space:setSpace, fitOnly:toggleFitOnly };
})();
