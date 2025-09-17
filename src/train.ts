import * as fs from "node:fs";
import * as path from "node:path";
import * as tf from "@tensorflow/tfjs";
import "@tensorflow/tfjs-backend-cpu";
import { logger } from "./utils/logger.js";
import { generateSyntheticDataset } from "./ml/synthetic.js";
import { StandardScaler, vectorize, toConfidenceNumber } from "./ml/preprocess.js";
import { buildModel, trainModel, saveModel } from "./ml/model.js";

async function main() {
  const T = tf as any;
  await T.setBackend("cpu");
  await T.ready();
  logger.info(`Using TF backend: ${T.getBackend()}`);
  logger.info("Generating synthetic dataset...");
  const dataset = generateSyntheticDataset(3000);

  // Vectorize features (already vectorized in synthetic, but we keep consistent path)
  const X = dataset.map((d) => d.x);
  const y = dataset.map((d) => d.y);

  // Fit scaler and transform
  const scaler = new StandardScaler();
  const Xs = scaler.fitTransform(X);

  // Train/val split
  const valFrac = 0.2;
  const n = Xs.length;
  const nVal = Math.floor(n * valFrac);
  const nTrain = n - nVal;

  // Simple split without shuffling for determinism; you can shuffle for better mixing
  const xTrainArr = Xs.slice(0, nTrain);
  const yTrainArr = y.slice(0, nTrain);
  const xValArr = Xs.slice(nTrain);
  const yValArr = y.slice(nTrain);

  const xTrain = (T.tensor2d as any)(xTrainArr as number[][]);
  const yTrain = (T.tensor1d as any)(yTrainArr as number[]);
  const xVal = (T.tensor2d as any)(xValArr as number[][]);
  const yVal = (T.tensor1d as any)(yValArr as number[]);

  const inputDim = (xTrain.shape as number[])[1];
  const model = buildModel(inputDim);

  logger.info("Training model...");
  const history = await trainModel(model, xTrain, yTrain, xVal, yVal, 25, 32);
  logger.info("Training complete", history.history);

  // Evaluate
  const evalRes = model.evaluate(xVal, yVal, { batchSize: 64, verbose: 0 }) as any;
  if (Array.isArray(evalRes)) {
    logger.info("Eval result (loss, acc)", evalRes.map((t: any) => t.dataSync()[0]));
  } else if (evalRes && typeof (evalRes as any).dataSync === "function") {
    logger.info("Eval result (loss)", (evalRes as any).dataSync()[0]);
  }

  // Save artifacts
  const outDir = path.join(process.cwd(), "models", timestampDir());
  fs.mkdirSync(outDir, { recursive: true });
  await saveModel(model, outDir);

  const scalerPath = path.join(outDir, "scaler.json");
  fs.writeFileSync(scalerPath, JSON.stringify(scaler.getParams(), null, 2));
  logger.info("Saved model and scaler to", outDir);

  // Clean up tensors
  xTrain.dispose();
  yTrain.dispose();
  xVal.dispose();
  yVal.dispose();
}

function timestampDir(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  const yyyy = d.getFullYear();
  const mm = pad(d.getMonth() + 1);
  const dd = pad(d.getDate());
  const hh = pad(d.getHours());
  const mi = pad(d.getMinutes());
  const ss = pad(d.getSeconds());
  return `fire-risk-${yyyy}${mm}${dd}-${hh}${mi}${ss}`;
}

main().catch((err) => {
  logger.error("Training script failed", err);
  process.exitCode = 1;
});
