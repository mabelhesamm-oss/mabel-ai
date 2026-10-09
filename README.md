# مِیبل AI — نسخه آنلاین

این نسخه یک سرور Node.js دارد و چت سایت را به OpenAI Responses API وصل می‌کند.

## اجرای روی کامپیوتر

1. Node.js نصب باشد.
2. در همین پوشه ترمینال باز کن.
3. اجرا:
   npm install
4. فایل `.env.example` را به `.env` تغییر نام بده.
5. کلید API خودت را در `OPENAI_API_KEY` قرار بده.
6. اجرا:
   npm start
7. مرورگر:
   http://localhost:3000

## انتشار آنلاین

این پروژه برای سرویس‌های Node.js قابل استقرار است. فایل `.env` را روی سرویس انتشار آپلود نکن؛ متغیرهای محیطی را در تنظیمات سرویس قرار بده.

متغیرهای لازم:
OPENAI_API_KEY
OPENAI_MODEL (پیش‌فرض: gpt-6-luna)
PORT (در سرویس‌های هاست معمولاً خودکار تنظیم می‌شود)

## امنیت

کلید API فقط در سرور استفاده می‌شود و به مرورگر ارسال نمی‌شود.
برای سایت عمومی واقعی، مرحله بعدی بهتر است شامل ورود کاربران، محدودیت درخواست، ثبت مصرف و محافظت در برابر سوءاستفاده باشد.


## انتشار عمومی با Render

1. پروژه را در یک GitHub repository قرار بده.
2. در Render یک **Web Service** بساز و repository را متصل کن.
3. Build Command: `npm install`
4. Start Command: `npm start`
5. Environment Variables:
   - `OPENAI_API_KEY` = کلید API
   - `OPENAI_MODEL` = `gpt-5.6-luna`
   - `NODE_ENV` = `production`
6. Deploy را بزن.
7. Render یک آدرس عمومی `onrender.com` می‌دهد.

فایل `render.yaml` هم برای تنظیم خودکار سرویس آماده شده است.

**هشدار:** فایل `.env` را داخل GitHub قرار نده.
