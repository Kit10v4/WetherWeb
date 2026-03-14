// ================================================================
// FILE: js/app.js
// MÔ TẢ: Entry point — khởi tạo app, event listeners, điều phối
// ================================================================

const App = (() => {

  // ── State ────────────────────────────────────────────────────────
  let currentUnit = "C";

  // ── Init ─────────────────────────────────────────────────────────

  function init() {
    currentUnit = Storage.getUnit();
    _applyTheme(Storage.getTheme());
    _renderSuggestedCities();
    _setupEventListeners();
    _applyUnitToggleUI(currentUnit);

    // Tự động tải thành phố cuối cùng đã xem (nếu có)
    const lastCity = Storage.getHistory()[0];
    if (lastCity) searchCity(lastCity);
  }

  // ── Search ───────────────────────────────────────────────────────

  /**
   * Thực hiện tìm kiếm thời tiết theo tên thành phố
   * @param {string} city
   */
  async function searchCity(city) {
    const trimmed = city.trim();
    const apiCity  = Utils.resolveCity(trimmed);
    // Validate
    if (!trimmed) {
      Components.showInputError("Vui lòng nhập tên thành phố");
      return;
    }
    if (trimmed.length < 2) {
      Components.showInputError("Tên thành phố phải có ít nhất 2 ký tự");
      return;
    }
    if (!/^[a-zA-ZÀ-ỹ\s.\-']+$/.test(trimmed)) {
      Components.showInputError("Tên thành phố không hợp lệ");
      return;
    }

    Components.clearInputError();
    Components.hideHistoryDropdown();
    Components.showLoading();

    try {
      let weatherData, forecastData;

      // Kiểm tra cache trước — nếu còn hạn thì không gọi API
      const cached = Storage.getCachedWeather(apiCity);

      if (cached) {
        // Dùng dữ liệu cache, không tốn API call
        console.log(`[Cache] Dùng dữ liệu cache cho "${apiCity}"`);
        weatherData  = cached.weather;
        forecastData = cached.forecast;
      } else {
        // Gọi API song song
        console.log(`[API] Gọi API mới cho "${apiCity}"`);
        [weatherData, forecastData] = await Promise.all([
          Api.getCurrentWeather(apiCity),
          Api.getForecast(apiCity),
        ]);

        // Lưu vào cache để lần sau dùng lại
        Storage.setCachedWeather(apiCity, {
          weather:  weatherData,
          forecast: forecastData,
        });
      }

      CurrentUI.render(weatherData, currentUnit);
      ForecastUI.render(forecastData, currentUnit);

      Storage.addToHistory(trimmed);

    } catch (err) {
      const code = err.message; // '404', '401', '429'...
      const isNetwork = !navigator.onLine || err.name === "TypeError";
      Components.showResultError(isNetwork ? "network" : code);
      Components.showToast(
        isNetwork ? "Lỗi kết nối. Kiểm tra internet của bạn" : `Lỗi ${code}`,
        "error"
      );
    } finally {
      Components.hideLoading();
    }
  }

  /** Tìm kiếm theo vị trí GPS hiện tại */
  async function searchByLocation() {
    if (!navigator.geolocation) {
      Components.showToast("Trình duyệt không hỗ trợ định vị", "error");
      return;
    }

    Components.showLoading();

    navigator.geolocation.getCurrentPosition(
      async ({ coords }) => {
        try {
          const [weatherData, forecastData] = await Promise.all([
            Api.getWeatherByCoords(coords.latitude, coords.longitude),
            Api.getForecastByCoords(coords.latitude, coords.longitude),
          ]);
          CurrentUI.render(weatherData, currentUnit);
          ForecastUI.render(forecastData, currentUnit);
          Storage.addToHistory(weatherData.name);
        } catch (err) {
          Components.showResultError(err.message);
        } finally {
          Components.hideLoading();
        }
      },
      () => {
        Components.hideLoading();
        Components.showToast("Không thể lấy vị trí. Vui lòng cho phép truy cập GPS", "error");
      }
    );
  }

  // ── Unit Toggle ──────────────────────────────────────────────────

  function _toggleUnit() {
    currentUnit = currentUnit === "C" ? "F" : "C";
    Storage.setUnit(currentUnit);
    _applyUnitToggleUI(currentUnit);
    CurrentUI.updateUnit(currentUnit);
    ForecastUI.updateUnit(currentUnit);
  }

  function _applyUnitToggleUI(unit) {
    const btnC = document.getElementById("btn-unit-c");
    const btnF = document.getElementById("btn-unit-f");
    if (!btnC || !btnF) return;
    btnC.classList.toggle("unit-active", unit === "C");
    btnF.classList.toggle("unit-active", unit === "F");
  }

  // ── Theme Toggle ─────────────────────────────────────────────────

  function _toggleTheme() {
    const next = Storage.getTheme() === "light" ? "dark" : "light";
    Storage.setTheme(next);
    _applyTheme(next);
  }

  function _applyTheme(theme) {
    document.documentElement.setAttribute("data-theme", theme);
    const icon = document.getElementById("theme-icon");
    if (icon) icon.textContent = theme === "dark" ? "☀️" : "🌙";
  }

  // ── Suggested Cities ─────────────────────────────────────────────

  function _renderSuggestedCities() {
    const container = document.getElementById("suggested-cities");
    if (!container) return;
    container.innerHTML = CONFIG.SUGGESTED_CITIES.map(city => `
      <button class="suggested-city px-3 py-1 text-sm bg-white/20 hover:bg-white/40
                     text-white rounded-full border border-white/30
                     transition-all duration-150 backdrop-blur-sm"
              data-city="${city}">${city}</button>
    `).join("");

    container.querySelectorAll(".suggested-city").forEach(btn =>
      btn.addEventListener("click", () => searchCity(btn.dataset.city))
    );
  }

  // ── Event Listeners ──────────────────────────────────────────────

  function _setupEventListeners() {
    const searchInput = document.getElementById("search-input");
    const btnSearch   = document.getElementById("btn-search");
    const btnLocation = document.getElementById("btn-location");
    const btnUnitC    = document.getElementById("btn-unit-c");
    const btnUnitF    = document.getElementById("btn-unit-f");
    const btnTheme    = document.getElementById("btn-theme");
    
    // Tìm kiếm khi bấm nút
    btnSearch?.addEventListener("click", () => {
      searchCity(searchInput.value);
    });

    // Tìm kiếm khi nhấn Enter
    searchInput?.addEventListener("keydown", e => {
      if (e.key === "Enter") searchCity(searchInput.value);
      if (e.key === "Escape") Components.hideHistoryDropdown();
    });

    // Debounce: mở dropdown lịch sử khi focus/input
    searchInput?.addEventListener("focus", _showHistory);
    searchInput?.addEventListener("input",
      Utils.debounce(() => {
        if (searchInput.value.trim() === "") _showHistory();
      }, 200)
    );

    // Đóng dropdown khi click ra ngoài
    document.addEventListener("click", e => {
      if (!e.target.closest("#search-wrapper")) {
        Components.hideHistoryDropdown();
      }
    });

    // Vị trí GPS
    btnLocation?.addEventListener("click", searchByLocation);

    // Toggle đơn vị
    btnUnitC?.addEventListener("click", () => { if (currentUnit !== "C") _toggleUnit(); });
    btnUnitF?.addEventListener("click", () => { if (currentUnit !== "F") _toggleUnit(); });

    // Toggle theme
    btnTheme?.addEventListener("click", _toggleTheme);

    // Resize: vẽ lại biểu đồ
    window.addEventListener("resize", Utils.debounce(() => {
      const dailyList = ForecastUI._dailyList;
      if (dailyList) Chart.update("temp-chart", dailyList, currentUnit);
    }, 300));
  }

  /** Render và hiện dropdown lịch sử */
  function _showHistory() {
    const history = Storage.getHistory();
    Components.renderHistoryDropdown(
      history,
      city => { // onSelect
        document.getElementById("search-input").value = city;
        searchCity(city);
      },
      city => { // onRemove
        Storage.removeFromHistory(city);
        _showHistory(); // re-render dropdown
      },
      () => { // onClearAll
        Storage.clearHistory();
        Components.hideHistoryDropdown();
        Components.showToast("Đã xóa toàn bộ lịch sử", "info");
      }
    );
  }

  return { init, searchCity };
})();

// ── Khởi động ứng dụng khi DOM đã sẵn sàng ──────────────────────
document.addEventListener("DOMContentLoaded", App.init);
