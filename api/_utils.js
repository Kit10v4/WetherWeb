const limiterState = new Map();

export function setCors(res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
}

export function handlePreflight(req, res) {
  if (req.method === "OPTIONS") {
    res.status(204).end();
    return true;
  }
  return false;
}

export function requireGet(req, res) {
  if (req.method !== "GET") {
    res.status(405).json({ error: "Method not allowed" });
    return false;
  }
  return true;
}

export function checkRateLimit(req, res, limit = 60, windowMs = 60_000) {
  const ip = req.headers["x-forwarded-for"]?.split(",")[0]?.trim() || "unknown";
  const now = Date.now();
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

export function hasOwmKey(res) {
  if (!process.env.OWM_API_KEY) {
    res.status(500).json({ error: "API key not configured" });
    return false;
  }
  return true;
}

export function validCoord(value, min, max) {
  const n = Number(value);
  return Number.isFinite(n) && n >= min && n <= max;
}

export function normUnits(value) {
  return value === "imperial" ? "imperial" : "metric";
}

export function normLang(value) {
  return /^[a-z]{2}$/i.test(String(value || "")) ? String(value).toLowerCase() : "vi";
}
