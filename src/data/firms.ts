import { logger } from "../utils/logger.js";

// Default to publicly accessible MODIS 24h CSV feed. You can override with env FIRMS_CSV_URL.
const DEFAULT_FIRMS_CSV =
  "https://firms.modaps.eosdis.nasa.gov/data/active_fire/c6.1/csv/MODIS_C6_1_Global_24h.csv";

export type FirmRow = {
  latitude?: string;
  longitude?: string;
  confidence?: string;
  [key: string]: string | undefined;
};

function parseCsv(text: string): FirmRow[] {
  const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length === 0) return [];
  const headers = lines[0].split(",").map((h) => h.trim());
  const rows: FirmRow[] = [];
  for (let i = 1; i < lines.length; i++) {
    const parts = lines[i].split(",");
    if (parts.length !== headers.length) {
      // Skip malformed rows
      continue;
    }
    const row: FirmRow = {};
    for (let j = 0; j < headers.length; j++) {
      row[headers[j]] = parts[j]?.trim();
    }
    rows.push(row);
  }
  return rows;
}

export async function fetchFirmsCsv(url = process.env.FIRMS_CSV_URL || DEFAULT_FIRMS_CSV): Promise<FirmRow[]> {
  logger.info("Fetching NASA FIRMS CSV...", url);
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Failed to fetch FIRMS CSV: ${res.status} ${res.statusText}`);
  }
  const text = await res.text();
  const rows = parseCsv(text);
  logger.info(`Fetched ${rows.length} rows from FIRMS`);
  return rows;
}

export async function printCoordinatesAndConfidence(): Promise<void> {
  const rows = await fetchFirmsCsv();
  let count = 0;
  for (const row of rows) {
    const lat = row["latitude"];
    const lon = row["longitude"];
    // Different feeds use 'confidence' or 'confidence_text', keep both if present
    const confidence = row["confidence"] ?? row["confidence_text"];
    if (lat && lon) {
      logger.info(`lat=${lat} lon=${lon} confidence=${confidence ?? "NA"}`);
      count++;
    }
  }
  logger.info(`Printed ${count} rows with coordinates`);
}
