// ================================================================
// FILE: js/ui/current.js
// MÔ TẢ: Render thẻ thời tiết hiện tại và 6 thẻ chi tiết
// ================================================================

const CurrentUI = (() => {

  // Cache DOM references để không query lại nhiều lần
  const el = {
    section:     () => document.getElementById("current-section"),
    cityName:    () => document.getElementById("city-name"),
    countryFlag: () => document.getElementById("country-flag"),
    datetime:    () => document.getElementById("current-datetime"),
    temp:        () => document.getElementById("current-temp"),
    feelsLike:   () => document.getElementById("feels-like"),
    tempRange:   () => document.getElementById("temp-range"),
    weatherIcon: () => document.getElementById("weather-icon"),
    description: () => document.getElementById("weather-desc"),
    humidity:    () => document.getElementById("detail-humidity"),
    wind:        () => document.getElementById("detail-wind"),
    visibility:  () => document.getElementById("detail-visibility"),
    pressure:    () => document.getElementById("detail-pressure"),
    sunrise:     () => document.getElementById("detail-sunrise"),
    sunset:      () => document.getElementById("detail-sunset"),
  };

  // Dữ liệu gốc (Celsius) — giữ để toggle đơn vị không cần gọi lại API
  let _data = null;

  /**
   * Render toàn bộ thẻ thời tiết hiện tại
   * @param {object} data - Kết quả từ Api.getCurrentWeather()
   * @param {string} unit - 'C' hoặc 'F'
   */
  function render(data, unit = "C") {
    _data = data;
    const section = el.section();
    if (!section) return;
    section.classList.remove("hidden");

    // Tên thành phố + quốc gia
    el.cityName()   && (el.cityName().textContent   = data.name);
    el.countryFlag() && (el.countryFlag().textContent = `, ${data.sys.country}`);

    // Ngày giờ hiện tại
    el.datetime() && (el.datetime().textContent = Utils.getCurrentDateTime());

    // Icon thời tiết
    if (el.weatherIcon()) {
      el.weatherIcon().src = Api.getIconUrl(data.weather[0].icon);
      el.weatherIcon().alt = data.weather[0].description;
    }

    // Mô tả
    el.description() && (el.description().textContent = Utils.capitalize(data.weather[0].description));

    // Nhiệt độ (dùng hàm cập nhật riêng để toggle đơn vị dễ dàng)
    _updateTemps(unit);

    // Chi tiết
    _updateDetails(data);

    // Animation fade-in
    section.classList.add("fade-in");
  }

  /**
   * Cập nhật phần hiển thị nhiệt độ khi toggle đơn vị
   * @param {string} unit
   */
  function updateUnit(unit) {
    if (!_data) return;
    _updateTemps(unit);
  }

  /** Cập nhật các giá trị nhiệt độ */
  function _updateTemps(unit) {
    if (!_data) return;
    const { temp, feels_like, temp_min, temp_max } = _data.main;

    el.temp()     && (el.temp().textContent     = Utils.formatTemp(temp,       unit));
    el.feelsLike() && (el.feelsLike().textContent = `Cảm giác như ${Utils.formatTemp(feels_like, unit)}`);
    el.tempRange() && (el.tempRange().textContent =
      `↓ ${Utils.formatTemp(temp_min, unit)}  ↑ ${Utils.formatTemp(temp_max, unit)}`);
  }

  /** Cập nhật 6 thẻ chi tiết (không thay đổi theo đơn vị) */
  function _updateDetails(data) {
    const { humidity, pressure } = data.main;
    const { speed: windSpeed, deg: windDeg } = data.wind;
    const { visibility, sys: { sunrise, sunset } } = data;

    _setText("detail-humidity",   `${humidity}%`);
    _setText("detail-wind",       `${Utils.msToKmh(windSpeed)} km/h ${Utils.getWindDirection(windDeg)}`);
    _setText("detail-visibility", Utils.formatVisibility(visibility));
    _setText("detail-pressure",   `${pressure} hPa`);
    _setText("detail-sunrise",    Utils.formatTime(sunrise));
    _setText("detail-sunset",     Utils.formatTime(sunset));
  }

  /** Tiện ích set text an toàn */
  function _setText(id, value) {
    const el = document.getElementById(id);
    if (el) el.textContent = value;
  }

  return { render, updateUnit };
})();
