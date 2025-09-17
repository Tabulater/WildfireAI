import { logger } from "./utils/logger.js";
import { fetchFirmsCsv } from "./data/firms.js";
import { getCurrentWeather } from "./data/weather.js";

type FirePoint = {
  lat: number;
  lon: number;
  confidence?: string;
};

function toNumberSafe(value: string | undefined): number | undefined {
  if (value == null) return undefined;
  const n = Number(value);
  return Number.isFinite(n) ? n : undefined;
}

function dedupeAndLimit(points: FirePoint[], limit = 15): FirePoint[] {
  const seen = new Set<string>();
  const out: FirePoint[] = [];
  for (const p of points) {
    // Round to 2 decimals (~1.1km) to coalesce near-duplicates
    const key = `${p.lat.toFixed(2)},${p.lon.toFixed(2)}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(p);
    if (out.length >= limit) break;
  }
  return out;
}

async function runWithConcurrency<T, R>(items: T[], limit: number, worker: (item: T, idx: number) => Promise<R>): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let next = 0;
  const runners: Promise<void>[] = [];

  async function runOne(i: number) {
    try {
      results[i] = await worker(items[i], i);
    } catch (err) {
      logger.error("Worker failed", err);
      // @ts-expect-error assign possibly undefined when error; keep undefined slot
      results[i] = undefined;
    }
  }

  for (let c = 0; c < Math.min(limit, items.length); c++) {
    runners.push((async function spawn() {
      while (next < items.length) {
        const i = next++;
        await runOne(i);
      }
    })());
  }
  await Promise.all(runners);
  return results;
}

async function main() {
  try {
    logger.info("Wildfire AI bootstrap starting...");

    const rows = await fetchFirmsCsv();
    const rawPoints: FirePoint[] = [];
    for (const r of rows) {
      const lat = toNumberSafe(r["latitude"]);
      const lon = toNumberSafe(r["longitude"]);
      if (lat == null || lon == null) continue;
      rawPoints.push({ lat, lon, confidence: r["confidence"] ?? r["confidence_text"] });
    }

    if (rawPoints.length === 0) {
      logger.warn("No FIRMS points available to process");
      return;
    }

    const points = dedupeAndLimit(rawPoints, 15);
    logger.info(`Processing ${points.length} unique fire points for weather enrichment`);

    const weatherResults = await runWithConcurrency(points, 5, async (p, idx) => {
      const w = await getCurrentWeather(p.lat, p.lon);
      logger.debug(`Weather fetched for point #${idx + 1}`);
      return { point: p, weather: w };
    });

    for (const item of weatherResults) {
      if (!item) continue;
      const { point, weather } = item as { point: FirePoint; weather: ReturnType<typeof getCurrentWeather> extends Promise<infer U> ? U : never };
      logger.info(
        `🔥 Fire at lat=${point.lat.toFixed(3)}, lon=${point.lon.toFixed(3)}, conf=${point.confidence ?? "NA"} | ` +
          `🌤️ ${weather.description ?? "n/a"}, tempC=${weather.tempC.toFixed(1)}, wind=${weather.windSpeedMs ?? "?"}m/s`
      );
    }

    logger.info("Done.");
  } catch (err) {
    logger.error("Unhandled error in main:", err);
    process.exitCode = 1;
  }
}

main();
