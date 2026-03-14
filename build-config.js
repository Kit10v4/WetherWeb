// build-config.js — chạy bởi Vercel trước khi deploy
// Đọc config.template.js, thay {{OWM_API_KEY}} bằng env var, ghi ra config.js
const fs = require("fs");

const apiKey = process.env.OWM_API_KEY;
if (!apiKey) {
  console.error("[build-config] ❌ Thiếu env var OWM_API_KEY — set trên Vercel Dashboard");
  process.exit(1);
}

const template = fs.readFileSync("config.template.js", "utf8");
const output   = template.replace("{{OWM_API_KEY}}", apiKey);
fs.writeFileSync("config.js", output);
console.log("[build-config] ✅ config.js đã được tạo từ OWM_API_KEY");
