import { checkRateLimit, handlePreflight, hasOwmKey, normLang, normUnits, requireGet, setCors, validCoord } from "./_utils.js";

export default async function handler(req, res) {
  setCors(res);
  if (handlePreflight(req, res)) return;
  if (!requireGet(req, res)) return;
  if (!checkRateLimit(req, res)) return;

  const { lat, lon, lang = "vi", units = "metric" } = req.query;
  if (!validCoord(lat, -90, 90) || !validCoord(lon, -180, 180)) {
    return res.status(400).json({ error: "Invalid lat/lon parameters" });
  }

  if (!hasOwmKey(res)) return;

  try {
    const url = `https://api.openweathermap.org/data/2.5/weather?lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lon)}&appid=${process.env.OWM_API_KEY}&units=${normUnits(units)}&lang=${normLang(lang)}`;
    const owmRes = await fetch(url);
    const data = await owmRes.json();

    if (!owmRes.ok) {
      return res.status(owmRes.status).json({ error: data.message || "OWM error" });
    }

    res.setHeader("Cache-Control", "s-maxage=600, stale-while-revalidate=60");
    return res.status(200).json(data);
  } catch {
    return res.status(500).json({ error: "Internal server error" });
  }
}
