const limiterState = new Map();

function setCors(res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
}

function checkRateLimit(req, res) {
  const ip = req.headers["x-forwarded-for"]?.split(",")[0]?.trim() || "unknown";
  const now = Date.now();
  const windowMs = 60_000;
  const limit = 60;
  const bucket = limiterState.get(ip);

  if (!bucket || now - bucket.start > windowMs) {
    limiterState.set(ip, { count: 1, start: now });
    return true;
  }

  if (bucket.count >= limit) {
    res.status(429).json({ error: "Rate limit exceeded" });
    return false;
  }

  bucket.count += 1;
  return true;
}

export default async function handler(req, res) {
  setCors(res);
  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });
  if (!checkRateLimit(req, res)) return;

  const { q, limit = 5 } = req.query;
  if (!q || q.trim().length < 2) return res.status(400).json([]);

  const OWM_KEY = process.env.OWM_API_KEY;
  if (!OWM_KEY) return res.status(500).json({ error: "API key not configured" });

  try {
    const url = `https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(q)}&limit=${encodeURIComponent(limit)}&appid=${OWM_KEY}`;
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
