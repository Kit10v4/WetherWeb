const App = (() => {
  let currentUnit = "C";
  let lastWeatherData = null;
  let lastForecastData = null;
  let _activeRequestId = 0;

  function init() {
    currentUnit = Storage.getUnit();
    _applyTheme(Storage.getTheme());
    _applyUnitToggleUI(currentUnit);
    _setupEventListeners();
    WeatherMap.init();

    SearchAutocomplete.init(document.getElementById("search-input"), ({ name, lat, lon }) => {
      searchByCoords(lat, lon, name);
    });

    const lastCity = Storage.getHistory()[0];
    if (lastCity) searchCity(lastCity);
    else searchCity("Hà Nội");
  }

  async function searchCity(city) {
    const apiCity = Utils.resolveCity(city.trim());
    if (!apiCity || apiCity.length < 2) {
      Components.showToast("Vui lòng nhập tên thành phố hợp lệ", "error");
      return;
    }
    Components.hideHistoryDropdown();
    Components.showLoading();
    Timeline.destroy();
    const requestId = ++_activeRequestId;
    try {
      const cacheKey = `${apiCity.toLowerCase()}_${currentUnit}`;
      const cached = Storage.getCachedWeather(cacheKey);
      let weatherData;
      let forecastData;
      if (cached) {
        weatherData = cached.weather;
        forecastData = cached.forecast;
      } else {
        [weatherData, forecastData] = await Promise.all([
          Api.getCurrentWeather(apiCity, currentUnit),
          Api.getForecast(apiCity, currentUnit),
        ]);
        Storage.setCachedWeather(cacheKey, { weather: weatherData, forecast: forecastData });
      }
      if (requestId !== _activeRequestId) return;
      _onDataLoaded(weatherData, forecastData, city);
    } catch (err) {
      if (requestId !== _activeRequestId) return;
      _handleError(err);
    } finally {
      if (requestId === _activeRequestId) Components.hideLoading();
    }
  }

  async function searchByCoords(lat, lon, name) {
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
      Components.showToast("Tọa độ không hợp lệ", "error");
      return;
    }
    Components.showLoading();
    Timeline.destroy();
    const requestId = ++_activeRequestId;
    try {
      const coordKey = `${Number(lat).toFixed(3)}_${Number(lon).toFixed(3)}_${currentUnit}`;
      const cached = Storage.getCachedWeather(coordKey);
      let weatherData;
      let forecastData;
      if (cached) {
        weatherData = cached.weather;
        forecastData = cached.forecast;
      } else {
        [weatherData, forecastData] = await Promise.all([
          Api.getWeatherByCoords(lat, lon, currentUnit),
          Api.getForecastByCoords(lat, lon, currentUnit),
        ]);
        Storage.setCachedWeather(coordKey, { weather: weatherData, forecast: forecastData });
      }
      if (requestId !== _activeRequestId) return;
      _onDataLoaded(weatherData, forecastData, name || weatherData.name);
    } catch (err) {
      if (requestId !== _activeRequestId) return;
      _handleError(err);
    } finally {
      if (requestId === _activeRequestId) Components.hideLoading();
    }
  }

  function _onDataLoaded(weatherData, forecastData, cityInput) {
    lastWeatherData = weatherData;
    lastForecastData = forecastData;

    SidePanel.open(weatherData, forecastData, currentUnit);
    WeatherMap.flyToCity(weatherData.coord.lat, weatherData.coord.lon, weatherData.name, weatherData);

    Timeline.init(forecastData.list, item => {
      SidePanel.updateTimeStep(item, currentUnit);
    });

    renderAlerts(weatherData);
    Storage.addToHistory(cityInput);
    Components.showToast(`Đã cập nhật ${weatherData.name}`, "success");
    PanelManager.checkFAB();
  }

  function _handleError(err) {
    const code = err.code || String(err.status || err.message || "");
    const isNetwork = !navigator.onLine || code === "network";
    const isTimeout = code === "timeout";
    const message = isNetwork
      ? "Mất kết nối internet. Vui lòng kiểm tra mạng."
      : isTimeout
        ? "Kết nối chậm. Vui lòng thử lại."
        : code === "404"
          ? "Không tìm thấy thành phố."
          : code === "429"
            ? "Đang có nhiều yêu cầu. Vui lòng thử lại sau."
            : "Không thể tải dữ liệu thời tiết.";
    Components.showToast(message, "error");
  }

  function _toggleUnit() {
    currentUnit = currentUnit === "C" ? "F" : "C";
    Storage.setUnit(currentUnit);
    _applyUnitToggleUI(currentUnit);
    if (lastWeatherData && lastForecastData) {
      searchByCoords(lastWeatherData.coord.lat, lastWeatherData.coord.lon, lastWeatherData.name);
    }
  }

  function _applyUnitToggleUI(unit) {
    const btnC = document.getElementById("btn-unit-c");
    const btnF = document.getElementById("btn-unit-f");
    if (!btnC || !btnF) return;
    btnC.classList.toggle("unit-active", unit === "C");
    btnF.classList.toggle("unit-active", unit === "F");
  }

  function _toggleTheme() {
    const next = Storage.getTheme() === "light" ? "dark" : "light";
    Storage.setTheme(next);
    _applyTheme(next);
    if (lastWeatherData && lastForecastData) {
      SidePanel.updateUnit(currentUnit, lastWeatherData);
    }
  }

  function _applyTheme(theme) {
    document.documentElement.setAttribute("data-theme", theme);
    const icon = document.getElementById("theme-icon");
    if (icon) icon.textContent = theme === "dark" ? "☀️" : "🌙";
  }

  function _setupEventListeners() {
    const searchInput = document.getElementById("search-input");
    document.getElementById("btn-search")?.addEventListener("click", () => searchCity(searchInput.value));
    searchInput?.addEventListener("keydown", e => {
      if (e.key === "Enter") searchCity(searchInput.value);
      if (e.key === "Escape") Components.hideHistoryDropdown();
    });
    searchInput?.addEventListener("focus", _showHistory);
    searchInput?.addEventListener(
      "input",
      Utils.debounce(() => {
        if (searchInput.value.trim() === "") _showHistory();
      }, 200)
    );
    document.addEventListener("click", e => {
      if (!e.target.closest("#search-wrapper")) Components.hideHistoryDropdown();
    });
    document.getElementById("btn-location")?.addEventListener("click", searchByLocation);
    document.getElementById("btn-unit-c")?.addEventListener("click", () => {
      if (currentUnit !== "C") _toggleUnit();
    });
    document.getElementById("btn-unit-f")?.addEventListener("click", () => {
      if (currentUnit !== "F") _toggleUnit();
    });
    document.getElementById("btn-theme")?.addEventListener("click", _toggleTheme);
    window.addEventListener(
      "resize",
      Utils.debounce(() => WeatherMap.invalidateSize(), 250)
    );
  }

  async function searchByLocation() {
    if (!navigator.geolocation) {
      Components.showToast("Trình duyệt không hỗ trợ định vị", "error");
      return;
    }

    Components.showLoading();
    navigator.geolocation.getCurrentPosition(
      async ({ coords }) => {
        try {
          await searchByCoords(coords.latitude, coords.longitude, "Vị trí của tôi");
        } finally {
          Components.hideLoading();
        }
      },
      () => {
        Components.hideLoading();
        Components.showToast("Không thể lấy vị trí. Vui lòng cho phép GPS", "error");
      }
    );
  }

  function _generateLocalAlerts(weatherData) {
    const alerts = [];
    const { temp, humidity } = weatherData.main;
    const windSpeed = Utils.msToKmh(weatherData.wind.speed);
    const weatherId = weatherData.weather[0].id;

    if (temp > 38) alerts.push({ type: "danger", msg: "⚠️ Nắng nóng gay gắt — Hạn chế ra ngoài 10h-16h" });
    if (humidity > 90) alerts.push({ type: "warning", msg: "💧 Độ ẩm rất cao — Nguy cơ oi bức" });
    if (windSpeed > 60) alerts.push({ type: "danger", msg: "🌪 Gió mạnh cấp 8+ — Cẩn thận khi di chuyển" });
    if (weatherId >= 200 && weatherId < 300) alerts.push({ type: "danger", msg: "⛈ Đang có dông — Tránh khu vực trống trải" });
    if (weatherId >= 500 && weatherId < 600) alerts.push({ type: "warning", msg: "🌧 Đang có mưa — Chuẩn bị áo mưa" });
    return alerts;
  }

  function renderAlerts(weatherData) {
    const alerts = _generateLocalAlerts(weatherData);
    const existing = document.getElementById("alerts-bar");
    if (existing) existing.remove();
    if (alerts.length === 0) return;

    const bar = document.createElement("div");
    bar.id = "alerts-bar";
    bar.innerHTML = alerts.map((a, i) => `
      <div class="alert-item alert-item--${a.type}" data-alert-idx="${i}">
        <span class="alert-text">${a.msg}</span>
        <button class="alert-dismiss" data-idx="${i}" title="Đóng thông báo">✕</button>
      </div>
    `).join("");

    document.getElementById("app-header")?.insertAdjacentElement("afterend", bar);

    bar.querySelectorAll(".alert-dismiss").forEach(btn => {
      btn.addEventListener("click", e => {
        e.stopPropagation();
        const alertItem = btn.closest(".alert-item");
        if (!alertItem) return;
        alertItem.style.opacity = "0";
        alertItem.style.maxHeight = "0";
        alertItem.style.overflow = "hidden";
        alertItem.style.padding = "0";
        setTimeout(() => {
          alertItem.remove();
          if (bar.querySelectorAll(".alert-item").length === 0) {
            bar.remove();
          }
        }, 320);
      });
    });

    alerts.forEach((a, i) => {
      if (a.type !== "danger") {
        setTimeout(() => {
          bar.querySelector(`[data-alert-idx="${i}"]`)?.querySelector(".alert-dismiss")?.click();
        }, 12000);
      }
    });
  }

  function _showHistory() {
    const history = Storage.getHistory();
    Components.renderHistoryDropdown(
      history,
      city => {
        document.getElementById("search-input").value = city;
        searchCity(city);
      },
      city => {
        Storage.removeFromHistory(city);
        _showHistory();
      },
      () => {
        Storage.clearHistory();
        Components.hideHistoryDropdown();
        Components.showToast("Đã xóa toàn bộ lịch sử", "info");
      }
    );
  }

  return { init, searchCity, searchByCoords };
})();

document.addEventListener("DOMContentLoaded", App.init);
