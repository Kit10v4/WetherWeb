const WindLayer = (() => {
  let _velocityLayer = null;
  let _loadingToken = 0;

  async function fetchWindData(lat, lon) {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&hourly=windspeed_10m,winddirection_10m,surface_pressure&wind_speed_unit=ms&forecast_days=1`;
    const res = await fetch(url);
    if (!res.ok) throw new Error("Wind data error");
    const data = await res.json();
    return _convertToVelocityFormat(data, lat, lon);
  }

  function _convertToVelocityFormat(openMeteoData, centerLat, centerLon) {
    const speed = openMeteoData?.hourly?.windspeed_10m?.[0] || 5;
    const dir = openMeteoData?.hourly?.winddirection_10m?.[0] || 0;
    const dirRad = (dir * Math.PI) / 180;
    const u = -speed * Math.sin(dirRad);
    const v = -speed * Math.cos(dirRad);
    const commonHeader = {
      parameterUnit: "m.s-1",
      lo1: centerLon - 5,
      la1: centerLat + 5,
      dx: 2.5,
      dy: 2.5,
      nx: 5,
      ny: 5,
      refTime: new Date().toISOString(),
    };

    return [
      {
        header: { ...commonHeader, parameterNumber: 2, parameterNumberName: "eastward_wind" },
        data: Array(25).fill(u),
      },
      {
        header: { ...commonHeader, parameterNumber: 3, parameterNumberName: "northward_wind" },
        data: Array(25).fill(v),
      },
    ];
  }

  async function addToMap(map, lat, lon) {
    _loadingToken += 1;
    const token = _loadingToken;
    try {
      const windData = await fetchWindData(lat, lon);
      if (token !== _loadingToken) return;
      remove(map);
      _velocityLayer = L.velocityLayer({
        displayValues: true,
        displayOptions: {
          velocityType: "Wind",
          position: "bottomleft",
          emptyString: "No wind data",
        },
        data: windData,
        maxVelocity: 15,
        colorScale: ["#3288bd", "#66c2a5", "#abdda4", "#e6f598", "#fee08b", "#fdae61", "#f46d43", "#d53e4f"],
        velocityScale: 0.005,
        particleAge: 64,
        lineWidth: 1,
        particleMultiplier: 0.0015,
        frameRate: 15,
      }).addTo(map);
    } catch {
      Components.showToast("Không tải được lớp gió", "info");
    }
  }

  function remove(map) {
    if (_velocityLayer) {
      map.removeLayer(_velocityLayer);
      _velocityLayer = null;
    }
  }

  return { addToMap, remove };
})();
