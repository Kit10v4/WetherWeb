import { checkRateLimit, handlePreflight, hasOwmKey, requireGet, setCors } from "./_utils.js";

export default async function handler(req, res) {
  setCors(res);
  if (handlePreflight(req, res)) return;
  if (!requireGet(req, res)) return;
  if (!checkRateLimit(req, res)) return;

  const { city, lang = "vi", units = "metric" } = req.query;
  if (!city || city.trim().length < 2) {
    return res.status(400).json({ error: "Invalid city parameter" });
  }

  if (!hasOwmKey(res)) return;

  try {
    const url = `https://api.openweathermap.org/data/2.5/forecast?q=${encodeURIComponent(city)}&appid=${process.env.OWM_API_KEY}&units=${units}&lang=${lang}&cnt=40`;
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
