const SidePanel = (() => {
  let _isOpen = false;
  let _forecastData = null;

  function open(weatherData, forecastData, unit) {
    _forecastData = forecastData;
    _isOpen = true;
    let panel = document.getElementById("side-panel");
    if (!panel) {
      panel = document.createElement("div");
      panel.id = "side-panel";
      document.body.appendChild(panel);
    }
    panel.classList.add("side-panel--open");
    panel.innerHTML = _buildHTML(weatherData, forecastData, unit);
    _setupCloseButton(panel);
    setTimeout(() => {
      const daily = Api.filterDailyForecast(forecastData.list);
      Chart.draw("side-chart", daily, unit);
      WeatherMap.invalidateSize();
    }, 90);
  }

  function updateTimeStep(forecastItem, unit) {
    if (!forecastItem) return;
    const tempEl = document.getElementById("sp-temp");
    const descEl = document.getElementById("sp-desc");
    const iconEl = document.getElementById("sp-icon");
    if (tempEl) tempEl.textContent = Utils.formatTemp(forecastItem.main.temp, unit);
    if (descEl) descEl.textContent = Utils.capitalize(forecastItem.weather[0].description);
    if (iconEl) iconEl.src = Api.getIconUrl(forecastItem.weather[0].icon);
  }

  function updateUnit(unit, weatherData) {
    if (!_isOpen || !weatherData || !_forecastData) return;
    open(weatherData, _forecastData, unit);
  }

  function close() {
    _isOpen = false;
    document.getElementById("side-panel")?.classList.remove("side-panel--open");
    setTimeout(() => WeatherMap.invalidateSize(), 120);
  }

  function _buildHTML(w, f, unit) {
    const daily = Api.filterDailyForecast(f.list);
    const forecastCards = daily.map((d, i) => `
      <div class="sp-forecast-item">
        <span>${i === 0 ? "Hôm nay" : Utils.getDayName(d.dt)}</span>
        <img src="${Api.getIconUrl(d.weather[0].icon)}" width="24" height="24" alt="">
        <span>${Utils.formatTemp(d.main.temp_max, unit)}</span>
        <span class="sp-low">${Utils.formatTemp(d.main.temp_min, unit)}</span>
      </div>
    `).join("");

    return `
      <div class="sp-header">
        <div class="sp-city">
          <h2>${w.name}</h2>
          <span class="sp-country">${w.sys.country}</span>
        </div>
        <button class="sp-close" id="sp-close-btn">✕</button>
      </div>

      <div class="sp-main-temp">
        <img id="sp-icon" src="${Api.getIconUrl(w.weather[0].icon)}" alt="" width="64" height="64">
        <span id="sp-temp" class="sp-temp-value">${Utils.formatTemp(w.main.temp, unit)}</span>
      </div>
      <p id="sp-desc" class="sp-desc">${Utils.capitalize(w.weather[0].description)}</p>
      <p class="sp-feels">Cảm giác như ${Utils.formatTemp(w.main.feels_like, unit)}</p>

      <div class="sp-details-grid">
        <div class="sp-detail-item"><span>💧</span><span>Độ ẩm</span><strong>${w.main.humidity}%</strong></div>
        <div class="sp-detail-item"><span>💨</span><span>Gió</span><strong>${Utils.msToKmh(w.wind.speed)} km/h</strong></div>
        <div class="sp-detail-item"><span>👁</span><span>Tầm nhìn</span><strong>${Utils.formatVisibility(w.visibility)}</strong></div>
        <div class="sp-detail-item"><span>🌡</span><span>Áp suất</span><strong>${w.main.pressure} hPa</strong></div>
        <div class="sp-detail-item"><span>🌅</span><span>Bình minh</span><strong>${Utils.formatTime(w.sys.sunrise)}</strong></div>
        <div class="sp-detail-item"><span>🌇</span><span>Hoàng hôn</span><strong>${Utils.formatTime(w.sys.sunset)}</strong></div>
      </div>

      <div class="sp-section-title">📅 Dự báo 5 ngày</div>
      <div class="sp-forecast-list">${forecastCards}</div>

      <div class="sp-section-title">📈 Biểu đồ nhiệt độ</div>
      <div class="sp-chart-wrap">
        <canvas id="side-chart"></canvas>
      </div>

      <div class="sp-section-title">🌡 Chỉ số UV & Không khí</div>
      <div class="sp-aqi-placeholder">
        <p class="sp-coming-soon">📡 Tính năng AQI — Sắp ra mắt</p>
      </div>
    `;
  }

  function _setupCloseButton(panel) {
    panel.querySelector("#sp-close-btn")?.addEventListener("click", close);
  }

  function isOpen() {
    return _isOpen;
  }

  return { open, close, updateTimeStep, updateUnit, isOpen };
})();
