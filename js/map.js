// ================================================================
// FILE: js/map.js
// MÔ TẢ: Bản đồ thời tiết tương tác dùng Leaflet + OWM tile layers
// ================================================================

const WeatherMap = (() => {
  let _map         = null;
  let _weatherLayer = null;
  let _marker      = null;
  let _currentLayer = "precipitation_new";
  let _layerOpacity = 0.65;
  let _pointForecastList = [];
  let _pointWeather = null;
  let _pointIndex = 0;
  let _timelineTimer = null;

  const _layerLabels = {
    precipitation_new: "Mưa",
    clouds_new: "Mây",
    temp_new: "Nhiệt độ",
    wind_new: "Gió",
    pressure_new: "Áp suất",
  };

  function init() {
    if (_map) return; // Tránh khởi tạo lại

    // Khởi tạo bản đồ Leaflet
    _map = L.map("weather-map", {
    center: [16.0, 106.0], // Trung tâm Việt Nam
    zoom: 5,
    zoomControl: true,
    scrollWheelZoom: false
    });

    // Bản đồ nền OpenStreetMap (miễn phí)
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "© OpenStreetMap contributors",
      maxZoom: 18,
    }).addTo(_map);

    // Thêm lớp thời tiết mặc định
    _addWeatherLayer(_currentLayer);

    // Click vào bản đồ → xem thời tiết tại điểm đó
    _map.on("click", async (e) => {
      const { lat, lng } = e.latlng;
      try {
        await _loadPointForecast(lat, lng);
      } catch {
        Components.showToast("Không lấy được thời tiết điểm này", "error");
      }
    });

    // Gắn sự kiện cho các nút toggle layer
    document.querySelectorAll(".map-layer-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        document.querySelectorAll(".map-layer-btn")
          .forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        switchLayer(btn.dataset.layer);
      });
    });

    _setupControls();
  }

  /** Thêm tile layer thời tiết lên bản đồ */
  function _addWeatherLayer(layerName) {
    if (_weatherLayer) _map.removeLayer(_weatherLayer);
    _weatherLayer = L.tileLayer(
      `https://tile.openweathermap.org/map/${layerName}/{z}/{x}/{y}.png?appid=${CONFIG.API_KEY}`,
      { opacity: _layerOpacity, attribution: "© OpenWeatherMap" }
    ).addTo(_map);
  }

  /** Đổi lớp thời tiết */
  function switchLayer(layerName) {
    _currentLayer = layerName;
    _addWeatherLayer(layerName);
    _updateLegend();
  }

  function _setupControls() {
    const opacityInput = document.getElementById("layer-opacity");
    const opacityValue = document.getElementById("layer-opacity-value");
    const btnLocate = document.getElementById("btn-map-locate");
    const btnFullscreen = document.getElementById("btn-map-fullscreen");

    opacityInput?.addEventListener("input", () => {
      _layerOpacity = Number(opacityInput.value) / 100;
      if (_weatherLayer) _weatherLayer.setOpacity(_layerOpacity);
      if (opacityValue) opacityValue.textContent = `${opacityInput.value}%`;
    });

    btnLocate?.addEventListener("click", () => {
      if (!navigator.geolocation || !_map) return;
      navigator.geolocation.getCurrentPosition(
        ({ coords }) => _map.flyTo([coords.latitude, coords.longitude], 9, { duration: 1 }),
        () => Components.showToast("Không lấy được vị trí hiện tại", "error")
      );
    });

    btnFullscreen?.addEventListener("click", () => {
      const mapContainer = document.getElementById("weather-map");
      if (!mapContainer) return;
      if (document.fullscreenElement) {
        document.exitFullscreen();
      } else {
        mapContainer.requestFullscreen();
      }
    });

    _updateLegend();

    const slider = document.getElementById("point-time-slider");
    const btnPlay = document.getElementById("point-play");
    slider?.addEventListener("input", () => {
      _pointIndex = Number(slider.value);
      _renderPointDetails();
    });
    btnPlay?.addEventListener("click", _toggleTimeline);

    window.addEventListener("unit:changed", _renderPointDetails);
  }

  function _updateLegend() {
    const legend = document.getElementById("map-layer-legend");
    if (!legend) return;
    legend.textContent = `Đang hiển thị: ${_layerLabels[_currentLayer]} (dữ liệu OpenWeatherMap)`;
  }

  async function _loadPointForecast(lat, lon, seedWeatherData = null) {
    const [weatherData, forecastData] = await Promise.all([
      seedWeatherData ? Promise.resolve(seedWeatherData) : Api.getWeatherByCoords(lat, lon),
      Api.getForecastByCoords(lat, lon),
    ]);
    _pointWeather = weatherData;
    _pointForecastList = forecastData.list || [];
    _pointIndex = 0;
    _showPopup(lat, lon, weatherData);
    _placeMarker(lat, lon, weatherData);
    _renderPointPanel();
  }

  function _renderPointPanel() {
    const panel = document.getElementById("point-forecast-panel");
    const location = document.getElementById("point-location");
    const summary = document.getElementById("point-summary");
    const slider = document.getElementById("point-time-slider");
    if (!_pointWeather || !_pointForecastList.length || !panel || !slider) return;

    panel.classList.remove("hidden");
    location.textContent = `${_pointWeather.name}, ${_pointWeather.sys.country}`;
    summary.textContent = "Dự báo theo điểm (3 giờ/lần) — kiểu timeline giống Windy";
    slider.max = String(_pointForecastList.length - 1);
    slider.value = String(_pointIndex);
    _renderPointDetails();
  }

  function _renderPointDetails() {
    if (!_pointForecastList.length) return;
    const unit = Storage.getUnit();
    const item = _pointForecastList[_pointIndex];

    const timeLabel = document.getElementById("point-time-label");
    const temp = document.getElementById("point-temp");
    const rain = document.getElementById("point-rain");
    const wind = document.getElementById("point-wind");
    const humidity = document.getElementById("point-humidity");
    const slider = document.getElementById("point-time-slider");
    if (slider) slider.value = String(_pointIndex);

    if (timeLabel) timeLabel.textContent = `${Utils.getDayName(item.dt)} • ${Utils.formatTime(item.dt)} (${item.dt_txt})`;
    if (temp) temp.textContent = Utils.formatTemp(item.main.temp, unit);
    if (rain) rain.textContent = `${Math.round((item.pop || 0) * 100)}%`;
    if (wind) wind.textContent = `${Utils.msToKmh(item.wind.speed)} km/h`;
    if (humidity) humidity.textContent = `${item.main.humidity}%`;
  }

  function _toggleTimeline() {
    const btn = document.getElementById("point-play");
    if (_timelineTimer) {
      clearInterval(_timelineTimer);
      _timelineTimer = null;
      if (btn) btn.textContent = "▶ Phát timeline";
      return;
    }

    _timelineTimer = setInterval(() => {
      if (!_pointForecastList.length) return;
      _pointIndex = (_pointIndex + 1) % _pointForecastList.length;
      _renderPointDetails();
    }, 900);
    if (btn) btn.textContent = "⏸ Tạm dừng";
  }

  /** Di chuyển bản đồ đến thành phố vừa tìm kiếm + đặt marker */
    function flyToCity(lat, lon, cityName, weatherData) {
    if (lat == null || lon == null || isNaN(lat) || isNaN(lon)) {
      console.warn(`[Map] Tọa độ không hợp lệ cho "${cityName}": (${lat}, ${lon})`);
      return;
    }
    const section = document.getElementById("map-section");
    if (section) section.classList.remove("hidden");
    if (!_map) {
        init();
        // Đợi 1 tick để DOM render xong rồi mới flyTo
        setTimeout(() => {
        _map.invalidateSize(); // Bắt Leaflet đọc lại kích thước container
        _map.flyTo([lat, lon], 9, { duration: 1.2 });
        _placeMarker(lat, lon, weatherData);
        _loadPointForecast(lat, lon, weatherData).catch(() => {});
        }, 100);
    } else {
        _map.invalidateSize();
        _map.flyTo([lat, lon], 9, { duration: 1.2 });
        _placeMarker(lat, lon, weatherData);
        _loadPointForecast(lat, lon, weatherData).catch(() => {});
    }
    }
    function _placeMarker(lat, lon, weatherData) {
    if (_marker) _map.removeLayer(_marker);
    _marker = L.marker([lat, lon])
        .addTo(_map)
        .bindPopup(_buildPopupHtml(weatherData))
        .openPopup();
    }
  /** Hiện popup khi click vào bản đồ */
  function _showPopup(lat, lng, data) {
    L.popup()
      .setLatLng([lat, lng])
      .setContent(_buildPopupHtml(data))
      .openOn(_map);
  }

  /** Tạo nội dung HTML cho popup */
  function _buildPopupHtml(data) {
    const unit = Storage.getUnit();
    return `
      <div style="min-width:160px; font-family: Calibri, sans-serif">
        <p style="font-weight:600; font-size:14px; margin:0 0 4px">
          ${data.name}, ${data.sys.country}
        </p>
        <img src="${Api.getIconUrl(data.weather[0].icon)}"
             style="width:40px;height:40px;float:right;margin-top:-8px">
        <p style="font-size:22px; font-weight:700; color:#1A3A5C; margin:0">
          ${Utils.formatTemp(data.main.temp, unit)}
        </p>
        <p style="font-size:12px; color:#666; margin:2px 0">
          ${Utils.capitalize(data.weather[0].description)}
        </p>
        <p style="font-size:12px; color:#888; margin:2px 0">
          💧 ${data.main.humidity}%  
          💨 ${Utils.msToKmh(data.wind.speed)} km/h
        </p>
      </div>`;
  }

  return { init, flyToCity, switchLayer };
})();
