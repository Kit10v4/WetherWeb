// ================================================================
// FILE: js/map.js
// MÔ TẢ: Bản đồ thời tiết tương tác dùng Leaflet + OWM tile layers
// ================================================================

const WeatherMap = (() => {
  let _map          = null;
  let _weatherLayer = null;
  let _marker       = null;
  let _currentLayer = "precipitation_new";

  // ── Metadata cho từng lớp: gradient màu + nhãn chú thích ──────
  const LAYER_META = {
    precipitation_new: {
      title: "🌧 Cường độ mưa",
      unit:  "mm/h",
      gradient: "linear-gradient(to right, #e8f4fc, #a5d8ff, #4dabf7, #1971c2, #862e9c)",
      labels:   ["0", "0.5", "2", "10", "20+"],
    },
    clouds_new: {
      title: "☁️ Độ che phủ mây",
      unit:  "%",
      gradient: "linear-gradient(to right, #f8f9fa, #dee2e6, #adb5bd, #6c757d, #343a40)",
      labels:   ["0%", "25%", "50%", "75%", "100%"],
    },
    temp_new: {
      title: "🌡 Nhiệt độ không khí",
      unit:  "°C",
      gradient: "linear-gradient(to right, #7950f2, #228be6, #15aabf, #40c057, #fcc419, #f76707, #e03131)",
      labels:   ["−40°", "−20°", "0°", "10°", "20°", "30°", "40°+"],
    },
    wind_new: {
      title: "💨 Tốc độ gió",
      unit:  "m/s",
      gradient: "linear-gradient(to right, #f1f3f5, #a9e34b, #40c057, #fab005, #f76707, #c92a2a)",
      labels:   ["0", "5", "10", "20", "35", "50+"],
    },
    pressure_new: {
      title: "📊 Áp suất khí quyển",
      unit:  "hPa",
      gradient: "linear-gradient(to right, #1971c2, #4dabf7, #99e9f2, #d3f9d8, #ffe066, #f76707, #e03131)",
      labels:   ["950", "970", "990", "1000", "1010", "1025", "1050+"],
    },
  };

  // ── Khởi tạo bản đồ Leaflet ───────────────────────────────────
  function init() {
    if (_map) return;

    _map = L.map("weather-map", {
      center: [16.0, 106.0],
      zoom: 5,
      zoomControl: true,
      scrollWheelZoom: false,
    });

    // Nền CartoDB Positron: sáng, trung tính — không lấn át màu thời tiết
    L.tileLayer(
      "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png",
      {
        attribution:
          '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> © <a href="https://carto.com/">CARTO</a>',
        subdomains: "abcd",
        maxZoom: 19,
      }
    ).addTo(_map);

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

    // Nút toggle layer
    document.querySelectorAll(".map-layer-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        document.querySelectorAll(".map-layer-btn")
          .forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        switchLayer(btn.dataset.layer);
      });
    });
  }

  // ── Thêm tile layer thời tiết ─────────────────────────────────
  function _addWeatherLayer(layerName) {
    if (_weatherLayer) _map.removeLayer(_weatherLayer);
    _weatherLayer = L.tileLayer(
      `https://tile.openweathermap.org/map/${layerName}/{z}/{x}/{y}.png?appid=${CONFIG.API_KEY}`,
      { opacity: 0.85, attribution: "© OpenWeatherMap" }
    ).addTo(_map);
    _updateLegend(layerName);
  }

  // ── Cập nhật thanh chú thích màu sắc ─────────────────────────
  function _updateLegend(layerName) {
    const legend = document.getElementById("map-legend");
    if (!legend) return;

    const meta = LAYER_META[layerName];
    if (!meta) { legend.classList.add("hidden"); return; }

    document.getElementById("legend-title").textContent =
      `${meta.title}  ·  Đơn vị: ${meta.unit}`;
    document.getElementById("legend-bar").style.background = meta.gradient;
    document.getElementById("legend-labels").innerHTML =
      meta.labels.map(l => `<span>${l}</span>`).join("");

    legend.classList.remove("hidden");
  }

  // ── Đổi lớp thời tiết ────────────────────────────────────────
  function switchLayer(layerName) {
    _currentLayer = layerName;
    _addWeatherLayer(layerName);
  }

  // ── Di chuyển bản đồ đến thành phố + đặt marker ──────────────
  function flyToCity(lat, lon, cityName, weatherData) {
    if (lat == null || lon == null || isNaN(lat) || isNaN(lon)) {
      console.warn(`[Map] Tọa độ không hợp lệ cho "${cityName}": (${lat}, ${lon})`);
      return;
    }
    const section = document.getElementById("map-section");
    if (section) section.classList.remove("hidden");

    if (!_map) {
      init();
      setTimeout(() => {
        _map.invalidateSize();
        _map.flyTo([lat, lon], 9, { duration: 1.2 });
        _placeMarker(lat, lon, weatherData);
      }, 100);
    } else {
      _map.invalidateSize();
      _map.flyTo([lat, lon], 9, { duration: 1.2 });
      _placeMarker(lat, lon, weatherData);
    }
  }

  // ── Đặt marker tại thành phố ──────────────────────────────────
  function _placeMarker(lat, lon, weatherData) {
    if (_marker) _map.removeLayer(_marker);
    _marker = L.marker([lat, lon])
      .addTo(_map)
      .bindPopup(_buildPopupHtml(weatherData))
      .openPopup();
  }

  // ── Popup khi click vào bản đồ ────────────────────────────────
  function _showPopup(lat, lng, data) {
    L.popup()
      .setLatLng([lat, lng])
      .setContent(_buildPopupHtml(data))
      .openOn(_map);
  }

  // ── HTML nội dung popup ───────────────────────────────────────
  function _buildPopupHtml(data) {
    const unit = Storage.getUnit();
    return `
      <div style="min-width:160px; font-family: system-ui, sans-serif">
        <p style="font-weight:600; font-size:14px; margin:0 0 4px">
          ${data.name}, ${data.sys.country}
        </p>
        <img src="${Api.getIconUrl(data.weather[0].icon)}"
             style="width:40px;height:40px;float:right;margin-top:-8px">
        <p style="font-size:22px; font-weight:700; color:#1A3A5C; margin:0">
          ${Utils.formatTemp(data.main.temp, unit)}
        </p>
        <p style="font-size:12px; color:#555; margin:2px 0">
          ${Utils.capitalize(data.weather[0].description)}
        </p>
        <p style="font-size:12px; color:#777; margin:4px 0 0">
          💧 ${data.main.humidity}%  &nbsp;
          💨 ${Utils.msToKmh(data.wind.speed)} km/h
        </p>
      </div>`;
  }

  return { init, flyToCity, switchLayer };
})();
