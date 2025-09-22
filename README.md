# 🔥 Wildfire AI

AI‑powered wildfire monitoring, prediction, and risk assessment.

[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-20232A?logo=react&logoColor=61DAFB)](https://react.dev)
[![Vite](https://img.shields.io/badge/Vite-646CFF?logo=vite&logoColor=white)](https://vitejs.dev)

## 🌟 Overview

Wildfire AI aggregates real‑time satellite, agency, and weather data to surface fire risk insights and timely alerts. The dashboard is fully responsive and state‑aware: changing the selected state updates the map, weather, alerts, and news widgets consistently.

## ✨ Features

- Real‑time incident data and AI‑based risk signals
- State‑aware dashboard: all widgets update when a state is selected
- Weather intelligence per state and regions
- Live alert stream (severity‑ranked) and curated news feed
- Fast, modern UI with Tailwind + shadcn/ui components

## 🚀 Quick Start

Prerequisites
- Node.js 18+ and npm

Setup
```bash
git clone https://github.com/TheAgencyMGE/wildfire-ai.git
cd wildfire-ai
npm install
npm run dev
```
App runs at `http://localhost:5173`.

Build & Preview
```bash
npm run build
npm run preview
```

Useful Scripts
- `npm run dev` – start dev server
- `npm run build` – production build
- `npm run build:dev` – development build profile
- `npm run preview` – preview production build
- `npm run lint` – lint the codebase

## 🔧 Configuration

Create a `.env` in the project root (optional – runs with public data):
```env
# API Keys (optional)
VITE_NASA_FIRMS_API_KEY=your_nasa_key_here
VITE_WEATHER_API_KEY=your_weather_key_here

# CORS Proxy (used by some sources)
VITE_CORS_PROXY_URL=https://api.allorigins.win/get?url=
```

## 🧱 Project Structure
```
src/
├─ components/
│  ├─ AlertSystem.tsx          # Live alerts; state-aware via stateCode
│  ├─ FireMap.tsx              # Leaflet map (state-aware)
│  ├─ WeatherWidget.tsx        # Weather + risk for given lat/lon
│  └─ WebScraper.tsx           # Curated live feed; state-aware via stateCode
├─ pages/
│  ├─ Dashboard.tsx            # Main dashboard (tabs, widgets)
│  └─ Index.tsx                # Landing page
├─ services/                   # Data + ML services
│  ├─ api.ts                   # Data contracts, US_STATES, helpers
│  ├─ realDataProcessor.ts     # Real fire data processing
│  ├─ advancedMLPredictor.ts   # Advanced ML predictions
│  └─ ...
└─ components/ui/              # shadcn/ui primitives
```

## 🧠 ML & Data
- TensorFlow.js + utilities for risk and prediction signals
- Data sources: NASA FIRMS, CAL FIRE, NIFC, NOAA/NWS, curated feeds
- Fallback strategies for resilience and simulated data where needed

## 🛠 Development Notes
- Tech: React 18, TypeScript, Vite, Tailwind, shadcn/ui, Leaflet
- Routing: React Router
- State awareness: dashboard passes `selectedState` into widgets; widgets refresh on prop change

## ❓ Troubleshooting
- Port in use: change Vite port `--port 5173` or stop the other process
- Blank map tiles: check network access to OSM tiles
- CORS errors: set `VITE_CORS_PROXY_URL` or run a local proxy
- Slow data: sources are polled on intervals; try Refresh in the header

## 🤝 Contributing
1. Fork and create a feature branch
2. Commit with clear messages
3. Open a Pull Request

## 📄 License
MIT © TheAgencyMGE. See [LICENSE](LICENSE).

## 🙏 Acknowledgments
- NASA FIRMS, NOAA/NWS, CAL FIRE, NIFC
- TensorFlow.js
- shadcn/ui

---
⚠️ This system assists with wildfire awareness. Always follow official guidance and emergency alerts from authorities.
