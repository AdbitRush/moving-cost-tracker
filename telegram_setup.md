# הכנה והקמה של ערוץ Telegram לשימוש עם Moving Cost Tracker

## מה צריך?
1. **Telegram account** – אם עדיין אין לך, הורד את האפליקציה ופתח חשבון.
2. **ערוץ (Channel) או קבוצה (Group)** – ניצור בו את הקישור ל‑tracker. ערוץ מאפשר שליחת הודעות רק למנהלים, קבוצה מאפשרת דיון.
3. **Bot (בוט) ב‑Telegram** – נשתמש בבוט כדי לשלוח עדכונים (למשל תזכורות, סיכומי תקציב) ישירות לערוץ.

## שלב‑אחר‑שלב
### 1️⃣ יצירת ערוץ/קבוצה
1. פתח את Telegram -> בתפריט השתמש ב‑"New Channel" (או "New Group" אם תרצה יותר אינטראקציה).
2. תן שם (למשל `מעקב הוצאות מעבר`).
3. בחר האם לערוץ להיות **Public** – כך יצירת קישור קבוע `https://t.me/YourChannelName` או **Private** – כך הקישור יהיה `https://t.me/c/<id>`.
4. קבל את **Username** של הערוץ (ה‑`YourChannelName`).

### 2️⃣ יצירת Bot דרך BotFather
1. שלח הודעה ל‑`@BotFather` ובחר ` /newbot `.
2. תן שם לבוט (למשל `CostTrackerBot`).
3. תקבל **Token** – מחרוזת ארוכה המזהה את הבוט, למשל:
   ```
   123456789:AAHxxxxxxxxxxxxxxxxxxxxxxxxxx
   ```
4. שמור את הטוקן בקובץ סביבה (recommended) – ניצור קובץ `.env` ב‑root:
   ```
   TELEGRAM_BOT_TOKEN=YOUR_TOKEN_HERE
   TELEGRAM_CHANNEL_ID=@YourChannelName   # אפשר גם מספר ID של ערוץ פרטי, לדוגמה -1001234567890
   ```

### 3️⃣ הוספת Bot לערוץ
1. פתח את ערוץ ה‑Telegram.
2. עבור למנהלים (Admin) → **Add Admin** → בחר את הבוט שיצרת.
3. אפשר לבוט **Post Messages** (לדוגמה `Post messages` וביטול `Delete messages` אם אינך צריך).

### 4️⃣ שליחת הודעות מה‑tracker ל‑Telegram
ב‑repo שלנו נוספתי דוגמת קוד **Node.js** (קובץ `telegram_bot/send_update.js`) שמאפשר:
- שליחת הודעה מותאמת (טקסט, קישור, או קובץ) לערוץ.
- שימוש בטוקן מה‑`.env`.

#### איך להריץ?
```bash
# התקנת תלויות
npm install node-telegram-bot-api dotenv

# יצירת קובץ .env כמו שמודגם למעלה
cp .env.example .env   # (או ערוך ידנית)

# שליחת הודעה לדוגמה – תחליף את הטקסט / הנתיב לקובץ שתרצה לשלוח
node telegram_bot/send_update.js "היום נבחרו פריטים חדשים!" 
```

#### קוד `telegram_bot/send_update.js`
```js
require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');

const token = process.env.TELEGRAM_BOT_TOKEN;
const channel = process.env.TELEGRAM_CHANNEL_ID; // לדוגמה "@MyCostChannel" או "-1001234567890"
if (!token || !channel) {
  console.error('Missing TELEGRAM_BOT_TOKEN or TELEGRAM_CHANNEL_ID in .env');
  process.exit(1);
}

const bot = new TelegramBot(token, { polling: false });

// הקריאה הראשונה של הקובץ מכילה את הטקסט שהועבר כארגומנט שורת הפקודה
const message = process.argv.slice(2).join(' ') || 'הודעה ללא תוכן';

bot.sendMessage(channel, message, { parse_mode: 'HTML' })
  .then(() => console.log('Message sent to', channel))
  .catch(err => console.error('Failed to send message:', err));
```

> **הערה:** אם תרצה לשלוח תמונה/קובץ, השתמש ב‑`bot.sendPhoto` או `bot.sendDocument` במקום `sendMessage`.

### 5️⃣ אינטגרציה עם ה‑frontend
ב‑`moving_cost_tracker/frontend/index.html` הוספתי קישור אל ערוץ ה‑Telegram בתחתית העמוד (footer). החלף את `https://t.me/YourTelegramChannel` בשם המשתמש של הערוץ שלך.

```html
<a href="https://t.me/YourTelegramChannel" target="_blank" rel="noopener noreferrer">Telegram</a>
```

### 6️⃣ בדיקה
1. פתח את האתר (`http://localhost:8000`).
2. לחץ על הקישור "Telegram" בתחתית העמוד – זה יפתח את ערוץ ה‑Telegram.
3. הפעל את הסקריפט `node telegram_bot/send_update.js "בדיקה"` – הודעה תופיע בערוץ.

---
**שימו לב:** הקישורים בקוד הם placeholders – **החלף** אותם לפני פרסום.
