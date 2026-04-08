const ALLOWED_LAYERS = [
  "precipitation_new",
  "clouds_new",
  "temp_new",
  "wind_new",
  "pressure_new",
];

function setCors(res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
}

function validTilePart(v) {
  return /^[0-9]+$/.test(String(v || ""));
}

export default async function handler(req, res) {
  setCors(res);
  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });

  const { layer, z, x, y } = req.query;
  if (!ALLOWED_LAYERS.includes(layer)) {
    return res.status(400).json({ error: "Invalid layer" });
  }
  if (!validTilePart(z) || !validTilePart(x) || !validTilePart(y)) {
    return res.status(400).json({ error: "Invalid tile coordinates" });
  }

  const OWM_KEY = process.env.OWM_API_KEY;
  if (!OWM_KEY) return res.status(500).json({ error: "API key not configured" });

  try {
    const tileUrl = `https://tile.openweathermap.org/map/${layer}/${z}/${x}/${y}.png?appid=${OWM_KEY}`;
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
