// ================================================================
// FILE: js/api.js
// MÔ TẢ: Tất cả lời gọi fetch tới OpenWeatherMap API
// ================================================================

const Api = (() => {

  /**
   * Hàm fetch nội bộ — xử lý lỗi HTTP tập trung
   * @param {string} url
   * @returns {Promise<object>}
   */
  async function _fetch(url) {
    const res = await fetch(url);
    if (!res.ok) {
      // Ném lỗi kèm status code để ui xử lý thông báo phù hợp
      throw new Error(String(res.status));
    }
    return res.json();
  }

  /**
   * Lấy thời tiết hiện tại theo tên thành phố
   * @param {string} city
   * @returns {Promise<object>} - WeatherData object
   */
  async function getCurrentWeather(city) {
    const url = `${CONFIG.BASE_URL}/weather?q=${encodeURIComponent(city)}&appid=${CONFIG.API_KEY}&units=metric&lang=vi`;
    return _fetch(url);
  }

  /**
   * Lấy dự báo 5 ngày (mỗi 3 giờ) theo tên thành phố
   * @param {string} city
   * @returns {Promise<object>} - ForecastData object
   */
  async function getForecast(city) {
    const url = `${CONFIG.BASE_URL}/forecast?q=${encodeURIComponent(city)}&appid=${CONFIG.API_KEY}&units=metric&cnt=40`;
    return _fetch(url);
  }

  /**
   * Lấy thời tiết hiện tại theo tọa độ GPS
   * @param {number} lat
   * @param {number} lon
   * @returns {Promise<object>}
   */
  async function getWeatherByCoords(lat, lon) {
    const url = `${CONFIG.BASE_URL}/weather?lat=${lat}&lon=${lon}&appid=${CONFIG.API_KEY}&units=metric&lang=vi`;
    return _fetch(url);
  }

  /**
   * Lấy dự báo 5 ngày theo tọa độ GPS
   * @param {number} lat
   * @param {number} lon
   * @returns {Promise<object>}
   */
  async function getForecastByCoords(lat, lon) {
    const url = `${CONFIG.BASE_URL}/forecast?lat=${lat}&lon=${lon}&appid=${CONFIG.API_KEY}&units=metric&cnt=40`;
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
