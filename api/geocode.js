import { checkRateLimit, handlePreflight, hasOwmKey, requireGet, setCors } from "./_utils.js";

export default async function handler(req, res) {
  setCors(res);
  if (handlePreflight(req, res)) return;
  if (!requireGet(req, res)) return;
  if (!checkRateLimit(req, res)) return;

  const { q, limit = 5 } = req.query;
  if (!q || q.trim().length < 2) return res.status(400).json([]);

  if (!hasOwmKey(res)) return;

  try {
    const url = `https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(q)}&limit=${encodeURIComponent(limit)}&appid=${process.env.OWM_API_KEY}`;
    const owmRes = await fetch(url);
    const data = await owmRes.json();
    if (!owmRes.ok) {
      return res.status(owmRes.status).json({ error: "Geocode failed" });
    }

    res.setHeader("Cache-Control", "s-maxage=86400, stale-while-revalidate=600");
    return res.status(200).json(data);
  } catch {
    return res.status(500).json({ error: "Internal server error" });
  }
}
