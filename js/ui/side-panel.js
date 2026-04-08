const SidePanel = (() => {
  let _isOpen = false;
  let _isCollapsed = false;
  let _forecastData = null;
  let _lastWeatherData = null;
  let _lastUnit = "C";
  let _metricsReqToken = 0;
  let _lastAdvanced = null;

  function _getUvLevel(uv) {
    if (uv == null || Number.isNaN(uv)) return { level: "Không rõ", color: "muted", icon: "❔", msg: "Chưa có dữ liệu UV" };
    if (uv <= 2) return { level: "Tốt", color: "good", icon: "🟢", msg: "An toàn cho hoạt động ngoài trời." };
    if (uv <= 5) return { level: "Trung bình", color: "moderate", icon: "🟡", msg: "Nên bôi kem chống nắng khi ra ngoài lâu." };
    if (uv <= 7) return { level: "Cao", color: "high", icon: "🟠", msg: "Hạn chế nắng gắt 10h-16h, nên đội mũ." };
    return { level: "Rất cao", color: "danger", icon: "🔴", msg: "Tránh nắng trực tiếp, ưu tiên ở trong nhà." };
  }

  function _getAirProxyLevel(visibilityKm, cloudcover) {
    if (visibilityKm >= 10 && cloudcover < 60) {
      return { level: "Tốt", color: "good", icon: "🟢", msg: "Không khí tương đối trong lành." };
    }
    if (visibilityKm >= 6) {
      return { level: "Trung bình", color: "moderate", icon: "🟡", msg: "Chấp nhận được, nhóm nhạy cảm nên theo dõi." };
    }
    return { level: "Xấu", color: "danger", icon: "🔴", msg: "Tầm nhìn thấp, nên hạn chế vận động ngoài trời." };
  }

  function _renderAdvancedMetrics(lat, lon) {
    const target = document.getElementById("sp-advanced-metrics");
    if (!target) return;
    target.innerHTML = `<p class="sp-coming-soon">Đang tải dữ liệu UV & Không khí...</p>`;
    OpenMeteoApi.getAdvancedMetrics(lat, lon)
      .then(data => {
        _lastAdvanced = data;
        const uv = data?.hourly?.uv_index?.[0];
        const visibilityM = data?.hourly?.visibility?.[0];
        const cloud = data?.hourly?.cloudcover?.[0] ?? 0;
        const visibilityKm = visibilityM ? visibilityM / 1000 : 0;
        const uvState = _getUvLevel(uv);
        const airState = _getAirProxyLevel(visibilityKm, cloud);
        target.innerHTML = `
          <div class="sp-adv-card sp-adv-${uvState.color}">
            <div class="sp-adv-title">${uvState.icon} UV: <strong>${uv == null ? "--" : uv.toFixed(1)}</strong> · ${uvState.level}</div>
            <p class="sp-adv-msg">${uvState.msg}</p>
          </div>
          <div class="sp-adv-card sp-adv-${airState.color}">
            <div class="sp-adv-title">${airState.icon} Không khí: <strong>${airState.level}</strong></div>
            <p class="sp-adv-msg">${airState.msg} (Tầm nhìn: ${visibilityKm ? visibilityKm.toFixed(1) : "--"} km)</p>
          </div>
        `;
      })
      .catch(() => {
        target.innerHTML = `<p class="sp-coming-soon">Không tải được UV/Không khí. Vui lòng thử lại.</p>`;
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
    _metricsReqToken += 1;
    _loadAdvancedMetrics(weatherData?.coord?.lat, weatherData?.coord?.lon, _metricsReqToken);
    _setupCloseButton(panel);
    setTimeout(() => {
      const daily = Api.filterDailyForecast(forecastData.list);
      Chart.draw("side-chart", daily, unit);
      _renderAdvancedMetrics(weatherData.coord?.lat, weatherData.coord?.lon);
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
          <div class="sp-env-desc" id="sp-uv-desc">Đang tải dữ liệu...</div>
        </div>
        <div class="sp-env-card" id="sp-rain-card">
          <div class="sp-env-title">Mưa hiện tại</div>
          <div class="sp-env-value" id="sp-rain-value">--</div>
          <div class="sp-env-desc" id="sp-rain-desc">Đang tải dữ liệu...</div>
        </div>
        <div class="sp-env-card" id="sp-air-card">
          <div class="sp-env-title">Không khí</div>
          <div class="sp-env-value" id="sp-air-value">--</div>
          <div class="sp-env-desc" id="sp-air-desc">Đang tải dữ liệu...</div>
        </div>
      <div class="sp-aqi-placeholder" id="sp-advanced-metrics" aria-live="polite">
        <p class="sp-coming-soon">📡 Đang tải dữ liệu UV & Không khí...</p>
      </div>
      <div class="sp-collapse-tab">Weather Info</div>
    `;
  }

  async function _loadAdvancedMetrics(lat, lon, token) {
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
      _renderAdvancedMetricsError("Không có tọa độ để lấy UV/mưa hiện tại");
      return;
    }
    try {
      const data = await OpenMeteoApi.getAdvancedMetrics(lat, lon);
      if (token !== _metricsReqToken) return;
      const metrics = _extractAdvancedMetrics(data);
      _renderAdvancedMetrics(metrics);
    } catch {
      if (token !== _metricsReqToken) return;
      _renderAdvancedMetricsError("Không tải được dữ liệu UV/mưa hiện tại");
    }
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

    return { uv, precipitationNow, rainProbability, visibility, cloudCover };
  }

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

  function _renderAdvancedMetrics(metrics) {
    const uvInfo = _getUvLevel(metrics.uv);
    const rainInfo = _getRainLevel(metrics.precipitationNow, metrics.rainProbability);
    const airInfo = _getAirQuality(metrics.visibility, metrics.cloudCover);

    _setMetricCard("uv", uvInfo);
    _setMetricCard("rain", rainInfo);
    _setMetricCard("air", airInfo);
  }

  function _renderAdvancedMetricsError(message) {
    _setMetricCard("uv", { label: "--", desc: message, level: "unknown" });
    _setMetricCard("rain", { label: "--", desc: message, level: "unknown" });
    _setMetricCard("air", { label: "--", desc: message, level: "unknown" });
  }

  function _setMetricCard(type, info) {
    const card = document.getElementById(`sp-${type}-card`);
    const valueEl = document.getElementById(`sp-${type}-value`);
    const descEl = document.getElementById(`sp-${type}-desc`);
    if (!card || !valueEl || !descEl) return;
    valueEl.textContent = info.label;
    descEl.textContent = info.desc;
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

  function _getUvLevel(uv) {
    if (!Number.isFinite(uv)) {
      return { label: "--", desc: "Không có dữ liệu UV", level: "unknown" };
    }
    if (uv < 3) {
      return { label: `${uv.toFixed(1)} • Tốt`, desc: "An toàn cho hoạt động ngoài trời.", level: "good" };
    }
    if (uv < 6) {
      return { label: `${uv.toFixed(1)} • Trung bình`, desc: "Nên chống nắng khi ra ngoài.", level: "warning" };
    }
    if (uv < 8) {
      return { label: `${uv.toFixed(1)} • Cao`, desc: "Hạn chế ra nắng lâu, dùng kem chống nắng.", level: "danger" };
    }
    if (uv < 11) {
      return { label: `${uv.toFixed(1)} • Rất cao`, desc: "Tránh nắng trực tiếp vào buổi trưa.", level: "danger" };
    }
    return { label: `${uv.toFixed(1)} • Cực cao`, desc: "Nguy cơ cháy nắng rất nhanh, nên ở trong nhà.", level: "danger" };
  }

  function _getRainLevel(precipitationNow, rainProbability) {
    const hasPrecip = Number.isFinite(precipitationNow);
    const prob = Number.isFinite(rainProbability) ? Math.round(rainProbability) : null;
    if (hasPrecip && precipitationNow > 0.2) {
      return {
        label: `${precipitationNow.toFixed(1)} mm/h • Có mưa`,
        desc: prob === null ? "Đang ghi nhận mưa hiện tại." : `Đang có mưa, xác suất ${prob}% trong giờ này.`,
        level: "danger",
      };
    }
    if (prob !== null && prob >= 60) {
      return { label: `${prob}% • Dễ mưa`, desc: "Hiện tại chưa mưa rõ, nhưng khả năng mưa cao.", level: "warning" };
    }
    if (prob !== null) {
      return { label: "Không mưa", desc: `Xác suất mưa giờ này khoảng ${prob}%.`, level: "good" };
    }
    return { label: "Không mưa", desc: "Không có dữ liệu xác suất mưa.", level: "unknown" };
  }

  function _getAirQuality(visibility, cloudCover) {
    if (!Number.isFinite(visibility)) {
      return { label: "--", desc: "Không có dữ liệu tầm nhìn", level: "unknown" };
    }
    const visibilityKm = visibility / 1000;
    const cloudText = Number.isFinite(cloudCover) ? `Mây ${Math.round(cloudCover)}%` : "Mây --";

    if (visibilityKm >= 10) {
      return { label: "Tốt", desc: `Tầm nhìn ${visibilityKm.toFixed(1)} km • ${cloudText}`, level: "good" };
    }
    if (visibilityKm >= 5) {
      return { label: "Trung bình", desc: `Tầm nhìn ${visibilityKm.toFixed(1)} km • ${cloudText}`, level: "warning" };
    }
    return { label: "Kém", desc: `Tầm nhìn ${visibilityKm.toFixed(1)} km • ${cloudText}`, level: "danger" };
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
