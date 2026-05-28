// ================================================================
// FILE: js/utils.js
// MÔ TẢ: Các hàm tiện ích dùng chung trong toàn bộ ứng dụng
// ================================================================

const Utils = (() => {

  // --- Nhiệt độ ---

  /**
   * Chuyển đổi nhiệt độ Celsius sang Fahrenheit
   * @param {number} celsius
   * @returns {number}
   */
  function celsiusToFahrenheit(celsius) {
    return Math.round(celsius * 9 / 5 + 32);
  }

  /**
   * Hiển thị nhiệt độ theo đơn vị hiện tại
   * @param {number} celsius - Giá trị gốc luôn là Celsius từ API
   * @param {string} unit - 'C' hoặc 'F'
   * @returns {string}
   */
  function formatTemp(celsius, unit = "C") {
    const val = unit === "F" ? celsiusToFahrenheit(celsius) : Math.round(celsius);
    return `${val}°${unit}`;
  }

  // --- Ngày giờ ---

  /**
   * Format Unix timestamp thành chuỗi giờ:phút
   * @param {number} unixTs
   * @returns {string}
   */
  function formatTime(unixTs) {
    return new Date(unixTs * 1000).toLocaleTimeString("vi-VN", {
      hour: "2-digit", minute: "2-digit"
    });
  }

  /**
   * Lấy tên ngày trong tuần viết tắt (T2, T3 ... CN)
   * @param {string|number} dateInput - chuỗi ISO hoặc Unix timestamp (giây)
   * @returns {string}
   */
  function getDayName(dateInput) {
    const days = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];
    const date = typeof dateInput === "number"
      ? new Date(dateInput * 1000)
      : new Date(dateInput);
    return days[date.getDay()];
  }

  // --- Gió ---

  /**
   * Chuyển m/s sang km/h
   * @param {number} ms
   * @returns {number}
   */
  function msToKmh(ms) {
    return Math.round(ms * 3.6);
  }

  // --- Debounce ---

  /**
   * Trì hoãn thực thi hàm cho đến khi người dùng ngừng gõ
   * @param {Function} fn
   * @param {number} delay - ms
   * @returns {Function}
   */
  function debounce(fn, delay = 300) {
    let timer;
    return (...args) => {
      clearTimeout(timer);
      timer = setTimeout(() => fn(...args), delay);
    };
  }

  // --- Visibility ---

  /**
   * Chuyển visibility từ mét sang km, định dạng chuỗi
   * @param {number} meters
   * @returns {string}
   */
  function formatVisibility(meters) {
    if (meters >= 1000) return `${(meters / 1000).toFixed(1)} km`;
    return `${meters} m`;
  }

  // --- String ---

  /**
   * Viết hoa chữ cái đầu mỗi từ
   * @param {string} str
   * @returns {string}
   */
  function capitalize(str) {
    return str.replace(/\b\w/g, c => c.toUpperCase());
  }

  /**
   * Escape ký tự HTML để chèn an toàn vào innerHTML / thuộc tính
   * @param {string} str
   * @returns {string}
   */
  function escapeHtml(str) {
    return String(str ?? "").replace(/[&<>"']/g, c => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    })[c]);
  }
  /**
 * Chuyển tên thành phố tiếng Việt → tên API nhận được
 * Nếu không có trong bảng mapping thì giữ nguyên
 * @param {string} city
 * @returns {string}
 */
function resolveCity(city) {
  const key = city.trim().toLowerCase();
  return CONFIG.CITY_ALIASES[key] || city.trim();
}
  return {
    celsiusToFahrenheit,
    formatTemp,
    formatTime,
    getDayName,
    msToKmh,
    debounce,
    formatVisibility,
    capitalize,
    escapeHtml,
    resolveCity,
  };
})();
