# WeatherWeb (Windy-style, Serverless)

WeatherWeb da duoc nang cap theo huong immersive UI/UX voi map full-screen, side panel, timeline scrubber, wind particles, va serverless proxy de an OpenWeatherMap API key.

## Kien truc moi

- Client chi goi cac endpoint noi bo `/api/*`.
- API key chi ton tai o serverless environment variable `OWM_API_KEY`.
- Open-Meteo duoc goi truc tiep o client (khong can key).

## Thu muc chinh

```text
weatherpro/
|-- api/
|   |-- weather.js
|   |-- forecast.js
|   |-- weather-coords.js
|   |-- forecast-coords.js
|   |-- geocode.js
|   `-- map-tile.js
|-- css/style.css
|-- js/
|   |-- app.js
|   |-- api.js
|   |-- api-openmeteo.js
|   |-- map.js
|   |-- layers/
|   |   |-- wind-layer.js
|   |   `-- radar.js
|   `-- ui/
|       |-- side-panel.js
|       |-- timeline.js
|       `-- search-autocomplete.js
|-- config.js
|-- index.html
|-- vercel.json
`-- .env.example
```

## Setup nhanh

1. Tao file `.env` tu `.env.example`.
2. Dat `OWM_API_KEY=your_real_key`.
3. Chay local voi Vercel:

```bash
vercel dev
```

## Tinh nang chinh

- Full-screen weather map + layer picker.
- Wind particles (leaflet-velocity).
- Side panel chi tiet thoi tiet + mini chart.
- Timeline scrubber 5 ngay (40 moc 3h).
- Geocoding autocomplete qua serverless proxy.
- Alerts banner theo dieu kien thoi tiet.
- Mobile UX dang bottom-sheet + timeline compact.
