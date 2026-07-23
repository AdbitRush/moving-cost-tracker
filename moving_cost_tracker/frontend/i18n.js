// i18n.js — EN/HE language engine for the whole app.
// Static text: elements carry data-i18n="key" (text), data-i18n-ph="key" (placeholder).
// Dynamic text (rendered by JS): call t('key'). Language flips dir RTL<->LTR and re-renders.
// Load BEFORE script.js so t()/LANG exist during render.

var LANG = localStorage.getItem('mct-lang') || 'he';

const I18N = {
  he: {
    app_title:'מעקב הוצאות מעבר דירה', logo_title:'מעבר דירה', logo_sub:'מעקב הוצאות',
    menu:'תפריט', tools:'כלים', lang_name:'English',
    nav_dashboard:'לוח בקרה', nav_calendar:'לוח זמנים', nav_rooms:'תכנון חדרים', nav_items:'פריטים',
    nav_cats:'קטגוריות', nav_sales:'מכירות', nav_ikea:'קניות איקאה', nav_charts:'גרפים',
    export_csv:'ייצוא CSV', export_json:'ייצוא JSON', import_json:'ייבוא JSON', guide:'מדריך מלא',
    load_server:'טען מהשרת', save_server:'שמור לשרת', change_pwd:'החלף סיסמה',
    stat_paid:'שולם', stat_pending:'ממתין', stat_remaining:'יתרת תקציב', stat_sales_income:'הכנסות מכירות',
    // dashboard
    t_dashboard:'📊 לוח בקרה', budget_summary:'סיכום תקציב', spent:'הוצא', set_budget:'הגדר תקציב:', save:'שמור',
    sold_actual:'💵 נמכר בפועל:', included_budget:'(כלול בתקציב)', projected_all:'📈 הערכה אם הכל יימכר:',
    remaining_word:'יתרה', kpi_total:'סה״כ פריטים', kpi_paid:'שולם', kpi_pending:'ממתין לתשלום', kpi_remaining:'יתרת תקציב',
    upcoming_header:'🔔 הגעות קרובות (7 ימים הבאים)', upcoming_empty:'אין הגעות מתוכננות בשבוע הקרוב',
    cat_spend_header:'🏷 הוצאות לפי קטגוריה', items_word:'פריטים', cat_no_items:'אין פריטים עם קטגוריות',
    // calendar
    t_calendar:'📅 לוח זמנים', cal_header:'📅 לוח זמנים שבועי', cal_prev:'קודם', cal_today:'היום', cal_next:'הבא',
    cal_2weeks:'2 שבועות ▼', cal_1week:'שבוע 1 ▲', cal_no_appt:'אין',
    // items
    t_items:'📋 פריטים ועלויות', items_header:'📋 פריטים ועלויות',
    filter_all:'הכל', filter_pending:'⏳ ממתין', filter_paid:'✅ שולם', filter_cancelled:'❌ בוטל',
    search_ph:'🔍 חיפוש...', sort_label:'מיון:', sort_manual:'⠿ ידני', sort_price_desc:'₪ יורד', sort_price_asc:'₪ עולה',
    sort_room:'🏠 חדר', sort_cat:'🏷 קטגוריה', items_empty:'אין פריטים. הוסף פריט חדש למטה.',
    add_item_label:'הוסף פריט חדש', f_item_name:'שם הפריט', f_item_name_ph:'לדוגמה: מובילים', f_price:'מחיר (₪)',
    f_category:'קטגוריה (סוג הוצאה)', f_room:'חדר', opt_none:'— ללא —', f_supplier_phone:'טלפון ספק',
    btn_add_phone:'+ טלפון', btn_add:'+ הוסף', status_pending:'ממתין', status_paid:'שולם', status_cancelled:'בוטל',
    no_cat:'ללא קטגוריה', quotes:'הצעות מחיר', appointment_word:'תור',
    // categories
    t_cats:'🏷 קטגוריות', cats_header:'🏷 קטגוריות (סוג הוצאה)', cats_help:'סוג ההוצאה: הובלה, ריהוט, חשמל...',
    new_cat_ph:'שם קטגוריה חדשה...', add_cat:'+ הוסף קטגוריה', rooms_header:'🏠 חדרים',
    rooms_help:'החדרים קבועים — נבחרים על כל פריט ישירות בכרטיס.', no_cats_yet:'אין קטגוריות עדיין',
    // sales
    t_sales:'💵 פריטים למכירה', sales_header:'💵 פריטים למכירה', sale_forsale:'💰 למכירה', sale_sold:'✅ נמכר',
    sale_removed:'❌ הוסר', sales_empty:'אין פריטים למכירה. הוסף פריט למטה.', add_sale_label:'הוסף פריט למכירה',
    f_sale_name_ph:'לדוגמה: ספה ישנה', f_ask_price:'מחיר מבוקש (₪)', f_notes:'הערות / קישור', f_notes_ph:'יד2, פייסבוק...',
    // charts
    t_charts:'📈 גרפים', chart_cats:'🏷 הוצאות לפי קטגוריה', chart_status:'📋 סטטוס פריטים',
    chart_budget:'💰 תקציב vs הוצאות', chart_sales:'💵 מכירות', chart_no_sales:'אין נתוני מכירות עדיין',
    chart_budget_total:'תקציב כולל', chart_spent_total:'הוצאה כולל', chart_paid:'שולם', chart_pending:'ממתין לתשלום',
    t_ikea:'🛒 קניות איקאה', t_rooms:'🚪 תכנון חדרים',
    // rooms (planner)
    rp_add_room:'חדר חדש', rp_add_room_btn:'➕ הוסף חדר / קטגוריה', rp_done:'הושלמו', rp_new_room_name:'שם החדר',
    rp_who:'למי', rp_priority:'עדיפות', rp_must:'חובה', rp_normal:'רגיל', rp_maybe:'אם יוצא', rp_add_wish:'הוסף פריט',
    rp_wish_ph:'מה צריך בחדר? (ספה, מנורה, שטיח…)', rp_empty:'אין עדיין פריטים לחדר הזה', rp_delete_room:'למחוק חדר?',
    rp_wishlist:'רשימת משאלות', rp_who_ph:'מי ביקש?', rp_open:'פתוחים', rp_room_name_ph:'שם החדר (החדר של גלי, החדר של נטע…)',
    rp_owner_ph:'של מי החדר? (רשות)', rp_create_room:'צור חדר', rp_del_title:'מחק חדר',
    rp_confirm_del_room:'למחוק את החדר וכל הפריטים שבו?', rp_empty_first:'אין פריטים עדיין — הוסיפו את המשאלה הראשונה 🌟',
    // toasts / misc
    toast_item_added:'פריט נוסף ✓', toast_saved:'נשמר ✓', toast_deleted:'נמחק', toast_loaded_server:'נטען מהשרת ✓',
    toast_saved_server:'נשמר לשרת ✓', toast_load_err:'שגיאה בטעינה: ', toast_enter_name:'הזן שם לפריט',
    toast_ikea_added:'פריטים נוספו לרשימת הפריטים ✓', confirm_delete:'למחוק?',
    loading_server:'טוען מהשרת...', saving_server:'שומר לשרת...',
    // rooms values
    room_general:'כללי', room_master:'חדר שינה ראשי', room_kids:'חדר ילדים', room_baby:'חדר תינוק',
    room_living:'סלון', room_kitchen:'מטבח', room_balcony:'מרפסת', room_office:'חדר עבודה', room_bath:'חדר אמבטיה',
    no_room:'ללא חדר', sst_forsale:'למכירה', sst_sold:'נמכר', sst_removed:'הוסר',
    // IKEA tab
    ik_hero_title:'רשימת קניות לבית החדש',
    ik_hero_sub:'רהיטים ותאורה עם תמונה, קישור, מלאי חי בחנות, ובדיקת התאמה למידות שלכם. סמנו והוסיפו לרשימת הפריטים.',
    ik_sale:'🔖 מבצע IKEA SALE — המחירים המחוקים בתוקף עד ', ik_store_lbl:'🏪 מלאי בחנות',
    ik_space_lbl:'📐 המקום שיש לי (ס"מ)', ik_w:'רוחב', ik_h:'גובה', ik_d:'עומק', ik_fit_only:'הצג רק מה שמתאים',
    ik_more:'כלים, מצעים, וילונות ומגבות', ik_selected:'פריטים נבחרו', ik_clear:'נקה',
    ik_add:'➕ הוסף נבחרים לפריטים שלי', ik_in_stock:'✓ במלאי', ik_low:'אוזל', ik_out:'אזל ב',
    ik_check_store:'בדקו בחנות ↗', ik_checking:'בודק מלאי…', ik_product_page:'דף המוצר ↗',
    ik_fit_ok:'מתאים למקום ✓', ik_fit_no:'גדול מדי ב', ik_sale_badge:'מבצע', ik_cm:'ס"מ',
    ik_note_bulbs:'הנורות נמכרות בנפרד', ik_note_rug:'רוחב×אורך — הזינו את שטח הרצפה ברוחב+עומק',
  },
  en: {
    app_title:'Moving Cost Tracker', logo_title:'Home Move', logo_sub:'Expense Tracker',
    menu:'Menu', tools:'Tools', lang_name:'עברית',
    nav_dashboard:'Dashboard', nav_calendar:'Schedule', nav_rooms:'Room Planner', nav_items:'Items',
    nav_cats:'Categories', nav_sales:'Sales', nav_ikea:'IKEA Shopping', nav_charts:'Charts',
    export_csv:'Export CSV', export_json:'Export JSON', import_json:'Import JSON', guide:'Full Guide',
    load_server:'Load from server', save_server:'Save to server', change_pwd:'Change password',
    stat_paid:'Paid', stat_pending:'Pending', stat_remaining:'Budget left', stat_sales_income:'Sales income',
    t_dashboard:'📊 Dashboard', budget_summary:'Budget summary', spent:'spent', set_budget:'Set budget:', save:'Save',
    sold_actual:'💵 Actually sold:', included_budget:'(in budget)', projected_all:'📈 If everything sells:',
    remaining_word:'left', kpi_total:'Total items', kpi_paid:'Paid', kpi_pending:'Pending payment', kpi_remaining:'Budget left',
    upcoming_header:'🔔 Upcoming (next 7 days)', upcoming_empty:'No scheduled arrivals this week',
    cat_spend_header:'🏷 Spend by category', items_word:'items', cat_no_items:'No items with categories',
    t_calendar:'📅 Schedule', cal_header:'📅 Weekly schedule', cal_prev:'Prev', cal_today:'Today', cal_next:'Next',
    cal_2weeks:'2 weeks ▼', cal_1week:'1 week ▲', cal_no_appt:'—',
    t_items:'📋 Items & Costs', items_header:'📋 Items & Costs',
    filter_all:'All', filter_pending:'⏳ Pending', filter_paid:'✅ Paid', filter_cancelled:'❌ Cancelled',
    search_ph:'🔍 Search...', sort_label:'Sort:', sort_manual:'⠿ Manual', sort_price_desc:'₪ High→Low', sort_price_asc:'₪ Low→High',
    sort_room:'🏠 Room', sort_cat:'🏷 Category', items_empty:'No items yet. Add one below.',
    add_item_label:'Add new item', f_item_name:'Item name', f_item_name_ph:'e.g. Movers', f_price:'Price (₪)',
    f_category:'Category (expense type)', f_room:'Room', opt_none:'— None —', f_supplier_phone:'Supplier phone',
    btn_add_phone:'+ Phone', btn_add:'+ Add', status_pending:'Pending', status_paid:'Paid', status_cancelled:'Cancelled',
    no_cat:'No category', quotes:'Quotes', appointment_word:'Appt',
    t_cats:'🏷 Categories', cats_header:'🏷 Categories (expense type)', cats_help:'Expense type: moving, furniture, electric...',
    new_cat_ph:'New category name...', add_cat:'+ Add category', rooms_header:'🏠 Rooms',
    rooms_help:'Rooms are fixed — pick one per item on its card.', no_cats_yet:'No categories yet',
    t_sales:'💵 Items for sale', sales_header:'💵 Items for sale', sale_forsale:'💰 For sale', sale_sold:'✅ Sold',
    sale_removed:'❌ Removed', sales_empty:'No items for sale. Add one below.', add_sale_label:'Add item for sale',
    f_sale_name_ph:'e.g. Old sofa', f_ask_price:'Asking price (₪)', f_notes:'Notes / link', f_notes_ph:'Yad2, Facebook...',
    t_charts:'📈 Charts', chart_cats:'🏷 Spend by category', chart_status:'📋 Item status',
    chart_budget:'💰 Budget vs spend', chart_sales:'💵 Sales', chart_no_sales:'No sales data yet',
    chart_budget_total:'Total budget', chart_spent_total:'Total spent', chart_paid:'Paid', chart_pending:'Pending',
    t_ikea:'🛒 IKEA Shopping', t_rooms:'🚪 Room Planner',
    rp_add_room:'New room', rp_add_room_btn:'➕ Add room / category', rp_done:'done', rp_new_room_name:'Room name',
    rp_who:'Who', rp_priority:'Priority', rp_must:'Must', rp_normal:'Normal', rp_maybe:'If possible', rp_add_wish:'Add item',
    rp_wish_ph:'What does the room need? (sofa, lamp, rug…)', rp_empty:'No items for this room yet', rp_delete_room:'Delete room?',
    rp_wishlist:'Wishlist', rp_who_ph:'Who asked?', rp_open:'Open', rp_room_name_ph:"Room name (Gali's room, Neta's room…)",
    rp_owner_ph:'Whose room? (optional)', rp_create_room:'Create room', rp_del_title:'Delete room',
    rp_confirm_del_room:'Delete this room and all its items?', rp_empty_first:'No items yet — add your first wish 🌟',
    toast_item_added:'Item added ✓', toast_saved:'Saved ✓', toast_deleted:'Deleted', toast_loaded_server:'Loaded from server ✓',
    toast_saved_server:'Saved to server ✓', toast_load_err:'Load error: ', toast_enter_name:'Enter an item name',
    toast_ikea_added:'items added to your list ✓', confirm_delete:'Delete?',
    loading_server:'Loading from server...', saving_server:'Saving to server...',
    room_general:'General', room_master:'Master bedroom', room_kids:"Kids' room", room_baby:'Nursery',
    room_living:'Living room', room_kitchen:'Kitchen', room_balcony:'Balcony', room_office:'Office', room_bath:'Bathroom',
    no_room:'No room', sst_forsale:'For sale', sst_sold:'Sold', sst_removed:'Removed',
    ik_hero_title:'New-home shopping list',
    ik_hero_sub:'Furniture and lights with photo, link, live in-store stock, and a fit check for your space. Tick items and add them to your list.',
    ik_sale:'🔖 IKEA SALE — struck-through prices valid until ', ik_store_lbl:'🏪 In-store stock',
    ik_space_lbl:'📐 Space I have (cm)', ik_w:'Width', ik_h:'Height', ik_d:'Depth', ik_fit_only:'Show only what fits',
    ik_more:'Kitchen, bedding, curtains & towels', ik_selected:'items selected', ik_clear:'Clear',
    ik_add:'➕ Add selected to my items', ik_in_stock:'✓ In stock', ik_low:'Low', ik_out:'Out at ',
    ik_check_store:'Check in store ↗', ik_checking:'Checking stock…', ik_product_page:'Product page ↗',
    ik_fit_ok:'Fits ✓', ik_fit_no:'Too big: ', ik_sale_badge:'SALE', ik_cm:'cm',
    ik_note_bulbs:'Bulbs sold separately', ik_note_rug:'Width×Length — enter your floor width+depth',
  }
};

