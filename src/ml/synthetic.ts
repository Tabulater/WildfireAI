import { Vectorized } from "./preprocess.js";

export type Labeled = { x: Vectorized; y: number };

// Generate a synthetic dataset based on simple domain heuristics.
// Heuristic: higher temp, lower humidity, higher wind, higher confidence -> higher risk.
// Add noise and some counterexamples to avoid overfitting to the heuristic.
export function generateSyntheticDataset(count = 2000): Labeled[] {
  const out: Labeled[] = [];
  for (let i = 0; i < count; i++) {
    // Sample ranges
    const tempC = randn(25, 10); // avg 25C, std 10
    const humidity = clamp(randn(45, 25), 0, 100);
    const wind = clamp(randn(4, 2), 0, 25);
    const confidence = clamp(randn(50, 30), 0, 100);

    const x: Vectorized = [tempC, humidity, wind, confidence];

    // Logit score
    let score = 0;
    score += (tempC - 20) * 0.05;
    score += (50 - humidity) * 0.03; // lower humidity increases risk
    score += wind * 0.05;
    score += (confidence - 50) * 0.02;
    score += randn(0, 0.5); // noise

    // Occasionally flip the label to simulate mislabeled/noisy data
    let y = sigmoid(score) > 0.5 ? 1 : 0;
    if (Math.random() < 0.05) y = 1 - y;

    out.push({ x, y });
  }
  return out;
}

function sigmoid(z: number): number {
  return 1 / (1 + Math.exp(-z));
}

function randn(mu = 0, sigma = 1): number {
  // Box-Muller transform
  let u = 0, v = 0;
  while (u === 0) u = Math.random();
  while (v === 0) v = Math.random();
  const n = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
  return n * sigma + mu;
}

function clamp(x: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, x));
}
