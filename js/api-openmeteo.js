const OpenMeteoApi = (() => {
  const BASE = "https://api.open-meteo.com/v1";
  const CACHE_PREFIX = "weatherpro_openmeteo_";
  const CACHE_TTL = 30 * 60 * 1000;

  function _cacheKey(lat, lon) {
    return `${CACHE_PREFIX}${Number(lat).toFixed(2)}_${Number(lon).toFixed(2)}`;
  }

  function _getCached(lat, lon) {
    try {
      const raw = localStorage.getItem(_cacheKey(lat, lon));
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      if (Date.now() - parsed.ts > CACHE_TTL) return null;
      return parsed.data;
    } catch {
      return null;
    }
  }

  function _setCached(lat, lon, data) {
    try {
      localStorage.setItem(_cacheKey(lat, lon), JSON.stringify({ ts: Date.now(), data }));
    } catch {
      // ignore cache failure
    }
  }

  async function getAdvancedMetrics(lat, lon) {
    const url = `${BASE}/forecast?latitude=${lat}&longitude=${lon}&hourly=uv_index,precipitation_probability,visibility,cloud_cover&daily=uv_index_max,precipitation_sum&current=uv_index,precipitation,rain,showers,snowfall,weather_code,cloud_cover,visibility&timezone=auto&forecast_days=5`;
    const res = await fetch(url);
    if (!res.ok) throw new Error("Open-Meteo error");
    return res.json();
    const cached = _getCached(lat, lon);
    if (cached) return cached;
    const url = `${BASE}/forecast?latitude=${lat}&longitude=${lon}&hourly=uv_index,apparent_temperature,precipitation_probability,windspeed_10m,winddirection_10m,visibility,cloudcover&daily=uv_index_max,precipitation_sum,windspeed_10m_max&timezone=auto&forecast_days=5`;
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 12000);
    try {
      const res = await fetch(url, { signal: ctrl.signal });
      if (!res.ok) throw new Error("Open-Meteo error");
      const data = await res.json();
      _setCached(lat, lon, data);
      return data;
    } catch (err) {
      if (err.name === "AbortError") throw new Error("Open-Meteo timeout");
      throw err;
    } finally {
      clearTimeout(timer);
    }
  }

  async function getHistoricalWeek(lat, lon) {
    const end = new Date();
    const start = new Date(end.getTime() - 7 * 24 * 60 * 60 * 1000);
    const fmt = d => d.toISOString().split("T")[0];
    const url = `${BASE}/archive?latitude=${lat}&longitude=${lon}&start_date=${fmt(start)}&end_date=${fmt(end)}&daily=temperature_2m_max,temperature_2m_min,precipitation_sum&timezone=auto`;
    const res = await fetch(url);
    if (!res.ok) throw new Error("Open-Meteo archive error");
    return res.json();
  }

  return { getAdvancedMetrics, getHistoricalWeek };
})();
