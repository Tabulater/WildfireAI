import { logger } from "../utils/logger.js";

export type RawFeature = {
  tempC?: number | null;
  humidity?: number | null; // percent 0-100
  windSpeedMs?: number | null; // m/s
  confidence?: string | number | null; // numeric or text
};

export type Vectorized = [number, number, number, number]; // [tempC, humidity, windSpeedMs, confidenceNum]

export function toConfidenceNumber(value: string | number | null | undefined): number {
  if (value == null) return 0;
  if (typeof value === "number" && Number.isFinite(value)) return value;
  const s = String(value).toLowerCase();
  // common in FIRMS: low/nominal/high or numeric strings
  const num = Number(s);
  if (Number.isFinite(num)) return num;
  if (s.includes("low")) return 25;
  if (s.includes("nominal")) return 50;
  if (s.includes("high")) return 75;
  return 0;
}

export function vectorize(r: RawFeature): Vectorized {
  return [
    Number.isFinite(r.tempC as number) ? (r.tempC as number) : 0,
    Number.isFinite(r.humidity as number) ? (r.humidity as number) : 0,
    Number.isFinite(r.windSpeedMs as number) ? (r.windSpeedMs as number) : 0,
    toConfidenceNumber(r.confidence),
  ];
}

export class StandardScaler {
  private mean: number[] | null = null;
  private std: number[] | null = null;

  fit(samples: Vectorized[]): void {
    if (samples.length === 0) {
      throw new Error("StandardScaler.fit received empty samples");
    }
    const dims = samples[0].length;
    const mean = new Array(dims).fill(0);
    const std = new Array(dims).fill(0);

    // mean
    for (const s of samples) {
      for (let i = 0; i < dims; i++) mean[i] += s[i];
    }
    for (let i = 0; i < dims; i++) mean[i] /= samples.length;

    // variance
    for (const s of samples) {
      for (let i = 0; i < dims; i++) std[i] += Math.pow(s[i] - mean[i], 2);
    }
    for (let i = 0; i < dims; i++) std[i] = Math.sqrt(std[i] / samples.length) || 1; // avoid divide by 0

    this.mean = mean;
    this.std = std;
    logger.debug("StandardScaler fitted", { mean, std });
  }

  transform(samples: Vectorized[]): Vectorized[] {
    if (!this.mean || !this.std) throw new Error("StandardScaler not fitted");
    return samples.map((s) => s.map((v, i) => (v - this.mean![i]) / this.std![i]) as Vectorized);
  }

  fitTransform(samples: Vectorized[]): Vectorized[] {
    this.fit(samples);
    return this.transform(samples);
  }

  getParams(): { mean: number[]; std: number[] } {
    if (!this.mean || !this.std) throw new Error("StandardScaler not fitted");
    return { mean: this.mean, std: this.std };
  }
}
