// ================================================================
// FILE: config.template.js  ← committed to git
// Build script sẽ tạo config.js từ file này + env var OWM_API_KEY
// ================================================================

const CONFIG = {
  API_KEY: "{{OWM_API_KEY}}",
  BASE_URL: "https://api.openweathermap.org/data/2.5",
  ICON_URL: "https://openweathermap.org/img/wn",

  SUGGESTED_CITIES: [
    "Hà Nội", "TP. Hồ Chí Minh", "Đà Nẵng", "Cần Thơ",
    "Hải Phòng", "Singapore", "Bangkok", "Tokyo"
  ],

  MAX_HISTORY: 10,
  TOAST_DURATION: 4000,

  CITY_ALIASES: {
    "tp. hồ chí minh": "Ho Chi Minh City",
    "tp hồ chí minh":  "Ho Chi Minh City",
    "hồ chí minh":     "Ho Chi Minh City",
    "tphcm":           "Ho Chi Minh City",
    "sài gòn":         "Ho Chi Minh City",
    "hà nội":          "Hanoi",
    "hà nôi":          "Hanoi",
    "đà nẵng":         "Da Nang",
    "đà nẳng":         "Da Nang",
    "cần thơ":         "Can Tho",
    "hải phòng":       "Hai Phong",
    "huế":             "Hue",
    "nha trang":       "Nha Trang",
    "vũng tàu":        "Vung Tau",
    "đà lạt":          "Da Lat",
    "buôn ma thuột":   "Buon Ma Thuot",
    "quy nhơn":        "Quy Nhon",
  },
};