function t(k){ const d=I18N[LANG]||I18N.he; return (k in d)? d[k] : (I18N.he[k]!==undefined?I18N.he[k]:k); }

// canonical Hebrew room value -> localized label
const ROOM_KEYS = { 'כללי':'room_general','חדר שינה ראשי':'room_master','חדר ילדים':'room_kids','חדר תינוק':'room_baby',
  'סלון':'room_living','מטבח':'room_kitchen','מרפסת':'room_balcony','חדר עבודה':'room_office','חדר אמבטיה':'room_bath' };
function roomLabel(he){ return he && ROOM_KEYS[he] ? t(ROOM_KEYS[he]) : (he||''); }
const STATUS_KEYS = { pending:'status_pending', paid:'status_paid', cancelled:'status_cancelled' };
function statusLabel(s){ return STATUS_KEYS[s] ? t(STATUS_KEYS[s]) : s; }

// replace the first meaningful text node (keeps sibling icon/badge spans)
function _setElText(el, txt){
  for(const n of el.childNodes){
    if(n.nodeType===3 && n.nodeValue.trim()){
      const lead=n.nodeValue.match(/^\s*/)[0], tail=n.nodeValue.match(/\s*$/)[0];
      n.nodeValue = lead + txt + (tail||' '); return;
    }
  }
  el.insertBefore(document.createTextNode(txt), el.firstChild);
}

