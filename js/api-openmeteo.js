const OpenMeteoApi = (() => {
  const BASE = "https://api.open-meteo.com/v1";

  async function getAdvancedMetrics(lat, lon) {
    const url = `${BASE}/forecast?latitude=${lat}&longitude=${lon}&hourly=uv_index,apparent_temperature,precipitation_probability,windspeed_10m,winddirection_10m,visibility,cloudcover&daily=uv_index_max,precipitation_sum,windspeed_10m_max&timezone=auto&forecast_days=5`;
    const res = await fetch(url);
    if (!res.ok) throw new Error("Open-Meteo error");
    return res.json();
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
