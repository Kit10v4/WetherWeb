// ================================================================
// FILE: js/storage.js
// MÔ TẢ: Quản lý localStorage — lịch sử tìm kiếm và preferences
// ================================================================

const Storage = (() => {
  const KEYS = {
    HISTORY: "weatherpro_history",
    UNIT:    "weatherpro_unit",
    THEME:   "weatherpro_theme",
  };

  // ── Lịch sử tìm kiếm ──────────────────────────────────────────

  /**
   * Lấy danh sách lịch sử tìm kiếm
   * @returns {string[]}
   */
  function getHistory() {
    try {
      return JSON.parse(localStorage.getItem(KEYS.HISTORY)) || [];
    } catch {
      return [];
    }
  }

  /**
   * Thêm thành phố vào lịch sử (dedup + đưa lên đầu)
   * @param {string} city
   */
  function addToHistory(city) {
    const trimmed = city.trim();
    if (!trimmed) return;
    let history = getHistory().filter(
      c => c.toLowerCase() !== trimmed.toLowerCase()
    );
    history.unshift(trimmed);
    history = history.slice(0, CONFIG.MAX_HISTORY);
    localStorage.setItem(KEYS.HISTORY, JSON.stringify(history));
  }

  /**
   * Xóa một thành phố khỏi lịch sử
   * @param {string} city
   */
  function removeFromHistory(city) {
    const history = getHistory().filter(
      c => c.toLowerCase() !== city.toLowerCase()
    );
    localStorage.setItem(KEYS.HISTORY, JSON.stringify(history));
  }

  /**
   * Xóa toàn bộ lịch sử tìm kiếm
   */
  function clearHistory() {
    localStorage.removeItem(KEYS.HISTORY);
  }
  
  // ── Đơn vị nhiệt độ ───────────────────────────────────────────

  /**
   * Lấy đơn vị nhiệt độ đang dùng
   * @returns {'C'|'F'}
   */
  function getUnit() {
    return localStorage.getItem(KEYS.UNIT) || "C";
  }

  /**
   * Lưu đơn vị nhiệt độ
   * @param {'C'|'F'} unit
   */
  function setUnit(unit) {
    localStorage.setItem(KEYS.UNIT, unit);
  }

  // ── Theme ──────────────────────────────────────────────────────

  /**
   * Lấy theme hiện tại
   * @returns {'light'|'dark'}
   */
  function getTheme() {
    return localStorage.getItem(KEYS.THEME) || "light";
  }

  /**
   * Lưu theme
   * @param {'light'|'dark'} theme
   */
  function setTheme(theme) {
    localStorage.setItem(KEYS.THEME, theme);
  }
  // ── Weather Cache ──────────────────────────────────────────────

/**
 * Lấy dữ liệu thời tiết từ cache (nếu chưa quá 10 phút)
 * @param {string} city
 * @returns {object|null}
 */
function getCachedWeather(city) {
  try {
    const key    = `weatherpro_cache_${city.toLowerCase()}`;
    const cached = JSON.parse(localStorage.getItem(key));
    if (!cached) return null;

    const TEN_MINUTES = 10 * 60 * 1000;
    const isExpired   = Date.now() - cached.timestamp > TEN_MINUTES;
    return isExpired ? null : cached.data;
  } catch {
    return null;
  }
}
/**
 * Lưu dữ liệu thời tiết vào cache
 * @param {string} city
 * @param {{ weather: object, forecast: object }} data
 */
function setCachedWeather(city, data) {
  const key = `weatherpro_cache_${city.toLowerCase()}`;
  localStorage.setItem(key, JSON.stringify({
    timestamp: Date.now(),
    data
  }));
}
  return {
    getHistory,
    addToHistory,
    removeFromHistory,
    clearHistory,
    getUnit,
    setUnit,
    getTheme,
    setTheme,
    getCachedWeather,
    setCachedWeather
  };
  
})();