function applyLang(){
  document.documentElement.lang = LANG;
  document.documentElement.dir  = LANG==='he' ? 'rtl' : 'ltr';
  document.title = t('app_title');
  document.querySelectorAll('[data-i18n]').forEach(el=>_setElText(el, t(el.getAttribute('data-i18n'))));
  document.querySelectorAll('[data-i18n-ph]').forEach(el=>{ el.placeholder = t(el.getAttribute('data-i18n-ph')); });
  const lb=document.getElementById('langBtn'); if(lb) lb.textContent = t('lang_name');
  // refresh dynamic areas that are already on screen
  try{
    if(typeof TAB_TITLES!=='undefined'){ /* titles read live via t() */ }
    const active=document.querySelector('.sidebar-link.active[data-tab]');
    const name=active?active.getAttribute('data-tab'):'dashboard';
    const tt=document.getElementById('topbarTitle'); if(tt&&typeof t==='function') tt.textContent=t('t_'+name);
    if(typeof updateSummary==='function') updateSummary();
    if(typeof renderItemsTable==='function') renderItemsTable();
    if(typeof renderCategoryChips==='function'){ renderCategoryChips(); renderRoomChips(); renderCategoryDropdown(); }
    if(typeof renderSaleItems==='function') renderSaleItems();
    if(name==='calendar' && typeof renderCalendar==='function') renderCalendar();
    if(name==='charts' && typeof renderCharts==='function') renderCharts();
    if(name==='rooms' && typeof Rooms!=='undefined') Rooms.render&&Rooms.render();
    if(name==='ikea' && typeof Ikea!=='undefined') Ikea.render();
  }catch(e){ console.warn('applyLang refresh', e); }
}

function toggleLang(){ LANG = LANG==='he'?'en':'he'; localStorage.setItem('mct-lang', LANG); applyLang(); }
