import { checkRateLimit, handlePreflight, hasOwmKey, requireGet, setCors } from "./_utils.js";

const ALLOWED_LAYERS = [
  "precipitation_new",
  "clouds_new",
  "temp_new",
  "wind_new",
  "pressure_new",
];

function validTilePart(v) {
  return /^[0-9]+$/.test(String(v || ""));
}

export default async function handler(req, res) {
  setCors(res);
  if (handlePreflight(req, res)) return;
  if (!requireGet(req, res)) return;
  if (!checkRateLimit(req, res)) return;

  const { layer, z, x, y } = req.query;
  if (!ALLOWED_LAYERS.includes(layer)) {
    return res.status(400).json({ error: "Invalid layer" });
  }
  if (!validTilePart(z) || !validTilePart(x) || !validTilePart(y)) {
    return res.status(400).json({ error: "Invalid tile coordinates" });
  }

  if (!hasOwmKey(res)) return;

  try {
    const tileUrl = `https://tile.openweathermap.org/map/${layer}/${z}/${x}/${y}.png?appid=${process.env.OWM_API_KEY}`;
    const tileRes = await fetch(tileUrl);
    if (!tileRes.ok) return res.status(tileRes.status).json({ error: "Tile fetch failed" });
    const buffer = await tileRes.arrayBuffer();

    res.setHeader("Content-Type", "image/png");
    res.setHeader("Cache-Control", "s-maxage=3600, stale-while-revalidate=600");
    return res.status(200).send(Buffer.from(buffer));
  } catch {
    return res.status(500).json({ error: "Internal server error" });
  }
}
