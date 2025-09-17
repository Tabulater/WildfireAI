import express, { Request, Response } from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { fetchFirmsCsv } from "./data/firms.js";
import { getCurrentWeather } from "./data/weather.js";
import { logger } from "./utils/logger.js";

// __dirname in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT || 5173);

app.use(express.json());

// Serve static frontend
const publicDir = path.join(__dirname, "..", "public");
app.use(express.static(publicDir));

// Types
type FirePoint = { lat: number; lon: number; confidence?: string };

function toNumberSafe(value: string | undefined): number | undefined {
  if (value == null) return undefined;
  const n = Number(value);
  return Number.isFinite(n) ? n : undefined;
}

function dedupeAndLimit(points: FirePoint[], limit = 50): FirePoint[] {
  const seen = new Set<string>();
  const out: FirePoint[] = [];
  for (const p of points) {
    const key = `${p.lat.toFixed(2)},${p.lon.toFixed(2)}`; // ~1.1km bins
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(p);
    if (out.length >= limit) break;
  }
  return out;
}

app.get("/api/hotspots", async (req: Request, res: Response) => {
  try {
    const rows = await fetchFirmsCsv();
    const raw: FirePoint[] = [];
    for (const r of rows) {
      const lat = toNumberSafe(r["latitude"]);
      const lon = toNumberSafe(r["longitude"]);
      if (lat == null || lon == null) continue;
      raw.push({ lat, lon, confidence: r["confidence"] ?? (r as any)["confidence_text"] });
    }
    const limit = Math.min(200, Number(req.query.limit ?? 100));
    const points = dedupeAndLimit(raw, limit);
    res.json({ count: points.length, points });
  } catch (err: any) {
    logger.error("/api/hotspots failed", err);
    res.status(500).json({ error: "failed_to_fetch_hotspots" });
  }
});

app.get("/api/weather", async (req: Request, res: Response) => {
  try {
    const lat = Number(req.query.lat);
    const lon = Number(req.query.lon);
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
      return res.status(400).json({ error: "invalid_lat_lon" });
    }
    const weather = await getCurrentWeather(lat, lon);
    res.json(weather);
  } catch (err: any) {
    logger.error("/api/weather failed", err);
    const msg = err?.message || "unknown_error";
    res.status(500).json({ error: msg });
  }
});

app.get("/api/status", (_req: Request, res: Response) => {
  res.json({ ok: true, time: new Date().toISOString() });
});

app.listen(PORT, () => {
  logger.info(`Web server listening on http://localhost:${PORT}`);
  logger.info(`Open the app in your browser to see the Leaflet map.`);
});
