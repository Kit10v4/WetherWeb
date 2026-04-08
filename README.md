# ⛅ WeatherWeb — Ứng dụng Dự báo Thời tiết

WeatherWeb là một ứng dụng web dự báo thời tiết hiện đại, sử dụng OpenWeatherMap API để cung cấp thông tin thời tiết chính xác và chi tiết. Với giao diện thân thiện, tính năng đa dạng và hiệu suất tối ưu, WeatherWeb giúp bạn dễ dàng theo dõi thời tiết ở bất kỳ đâu.

## 🚀 WEB

https://weatherbasic.vercel.app/

## 📁 Cấu trúc

```
weatherpro/
├── index.html          ← Giao diện chính
├── config.js           ← API key (không commit!)
├── css/style.css       ← Custom CSS + animations
├── js/
│   ├── app.js          ← Entry point
│   ├── api.js          ← Fetch OpenWeatherMap
│   ├── utils.js        ← Helper functions
│   ├── storage.js      ← localStorage
│   ├── chart.js        ← Biểu đồ Canvas
│   └── ui/
│       ├── current.js  ← Render thời tiết hiện tại
│       ├── forecast.js ← Render dự báo 5 ngày
│       └── components.js ← Toast, spinner, dropdown
└── assets/
    └── images/hero-bg.jpg
```

## ✨ Tính năng

- 🔍 Tìm kiếm thời tiết theo tên thành phố
- 📍 Định vị GPS tự động
- 📅 Dự báo 5 ngày với biểu đồ nhiệt độ
- 🌡 Toggle °C / °F
- 🕐 Lịch sử tìm kiếm (localStorage)
- 🌙 Dark mode
- 📱 Responsive (Mobile / Tablet / Desktop)

## 🧭 Lộ trình nâng cấp dần lên trải nghiệm kiểu Windy.com

> Không thể sao chép 1:1 Windy.com trong một lần, nhưng có thể đi theo từng chặng để đạt trải nghiệm tương tự.

### Giai đoạn 1 — Nền tảng bản đồ tương tác (đã bắt đầu)
- [x] Bản đồ với nhiều lớp dữ liệu (mưa, mây, nhiệt độ, gió, áp suất).
- [x] Bảng điều khiển lớp phủ kiểu “map-first”.
- [x] Điều chỉnh độ đậm lớp phủ + nút định vị nhanh + toàn màn hình.

### Giai đoạn 2 — Dữ liệu sâu theo điểm (Point Forecast)
- [ ] Click điểm bất kỳ trên bản đồ để mở “forecast panel” chi tiết theo giờ.
- [ ] Bổ sung các thông số gần giống Windy: CAPE, mưa tích lũy, gust, freezing level...
- [ ] Timeline theo giờ (24–72h), có scrub + play/pause.

### Giai đoạn 3 — Trải nghiệm chuyên nghiệp
- [ ] So sánh mô hình dự báo (ECMWF / GFS nếu có nguồn dữ liệu phù hợp).
- [ ] Overlay hạt gió (particle animation), isolines đẳng áp/đẳng nhiệt.
- [ ] Cảnh báo thời tiết nguy hiểm theo khu vực.

### Giai đoạn 4 — Sản phẩm hoàn thiện
- [ ] Tài khoản người dùng, lưu địa điểm yêu thích, đồng bộ cloud.
- [ ] PWA + offline cache + push notifications.
- [ ] Tối ưu hiệu năng bản đồ lớn (tile caching, worker, lazy layer loading).

## 🛠 Công nghệ

- HTML5 · Tailwind CSS · Vanilla JavaScript ES6+
- OpenWeatherMap API
- HTML5 Canvas API
- Leaflet.js (bản đồ)

## ☁️ Kiến trúc serverless (Vercel Functions)

Để tiến gần hơn mô hình production như các ứng dụng thời tiết lớn:

- Frontend chỉ gọi API nội bộ:
  - `GET /api/current?city=...` hoặc `?lat=...&lon=...`
  - `GET /api/forecast?city=...` hoặc `?lat=...&lon=...`
- Serverless function mới sẽ gọi OpenWeatherMap bằng `OWM_API_KEY` từ environment variable.
- Lợi ích:
  - Tách lớp dữ liệu khỏi UI,
  - Dễ thêm rate-limit/cache ở phía serverless,
  - Không để luồng gọi dữ liệu thời tiết phụ thuộc trực tiếp vào client.

> Gợi ý mở rộng tiếp: thêm cache KV (Upstash/Redis) cho cặp key `city|lat,lon` với TTL 5–10 phút để giảm chi phí và tăng tốc độ phản hồi.
