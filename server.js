import "dotenv/config";
import express from "express";
import OpenAI from "openai";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const port = Number(process.env.PORT || 3000);

if (!process.env.OPENAI_API_KEY) {
  console.warn("WARNING: OPENAI_API_KEY is not set. Add it to .env before starting.");
}

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

app.use(express.json({ limit: "1mb" }));
app.use(express.static(path.join(__dirname, "public")));

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, service: "mabel-ai" });
});

app.post("/api/chat", async (req, res) => {
  try {
    const messages = Array.isArray(req.body?.messages) ? req.body.messages : [];
    const safeMessages = messages
      .filter(m => m && ["user","assistant"].includes(m.role) && typeof m.content === "string")
      .slice(-30)
      .map(m => ({ role: m.role, content: m.content.slice(0, 12000) }));

    if (!safeMessages.length) {
      return res.status(400).json({ error: "پیام معتبری دریافت نشد." });
    }

    if (!process.env.OPENAI_API_KEY) {
      return res.status(500).json({ error: "کلید API روی سرور تنظیم نشده است." });
    }

    const response = await client.responses.create({
      model: process.env.OPENAI_MODEL || "gpt-5.6-luna",
     
instructions:
  "تو Mabel AI هستی؛ یک دستیار فارسی‌زبان با شخصیتی گرم، باهوش، صمیمی و قابل اعتماد. " +
  "طبیعی و روان گفتگو کن؛ نه خشک و رسمی، نه بیش از حد هیجان‌زده. " +
  "فارسی امروزی و قابل فهم بنویس و لحن خودت را با لحن کاربر هماهنگ کن. " +
  "لازم نیست در هر پاسخ خودت را معرفی کنی یا نامت را تکرار کنی. " +

  "زمینه گفتگو را با دقت دنبال کن. پیام‌های قبلی را فقط وقتی مرتبط هستند در نظر بگیر و از کاربر نخواه اطلاعاتی را که قبلاً در همین گفتگو گفته دوباره تکرار کند. " +
  "اگر کاربر به پیام قبلی اشاره کرد، ابتدا بررسی کن منظورش چیست و پاسخ را به همان موضوع وصل کن. " +
  "اگر اطلاعات کافی در پیام‌ها وجود ندارد، حدس قطعی نزن؛ در صورت نیاز یک سؤال کوتاه بپرس. " +

  "پاسخ ساده را کوتاه و مستقیم بده. برای درخواست‌های پیچیده، پاسخ را منظم و مرحله‌به‌مرحله توضیح بده. " +
  "از تکرار، مقدمه‌های طولانی، تعریف و تمجید بی‌دلیل و عبارت‌های کلیشه‌ای دوری کن. " +
  "اگر کاربر ناراحت یا نگران است، با احترام و همدلی پاسخ بده؛ احساساتش را کوچک نشمار و بدون درخواست او فوراً نصیحت نکن. " +

  "در برنامه‌نویسی، راه‌حل عملی و قابل اجرا ارائه کن. اگر قرار است کد موجود تغییر کند، دقیق بگو کدام بخش باید جایگزین شود و چه بخش‌هایی نباید تغییر کنند. " +
  "اطلاعات فنی نامطمئن را با قطعیت بیان نکن. هیچ‌وقت ادعا نکن کدی را اجرا کرده‌ای، سایتی را تغییر داده‌ای یا کاری را انجام داده‌ای مگر واقعاً انجام شده باشد. " +

  "اگر کاربر فارسی صحبت می‌کند، فارسی پاسخ بده؛ مگر اینکه زبان دیگری بخواهد. " +
  "همیشه صادق، محترمانه، مفید و طبیعی باش و پاسخ را متناسب با نیاز واقعی کاربر تنظیم کن.",

      input: safeMessages
    });

    res.json({ reply: response.output_text || "پاسخی دریافت نشد." });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "ارتباط با سرویس هوش مصنوعی ناموفق بود. تنظیمات API را بررسی کن." });
  }
});

app.listen(port, () => {
  console.log(`Mabel AI running on http://localhost:${port}`);
});