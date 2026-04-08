const BASE_URL = "https://api.openweathermap.org/data/2.5";

function getApiKey() {
  const key = process.env.OWM_API_KEY;
  if (!key) throw new Error("Missing OWM_API_KEY");
  return key;
}

function json(res, status, payload) {
  res.status(status).setHeader("Content-Type", "application/json");
  res.send(JSON.stringify(payload));
}

async function fetchOpenWeather(path, params = {}) {
  const apiKey = getApiKey();
  const url = new URL(`${BASE_URL}/${path}`);
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== "") url.searchParams.set(k, String(v));
  });
  url.searchParams.set("appid", apiKey);
  url.searchParams.set("units", "metric");
  url.searchParams.set("lang", "vi");

  const res = await fetch(url.toString());
  const data = await res.json();
  if (!res.ok) {
    const err = new Error(data?.message || "OpenWeather request failed");
    err.status = res.status;
    throw err;
  }
  return data;
}

module.exports = { fetchOpenWeather, json };
