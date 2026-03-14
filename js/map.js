// ================================================================
// FILE: js/map.js
// MÔ TẢ: Bản đồ thời tiết tương tác dùng Leaflet + OWM tile layers
// ================================================================

const WeatherMap = (() => {
  let _map         = null;
  let _weatherLayer = null;
  let _marker      = null;
  let _currentLayer = "precipitation_new";

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
        const data = await Api.getWeatherByCoords(lat, lng);
        _showPopup(lat, lng, data);
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
  }

  /** Thêm tile layer thời tiết lên bản đồ */
  function _addWeatherLayer(layerName) {
    if (_weatherLayer) _map.removeLayer(_weatherLayer);
    _weatherLayer = L.tileLayer(
      `https://tile.openweathermap.org/map/${layerName}/{z}/{x}/{y}.png?appid=${CONFIG.API_KEY}`,
      { opacity: 0.65, attribution: "© OpenWeatherMap" }
    ).addTo(_map);
  }

  /** Đổi lớp thời tiết */
  function switchLayer(layerName) {
    _currentLayer = layerName;
    _addWeatherLayer(layerName);
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
        }, 100);
    } else {
        _map.invalidateSize();
        _map.flyTo([lat, lon], 9, { duration: 1.2 });
        _placeMarker(lat, lon, weatherData);
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