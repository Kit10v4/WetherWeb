// ================================================================
// FILE: js/ui/forecast.js
// MÔ TẢ: Render danh sách dự báo 5 ngày và gọi vẽ biểu đồ
// ================================================================

const ForecastUI = (() => {

  // Lưu dữ liệu gốc để toggle đơn vị không cần gọi lại API
  let _dailyList = null;

  /**
   * Render 5 thẻ dự báo + biểu đồ nhiệt độ
   * @param {object} forecastData - Kết quả từ Api.getForecast()
   * @param {string} unit         - 'C' hoặc 'F'
   */
  function render(forecastData, unit = "C") {
    _dailyList = Api.filterDailyForecast(forecastData.list);
    _renderCards(unit);
    Chart.draw("temp-chart", _dailyList, unit);

    const section = document.getElementById("forecast-section");
    if (section) section.classList.remove("hidden");
  }

  /**
   * Cập nhật nhiệt độ trên các thẻ + biểu đồ khi toggle đơn vị
   * @param {string} unit
   */
  function updateUnit(unit) {
    if (!_dailyList) return;
    _renderCards(unit);
    Chart.update("temp-chart", _dailyList, unit);
  }

  /** Render nội dung các thẻ dự báo */
  function _renderCards(unit) {
    const container = document.getElementById("forecast-cards");
    if (!container || !_dailyList) return;

    container.innerHTML = _dailyList.map((day, i) => {
      const dayName   = i === 0 ? "Hôm nay" : Utils.getDayName(day.dt);
      const iconUrl   = Api.getIconUrl(day.weather[0].icon);
      const desc      = Utils.capitalize(day.weather[0].description);
      const high      = Utils.formatTemp(day.main.temp_max, unit);
      const low       = Utils.formatTemp(day.main.temp_min, unit);
      const rainPct   = Math.round((day.pop || 0) * 100);

      return `
        <div class="forecast-card flex-shrink-0 w-36 bg-white rounded-2xl shadow-sm
                    border border-gray-100 p-4 flex flex-col items-center gap-1
                    hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
          <p class="font-semibold text-sm text-navy">${dayName}</p>
          <img src="${iconUrl}" alt="${desc}" class="w-12 h-12" loading="lazy">
          <p class="text-xs text-gray-500 text-center leading-tight">${desc}</p>
          <div class="flex gap-2 mt-1">
            <span class="text-sm font-bold text-gray-800">${high}</span>
            <span class="text-sm text-gray-400">${low}</span>
          </div>
          ${rainPct > 0 ? `
            <div class="flex items-center gap-1 text-xs text-blue-400 mt-1">
              <span>💧</span><span>${rainPct}%</span>
            </div>` : ""}
        </div>`;
    }).join("");
  }

  return { render, updateUnit };
})();
