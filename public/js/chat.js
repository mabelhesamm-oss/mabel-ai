
let chats = JSON.parse(localStorage.getItem("mabel_chats") || "[]");
let currentId = localStorage.getItem("mabel_current") || null;

const msgs = document.getElementById("messages");
const input = document.getElementById("input");
const typing = document.getElementById("typing");
const fileInput = document.getElementById("fileInput");
const fileStatus = document.getElementById("fileStatus");
const uploadButton = document.getElementById("uploadButton");
const sendButton = document.getElementById("sendButton");

function save() {
  localStorage.setItem("mabel_chats", JSON.stringify(chats));
  localStorage.setItem("mabel_current", currentId || "");
  renderHistory();
}

function current() {
  return chats.find(x => x.id === currentId);
}

function newChat() {
  currentId = Date.now().toString();
  chats.unshift({
    id: currentId,
    title: "گفتگوی جدید",
    messages: []
  });
  save();
  renderChat();
}

function renderHistory() {
  const q = (document.getElementById("chatSearch")?.value || "").toLowerCase();
  const box = document.getElementById("history");
  box.innerHTML = "";

  chats
    .filter(c => c.title.toLowerCase().includes(q))
    .slice(0, 30)
    .forEach(c => {
      const d = document.createElement("div");
      d.className = "history-item";
      d.textContent = c.title;
      d.onclick = () => {
        currentId = c.id;
        save();
        renderChat();
      };
      box.appendChild(d);
    });
}

function renderChat() {
  msgs.innerHTML = "";
  const c = current();

  if (!c || !c.messages.length) {
    msgs.innerHTML = `
      <div class="welcome">
        <div>🌙</div>
        <h2>سلام، من مِیبل AI هستم</h2>
        <p>می‌تونیم گفت‌وگو کنیم یا یک فایل رو با هم بررسی کنیم.</p>
        <div class="quick-grid">
          <button onclick="quick('برای یک سایت حرفه‌ای ایده بده')">💡 ایده سایت</button>
          <button onclick="quick('یک متن تبلیغاتی بنویس')">✍️ متن تبلیغاتی</button>
          <button onclick="quick('یک پروژه HTML پیشنهاد بده')">💻 پروژه کدنویسی</button>
        </div>
      </div>`;
    return;
  }

  c.messages.forEach(m => draw(m.text, m.role, m.time, false));
  msgs.scrollTop = msgs.scrollHeight;
}

function draw(text, role, time, saveIt = true) {
  const row = document.createElement("div");
  row.className = "message-row " + role;

  const av = document.createElement("div");
  av.className = "avatar";
  av.textContent = role === "user" ? "ش" : "🌙";

  const wrap = document.createElement("div");
  wrap.className = "bubble-wrap";

  const b = document.createElement("div");
  b.className = "bubble";
  b.textContent = text;

  const meta = document.createElement("div");
  meta.className = "meta";

  const timeText = time ||
    new Date().toLocaleTimeString("fa-IR", {
      hour: "2-digit",
      minute: "2-digit"
    });

  meta.appendChild(document.createTextNode(timeText));

  if (role !== "user") {
    const cp = document.createElement("button");
    cp.className = "copy";
    cp.textContent = "کپی";
    cp.onclick = () => navigator.clipboard?.writeText(text);
    meta.appendChild(cp);
  }

  wrap.append(b, meta);
  row.append(av, wrap);
  msgs.appendChild(row);

  if (saveIt) {
    const c = current();
    if (c) {
      c.messages.push({ text, role, time: timeText });
      save();
    }
  }

  msgs.scrollTop = msgs.scrollHeight;
}

function ensure() {
  if (!currentId || !current()) newChat();
}

function setBusy(busy) {
  input.disabled = busy;
  sendButton.disabled = busy;
  uploadButton.disabled = busy;
}

async function sendMessage() {
  const text = input.value.trim();
  if (!text || input.disabled) return;

  ensure();

  if (!current().messages.length) {
    current().title = text.slice(0, 30);
  }

  draw(text, "user");
  input.value = "";
  input.style.height = "43px";

  setBusy(true);
  typing.style.display = "block";
  msgs.appendChild(typing);

  try {
    const response = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        messages: current().messages.map(m => ({
          role: m.role === "user" ? "user" : "assistant",
          content: m.text
        }))
      })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "خطا در ارتباط با سرور");
    }

    draw(data.reply || "پاسخی دریافت نشد.", "bot");
  } catch (err) {
    draw("⚠️ " + err.message, "bot");
  } finally {
    typing.style.display = "none";
    setBusy(false);
    input.focus();
  }
}

function showSelectedFile() {
  const file = fileInput.files[0];

  if (!file) {
    fileStatus.style.display = "none";
    return;
  }

  fileStatus.style.display = "block";
  fileStatus.textContent =
    "📎 فایل انتخاب‌شده: " + file.name +
    " (" + (file.size / 1024).toFixed(1) + " کیلوبایت)";
}

async function uploadFile() {
  const file = fileInput.files[0];

  if (!file) {
    fileStatus.style.display = "block";
    fileStatus.textContent = "اول یک فایل انتخاب کن. 📎";
    return;
  }

  if (file.size > 5 * 1024 * 1024) {
    fileStatus.style.display = "block";
    fileStatus.textContent = "حجم فایل نباید بیشتر از ۵ مگابایت باشد.";
    return;
  }

  ensure();

  const allowed = /\.(pdf|txt|md|csv|json|js|html|css|py|ts|jsx|tsx|xml)$/i;

  if (!allowed.test(file.name)) {
    fileStatus.style.display = "block";
    fileStatus.textContent = "این نوع فایل پشتیبانی نمی‌شود.";
    return;
  }

  if (!current().messages.length) {
    current().title = "بررسی فایل: " + file.name.slice(0, 22);
  }

  draw("📎 لطفاً این فایل را بررسی کن: " + file.name, "user");

  const formData = new FormData();
  formData.append("file", file);

  setBusy(true);
  fileInput.disabled = true;
  uploadButton.textContent = "در حال بررسی...";
  typing.style.display = "block";
  msgs.appendChild(typing);

  fileStatus.style.display = "block";
  fileStatus.textContent = "🌙 مِیبل در حال خواندن و بررسی فایل است...";

  try {
    const response = await fetch("/api/analyze-file", {
      method: "POST",
      body: formData
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "بررسی فایل ناموفق بود.");
    }

    draw(
      "📄 نتیجه بررسی فایل " + (data.filename || file.name) +
      ":\n\n" + (data.reply || "پاسخی دریافت نشد."),
      "bot"
    );

    fileStatus.textContent = "✅ بررسی فایل انجام شد.";
    fileInput.value = "";
  } catch (err) {
    draw("⚠️ " + err.message, "bot");
    fileStatus.textContent = "بررسی فایل انجام نشد.";
  } finally {
    typing.style.display = "none";
    setBusy(false);
    fileInput.disabled = false;
    uploadButton.textContent = "بررسی فایل ✨";
  }
}

function quick(text) {
  input.value = text;
  sendMessage();
}

function clearCurrent() {
  if (current()) {
    current().messages = [];
    save();
    renderChat();
  }
}

input.addEventListener("keydown", e => {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    sendMessage();
  }
});

input.addEventListener("input", () => {
  input.style.height = "43px";
  input.style.height = Math.min(input.scrollHeight, 130) + "px";
});

if (!currentId && chats.length) {
  currentId = chats[0].id;
}

renderHistory();
renderChat();
