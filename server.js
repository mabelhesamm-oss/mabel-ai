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
        "تو مِیبل AI هستی؛ یک دستیار فارسی‌زبان، دقیق، دوستانه و کاربردی. " +
        "پاسخ‌ها را واضح و تا حد امکان به زبان فارسی بده. اگر کاربر کد خواست، کد تمیز و قابل اجرا ارائه کن.",
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