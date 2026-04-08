const { fetchOpenWeather, json } = require("./_owm");

module.exports = async (req, res) => {
  try {
    const { city, lat, lon } = req.query || {};
    const baseParams = { cnt: 40 };

    if (city) {
      const data = await fetchOpenWeather("forecast", { ...baseParams, q: city });
      return json(res, 200, data);
    }
    if (lat && lon) {
      const data = await fetchOpenWeather("forecast", { ...baseParams, lat, lon });
      return json(res, 200, data);
    }
    return json(res, 400, { message: "Thiếu tham số city hoặc lat/lon" });
  } catch (err) {
    return json(res, err.status || 500, { message: err.message });
  }
};
