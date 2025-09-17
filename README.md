# Wildfire AI

A minimal Node.js + TypeScript scaffold to fetch NASA FIRMS active fire hotspots and print coordinates and confidence to the terminal.

## Prerequisites

- Node.js 18+ (uses built-in `fetch`)

## Getting Started

```bash
npm install
```

### Dev (watch mode)

```bash
npm run dev
```

### Build and Run

```bash
npm run build
npm start
```

### Web UI (Leaflet map with hotspots + weather)

```powershell
# Windows PowerShell: set your OpenWeather key for the session
$env:OPENWEATHER_API_KEY = "<your-openweather-key>"

# Install/update dependencies
npm install

# Run the web server (serves public/ and provides /api endpoints)
npm run web
```

Then open http://localhost:5173 in your browser. You'll see a world map with red markers for FIRMS hotspots. Click a marker to fetch current weather (temperature, wind, humidity, conditions) via the relay endpoint.

## Configuration

- `FIRMS_CSV_URL` (optional): Override the default dataset (MODIS Global 24h). Example alternatives:
  - MODIS (24h): https://firms.modaps.eosdis.nasa.gov/data/active_fire/c6.1/csv/MODIS_C6_1_Global_24h.csv
  - VIIRS (24h, NOAA-20 + NPP):
    - https://firms.modaps.eosdis.nasa.gov/data/active_fire/viirs/c2/csv/VNP14IMGTDL_NRT_Global_24h.csv
    - https://firms.modaps.eosdis.nasa.gov/data/active_fire/viirs-snpp/c2/csv/SUOMI_VIIRS_C2_Global_24h.csv

- `LOG_LEVEL`: one of `debug`, `info`, `warn`, `error` (default `info`).

### OpenWeatherMap setup

To enrich fire hotspots with live weather, set an OpenWeather API key in your environment:

- Get a free key: https://openweathermap.org/api
- Set `OPENWEATHER_API_KEY` before running.

Windows PowerShell examples:

```powershell
# One-time in current session
$env:OPENWEATHER_API_KEY = "<your-key>"

# Optional: change log level
$env:LOG_LEVEL = "info"

# Run in watch mode
npm run dev

# Or build & start
npm run build
npm start
```

On macOS/Linux (bash/zsh):

```bash
export OPENWEATHER_API_KEY="<your-key>"
export LOG_LEVEL=info
npm run dev
```

## Notes

- CSV parsing here is lightweight and assumes no embedded commas inside fields; this is fine for current FIRMS CSVs with numeric and simple text columns. If you encounter malformed rows, consider swapping in a robust CSV parser like `csv-parse`.
- This project uses ESM (`"type": "module"`) and TS config `moduleResolution: NodeNext`.
- A responsive layout is implemented in `public/styles.css` so the side panel collapses beneath the map on narrow screens.

## What the app does now

- `src/data/firms.ts` downloads the latest FIRMS CSV and parses rows.
- `src/utils/geo.ts` provides `haversineDistance(lat1, lon1, lat2, lon2)` (km) for spatial matching.
- `src/utils/fetchWrapper.ts` wraps `fetch` with up to 3 retries, exponential backoff, and incomplete-data detection/logging.
- `src/data/weather.ts` calls OpenWeather Current Weather API for given coordinates, with retry awareness.
- `src/server.ts` provides endpoints `GET /api/hotspots`, `GET /api/weather`, serves static files from `public/`.
- `public/index.html`, `public/app.js`, `public/styles.css` implement a Leaflet map UI, red circle markers for hotspots, and a weather info panel.
- `src/index.ts`:
  - Fetches FIRMS points.
  - Deduplicates nearby points (rounds to 2 decimals) and limits to 15 to avoid hammering the API.
  - Fetches weather for each point with concurrency limit (5), then logs a merged line per point.

## ML: preprocessing, synthetic data, and training

- `src/ml/preprocess.ts`:
  - `StandardScaler` for z-score normalization.
  - `vectorize()` to map `{ tempC, humidity, windSpeedMs, confidence }` -> `[tempC, humidity, windSpeedMs, confidenceNum]`.
- `src/ml/synthetic.ts`: generates a synthetic dataset with labels using simple domain heuristics + noise.
- `src/ml/model.ts`: defines a small TF.js model with two hidden layers and training helpers.
- `src/train.ts`: orchestrates synthetic data generation, scaling, training, evaluation, and saves artifacts under `models/<timestamp>/` (model + scaler.json).

### Train locally

1) Install dependencies (includes `@tensorflow/tfjs-node`):

```powershell
npm install
```

2) Run training:

```powershell
npm run train
```

Artifacts will be written to `models/<timestamp>/`.

Notes:
- Training uses the pure `@tensorflow/tfjs` CPU backend (no native bindings), so it works on Node 18–22 without `dlopen` issues.
- Training uses a synthetic dataset by default until you have a real labeled dataset.
