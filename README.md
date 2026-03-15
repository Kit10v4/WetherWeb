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

## 🛠 Công nghệ

- HTML5 · Tailwind CSS · Vanilla JavaScript ES6+
- OpenWeatherMap API
- HTML5 Canvas API
- Leaflet.js (bản đồ)
