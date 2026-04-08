// ================================================================
// FILE: js/api.js
// MÔ TẢ: Tất cả lời gọi fetch tới OpenWeatherMap API
// ================================================================

const Api = (() => {
  function _buildUnits(unit = "C") {
    return unit === "F" ? "imperial" : "metric";
  }

  function _buildError(message, status, code) {
    const err = new Error(message);
    err.status = status;
    err.code = code || String(status || "unknown");
    return err;
  }

  /**
   * Hàm fetch nội bộ — xử lý lỗi HTTP tập trung
   * @param {string} url
    * @returns {Promise<object>}
   */
  async function _fetch(url, timeoutMs = 12000) {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), timeoutMs);
    try {
      const res = await fetch(url, { signal: ctrl.signal });
      let data = null;
      try {
        data = await res.json();
      } catch {
        data = null;
      }
      if (!res.ok) {
        const message = data?.error || data?.message || `Lỗi ${res.status}`;
        throw _buildError(message, res.status, String(res.status));
      }
      return data;
    } catch (err) {
      if (err.name === "AbortError") {
        throw _buildError("Yêu cầu quá thời gian chờ", 0, "timeout");
      }
      if (err.status || err.code) throw err;
      throw _buildError("Không thể kết nối máy chủ", 0, "network");
    } finally {
      clearTimeout(timer);
    }
  }

  /**
   * Lấy thời tiết hiện tại theo tên thành phố
   * @param {string} city
   * @returns {Promise<object>} - WeatherData object
   */
  async function getCurrentWeather(city, unit = "C") {
    const url = `/api/weather?city=${encodeURIComponent(city)}&units=${_buildUnits(unit)}&lang=vi`;
    return _fetch(url);
  }

  /**
   * Lấy dự báo 5 ngày (mỗi 3 giờ) theo tên thành phố
   * @param {string} city
   * @returns {Promise<object>} - ForecastData object
   */
  async function getForecast(city, unit = "C") {
    const url = `/api/forecast?city=${encodeURIComponent(city)}&units=${_buildUnits(unit)}&lang=vi`;
    return _fetch(url);
  }

  /**
   * Lấy thời tiết hiện tại theo tọa độ GPS
   * @param {number} lat
   * @param {number} lon
   * @returns {Promise<object>}
   */
  async function getWeatherByCoords(lat, lon, unit = "C") {
    const url = `/api/weather-coords?lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lon)}&units=${_buildUnits(unit)}&lang=vi`;
    return _fetch(url);
  }

  /**
   * Lấy dự báo 5 ngày theo tọa độ GPS
   * @param {number} lat
   * @param {number} lon
   * @returns {Promise<object>}
   */
  async function getForecastByCoords(lat, lon, unit = "C") {
    const url = `/api/forecast-coords?lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lon)}&units=${_buildUnits(unit)}&lang=vi`;
    return _fetch(url);
  }

  /**
   * Tạo URL icon thời tiết từ mã icon API
   * @param {string} iconCode - VD: "01d", "10n"
   * @returns {string}
   */
  function getIconUrl(iconCode) {
    return `${CONFIG.ICON_URL}/${iconCode}@2x.png`;
  }

  /**
   * Lọc dự báo 5 ngày: lấy 1 entry mỗi ngày lúc 12:00 trưa
   * @param {Array} forecastList - Mảng từ API /forecast
   * @returns {Array} - Mảng 5 phần tử
   */
  function filterDailyForecast(forecastList) {
    return forecastList
      .filter(item => item.dt_txt.includes("12:00:00"))
      .slice(0, 5);
  }

  return {
    getCurrentWeather,
    getForecast,
    getWeatherByCoords,
    getForecastByCoords,
    getIconUrl,
    filterDailyForecast,
  };
})();
