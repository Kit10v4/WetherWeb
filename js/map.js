const WeatherMap = (() => {
  let _map = null;
  let _weatherLayer = null;
  let _marker = null;
  let _currentLayer = "precipitation_new";

  function init() {
    if (_map) return;
    _map = L.map("weather-map", {
      center: [16, 106],
      zoom: 5,
      zoomControl: true,
      scrollWheelZoom: true,
    });

    L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
      attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> © CARTO',
      subdomains: "abcd",
      maxZoom: 19,
    }).addTo(_map);

    _addWeatherLayer(_currentLayer);
    _bindLayerButtons();
    _bindMapClick();
    RadarLayer.init(_map);
  }

  function _bindLayerButtons() {
    document.querySelectorAll(".map-layer-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        document.querySelectorAll(".map-layer-btn").forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        switchLayer(btn.dataset.layer);
      });
    });
  }

  function _bindMapClick() {
    _map.on("click", async e => {
      try {
        const { lat, lng } = e.latlng;
        App.searchByCoords(lat, lng);
      } catch {
        Components.showToast("Không lấy được dữ liệu tại vị trí này", "error");
      }
    });
  }

  function _addWeatherLayer(layerName) {
    if (_weatherLayer) _map.removeLayer(_weatherLayer);
    _weatherLayer = L.tileLayer(`/api/map-tile?layer=${layerName}&z={z}&x={x}&y={y}`, {
      opacity: 0.68,
      attribution: "© OpenWeatherMap",
    }).addTo(_map);
  }

  function switchLayer(layerName) {
    if (!_map) init();
    _currentLayer = layerName;
    _addWeatherLayer(layerName);
  }

  function flyToCity(lat, lon, cityName, weatherData) {
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
      console.warn(`[Map] Tọa độ không hợp lệ cho "${cityName}": (${lat}, ${lon})`);
      return;
    }
    if (!_map) init();

    _map.invalidateSize();
    _map.flyTo([lat, lon], 8, { duration: 1.2 });
    _placeMarker(lat, lon, weatherData);
    WindLayer.addToMap(_map, lat, lon);
  }

  function _placeMarker(lat, lon, weatherData) {
    if (_marker) _map.removeLayer(_marker);
    _marker = L.marker([lat, lon]).addTo(_map).bindPopup(_buildPopupHtml(weatherData)).openPopup();
  }

  function _buildPopupHtml(data) {
    const unit = Storage.getUnit();
    return `
      <div style="min-width:160px;font-family:system-ui,sans-serif">
        <p style="font-weight:600;font-size:14px;margin:0 0 4px">${data.name}, ${data.sys.country}</p>
        <img src="${Api.getIconUrl(data.weather[0].icon)}" style="width:40px;height:40px;float:right;margin-top:-8px" alt="">
        <p style="font-size:22px;font-weight:700;color:#0b2238;margin:0">${Utils.formatTemp(data.main.temp, unit)}</p>
        <p style="font-size:12px;color:#555;margin:2px 0">${Utils.capitalize(data.weather[0].description)}</p>
      </div>
    `;
  }

  function invalidateSize() {
    _map?.invalidateSize();
  }

  return { init, flyToCity, switchLayer, invalidateSize };
})();
