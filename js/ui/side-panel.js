const SidePanel = (() => {
  let _isOpen = false;
  let _isCollapsed = false;
  let _forecastData = null;
  let _lastWeatherData = null;
  let _lastUnit = "C";
  let _lastMetricsRequestId = 0;

  function _pickNumber(...values) {
    for (const v of values) {
      const n = Number(v);
      if (Number.isFinite(n)) return n;
    }
    return null;
  }

  function _sumNumbers(...values) {
    let hasFinite = false;
    const total = values.reduce((sum, v) => {
      const n = Number(v);
      if (!Number.isFinite(n)) return sum;
      hasFinite = true;
      return sum + n;
    }, 0);
    return hasFinite ? total : null;
  }

  function _extractAdvancedMetrics(data) {
    const hourly = data?.hourly || {};
    const times = Array.isArray(hourly.time) ? hourly.time : [];
    const currentTime = data?.current?.time;
    let idx = currentTime ? times.indexOf(currentTime) : -1;
    if (idx < 0 && times.length > 0) idx = 0;

    const uv = _pickNumber(data?.current?.uv_index, hourly?.uv_index?.[idx], data?.daily?.uv_index_max?.[0]);
    const precipitationNow = _sumNumbers(
      data?.current?.precipitation,
      data?.current?.rain,
      data?.current?.showers,
      data?.current?.snowfall
    );
    const rainProbability = _pickNumber(hourly?.precipitation_probability?.[idx], 0);
    const visibility = _pickNumber(data?.current?.visibility, hourly?.visibility?.[idx]);
    const cloudCover = _pickNumber(data?.current?.cloud_cover, hourly?.cloud_cover?.[idx]);
    const pm25 = _pickNumber(data?.current?.pm2_5, hourly?.pm2_5?.[idx]);
    const pm10 = _pickNumber(data?.current?.pm10, hourly?.pm10?.[idx]);
    const ozone = _pickNumber(data?.current?.ozone, hourly?.ozone?.[idx]);

    return { uv, precipitationNow, rainProbability, visibility, cloudCover, pm25, pm10, ozone };
  }

  function _uvCard(uv) {
    if (!Number.isFinite(uv)) return { label: "--", desc: "Không có dữ liệu UV", level: "unknown", progress: 0, icon: "🌫" };
    if (uv < 3) return { label: `${uv.toFixed(1)} • Tốt`, desc: "An toàn cho hoạt động ngoài trời.", level: "good", progress: (uv / 12) * 100, icon: "🟢" };
    if (uv < 6) return { label: `${uv.toFixed(1)} • Trung bình`, desc: "Nên chống nắng khi ra ngoài.", level: "warning", progress: (uv / 12) * 100, icon: "🧴" };
    if (uv < 8) return { label: `${uv.toFixed(1)} • Cao`, desc: "Hạn chế ra nắng lâu, dùng kem chống nắng.", level: "danger", progress: (uv / 12) * 100, icon: "☀️" };
    if (uv < 11) return { label: `${uv.toFixed(1)} • Rất cao`, desc: "Tránh nắng trực tiếp vào buổi trưa.", level: "danger", progress: (uv / 12) * 100, icon: "🔥" };
    return { label: `${uv.toFixed(1)} • Cực cao`, desc: "Nguy cơ cháy nắng rất nhanh, nên ở trong nhà.", level: "danger", progress: 100, icon: "🚨" };
  }

  function _rainCard(precipitationNow, rainProbability) {
    const hasPrecip = Number.isFinite(precipitationNow);
    const prob = Number.isFinite(rainProbability) ? Math.round(rainProbability) : null;
    if (hasPrecip && precipitationNow > 0.2) {
        return {
          label: `${precipitationNow.toFixed(1)} mm/h • Có mưa`,
          desc: prob == null ? "Đang ghi nhận mưa hiện tại." : `Đang có mưa, xác suất ${prob}% trong giờ này.`,
          level: "danger",
          progress: Math.min(100, precipitationNow * 15),
          icon: "🌧",
        };
      }
    if (prob != null && prob >= 60) {
      return { label: `${prob}% • Dễ mưa`, desc: "Hiện tại chưa mưa rõ, nhưng khả năng mưa cao.", level: "warning", progress: prob, icon: "🌦" };
    }
    if (prob != null) {
      return { label: "Không mưa", desc: `Xác suất mưa giờ này khoảng ${prob}%.`, level: "good", progress: prob, icon: "☁️" };
    }
    return { label: "Không mưa", desc: "Không có dữ liệu xác suất mưa.", level: "unknown", progress: 0, icon: "🌫" };
  }

  function _airCard(visibility, cloudCover, pm25, pm10, ozone) {
    const pm25Valid = Number.isFinite(pm25);
    const pm10Valid = Number.isFinite(pm10);
    const ozoneValid = Number.isFinite(ozone);
    if (pm25Valid || pm10Valid || ozoneValid) {
      let level = "good";
      if ((pm25Valid && pm25 > 35) || (pm10Valid && pm10 > 80) || (ozoneValid && ozone > 120)) level = "danger";
      else if ((pm25Valid && pm25 > 15) || (pm10Valid && pm10 > 45) || (ozoneValid && ozone > 80)) level = "warning";
      const parts = [
        pm25Valid ? `PM2.5 ${pm25.toFixed(1)}` : "PM2.5 --",
        pm10Valid ? `PM10 ${pm10.toFixed(1)}` : "PM10 --",
        ozoneValid ? `O₃ ${ozone.toFixed(1)}` : "O₃ --",
      ];
      const label = level === "good" ? "Tốt" : level === "warning" ? "Trung bình" : "Kém";
      const score = (pm25Valid ? Math.min(50, pm25 * 1.6) : 0) + (pm10Valid ? Math.min(35, pm10 * 0.5) : 0) + (ozoneValid ? Math.min(35, ozone * 0.25) : 0);
      return { label, desc: parts.join(" • "), level, progress: Math.min(100, score), icon: level === "good" ? "🫁" : level === "warning" ? "😷" : "⚠️" };
    }
    if (!Number.isFinite(visibility)) return { label: "--", desc: "Không có dữ liệu không khí", level: "unknown", progress: 0, icon: "🌫" };
    const visibilityKm = visibility / 1000;
    const cloudText = Number.isFinite(cloudCover) ? `Mây ${Math.round(cloudCover)}%` : "Mây --";
    if (visibilityKm >= 10) return { label: "Tốt", desc: `Tầm nhìn ${visibilityKm.toFixed(1)} km • ${cloudText}`, level: "good", progress: 25, icon: "🫁" };
    if (visibilityKm >= 5) return { label: "Trung bình", desc: `Tầm nhìn ${visibilityKm.toFixed(1)} km • ${cloudText}`, level: "warning", progress: 55, icon: "😷" };
    return { label: "Kém", desc: `Tầm nhìn ${visibilityKm.toFixed(1)} km • ${cloudText}`, level: "danger", progress: 85, icon: "⚠️" };
  }

  function _setMetricCard(type, info) {
    const card = document.getElementById(`sp-${type}-card`);
    const valueEl = document.getElementById(`sp-${type}-value`);
    const descEl = document.getElementById(`sp-${type}-desc`);
    const progressEl = document.getElementById(`sp-${type}-progress`);
    if (!card || !valueEl || !descEl) return;
    valueEl.textContent = `${info.icon ? `${info.icon} ` : ""}${info.label}`;
    descEl.textContent = info.desc;
    if (progressEl) progressEl.style.width = `${Math.max(0, Math.min(100, Number(info.progress) || 0))}%`;
    card.setAttribute("aria-label", `${type.toUpperCase()}: ${info.label}. ${info.desc}`);
    card.classList.remove("sp-env-good", "sp-env-warning", "sp-env-danger", "sp-env-unknown");
    card.classList.add(
      info.level === "good"
        ? "sp-env-good"
        : info.level === "warning"
          ? "sp-env-warning"
          : info.level === "danger"
            ? "sp-env-danger"
            : "sp-env-unknown"
    );
  }

  function _renderAdvancedMetrics(metrics) {
    _setMetricCard("uv", _uvCard(metrics.uv));
    _setMetricCard("rain", _rainCard(metrics.precipitationNow, metrics.rainProbability));
    _setMetricCard("air", _airCard(metrics.visibility, metrics.cloudCover, metrics.pm25, metrics.pm10, metrics.ozone));
  }

  function _renderAdvancedMetricsError(message) {
    _setMetricCard("uv", { label: "--", desc: message, level: "unknown" });
    _setMetricCard("rain", { label: "--", desc: message, level: "unknown" });
    _setMetricCard("air", { label: "--", desc: message, level: "unknown" });
  }

  function _loadAdvancedMetrics(lat, lon) {
    const requestId = ++_lastMetricsRequestId;
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
      _renderAdvancedMetricsError("Không có tọa độ để lấy UV và không khí.");
      return;
    }
    OpenMeteoApi.getAdvancedMetrics(lat, lon)
      .then(data => {
        if (requestId !== _lastMetricsRequestId) return;
        _renderAdvancedMetrics(_extractAdvancedMetrics(data));
      })
      .catch(() => {
        if (requestId !== _lastMetricsRequestId) return;
        _renderAdvancedMetricsError("Không tải được dữ liệu UV và không khí.");
      });
  }

  function open(weatherData, forecastData, unit) {
    _forecastData = forecastData;
    _lastWeatherData = weatherData;
    _lastUnit = unit;
    _isOpen = true;
    _isCollapsed = false;
    document.getElementById("sp-reopen-btn")?.remove();
    let panel = document.getElementById("side-panel");
    if (!panel) {
      panel = document.createElement("div");
      panel.id = "side-panel";
      document.body.appendChild(panel);
    }
    panel.classList.remove("side-panel--collapsed");
    panel.classList.add("side-panel--open");
    panel.innerHTML = _buildHTML(weatherData, forecastData, unit);
    _setupCloseButton(panel);
    setTimeout(() => {
      const daily = Api.filterDailyForecast(forecastData.list);
      Chart.draw("side-chart", daily, unit);
      _loadAdvancedMetrics(weatherData?.coord?.lat, weatherData?.coord?.lon);
      WeatherMap.invalidateSize();
      PanelManager.checkFAB();
    }, 350);
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
    _isCollapsed = false;
    const panel = document.getElementById("side-panel");
    panel?.classList.remove("side-panel--open", "side-panel--collapsed");
    _createReopenBtn();
    setTimeout(() => {
      WeatherMap.invalidateSize();
      PanelManager.checkFAB();
    }, 350);
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
        <div class="sp-header-actions">
          <button class="sp-collapse" id="sp-collapse-btn" title="Thu gọn panel">◀</button>
          <button class="sp-close" id="sp-close-btn" title="Đóng">✕</button>
        </div>
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
      <div class="sp-env-grid" id="sp-env-grid">
        <div class="sp-env-card" id="sp-uv-card">
          <div class="sp-env-title">UV hiện tại</div>
          <div class="sp-env-value" id="sp-uv-value">--</div>
          <div class="sp-env-progress"><span id="sp-uv-progress"></span></div>
          <div class="sp-env-desc" id="sp-uv-desc">Đang tải dữ liệu...</div>
        </div>
        <div class="sp-env-card" id="sp-rain-card">
          <div class="sp-env-title">Mưa hiện tại</div>
          <div class="sp-env-value" id="sp-rain-value">--</div>
          <div class="sp-env-progress"><span id="sp-rain-progress"></span></div>
          <div class="sp-env-desc" id="sp-rain-desc">Đang tải dữ liệu...</div>
        </div>
        <div class="sp-env-card" id="sp-air-card">
          <div class="sp-env-title">Không khí</div>
          <div class="sp-env-value" id="sp-air-value">--</div>
          <div class="sp-env-progress"><span id="sp-air-progress"></span></div>
          <div class="sp-env-desc" id="sp-air-desc">Đang tải dữ liệu...</div>
        </div>
      </div>
      <div class="sp-collapse-tab">Weather Info</div>
    `;
  }

  function _setupCloseButton(panel) {
    panel.querySelector("#sp-close-btn")?.addEventListener("click", close);
    panel.querySelector("#sp-collapse-btn")?.addEventListener("click", toggleCollapse);
  }

  function toggleCollapse() {
    const panel = document.getElementById("side-panel");
    const btn = document.getElementById("sp-collapse-btn");
    if (!panel) return;
    _isCollapsed = !_isCollapsed;

    if (_isCollapsed) {
      panel.classList.add("side-panel--collapsed");
      if (btn) {
        btn.textContent = "▶";
        btn.title = "Mở rộng panel";
      }
    } else {
      panel.classList.remove("side-panel--collapsed");
      if (btn) {
        btn.textContent = "◀";
        btn.title = "Thu gọn panel";
      }
    }

    setTimeout(() => {
      WeatherMap.invalidateSize();
      PanelManager.checkFAB();
    }, 350);
  }

  function _createReopenBtn() {
    if (!_lastWeatherData || !_forecastData) return;
    let btn = document.getElementById("sp-reopen-btn");
    if (!btn) {
      btn = document.createElement("button");
      btn.id = "sp-reopen-btn";
      btn.innerHTML = `<span>📍</span><span class="sp-reopen-label">Thông tin</span>`;
      document.body.appendChild(btn);
    }
    btn.onclick = () => {
      btn.remove();
      open(_lastWeatherData, _forecastData, _lastUnit);
    };
  }

  function reopenFromFab() {
    if (_isOpen) {
      if (_isCollapsed) toggleCollapse();
      return;
    }
    document.getElementById("sp-reopen-btn")?.click();
  }

  function isOpen() {
    return _isOpen;
  }

  return { open, close, updateTimeStep, updateUnit, isOpen, toggleCollapse, reopenFromFab };
})();
