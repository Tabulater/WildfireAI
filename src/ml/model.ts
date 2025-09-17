import * as tf from "@tensorflow/tfjs";
import * as fs from "node:fs";
import * as path from "node:path";

export function buildModel(inputDim: number): tf.LayersModel {
  const model = tf.sequential();
  model.add(tf.layers.dense({ units: 16, activation: "relu", inputShape: [inputDim] }));
  model.add(tf.layers.dropout({ rate: 0.1 }));
  model.add(tf.layers.dense({ units: 8, activation: "relu" }));
  model.add(tf.layers.dense({ units: 1, activation: "sigmoid" }));

  model.compile({
    optimizer: "adam",
    loss: "binaryCrossentropy",
    metrics: ["accuracy"],
  });
  return model;
}

export async function trainModel(
  model: tf.LayersModel,
  xTrain: any,
  yTrain: any,
  xVal: any,
  yVal: any,
  epochs = 30,
  batchSize = 32
): Promise<any> {
  const history = await model.fit(xTrain, yTrain, {
    epochs,
    batchSize,
    validationData: [xVal, yVal],
    shuffle: true,
    verbose: 1,
  });
  return history;
}

export async function saveModel(model: tf.LayersModel, dirPath: string): Promise<void> {
  // Save using a custom IOHandler that writes model.json and weights.bin
  fs.mkdirSync(dirPath, { recursive: true });
  const handler: any = {
    save: async (artifacts: any) => {
      const weightsPath = "weights.bin";
      const modelPath = "model.json";

      const modelJson: any = {
        modelTopology: artifacts.modelTopology!,
        format: artifacts.format,
        generatedBy: artifacts.generatedBy,
        convertedBy: artifacts.convertedBy,
        trainingConfig: artifacts.trainingConfig,
        weightsManifest: [
          {
            paths: [weightsPath],
            weights: artifacts.weightSpecs!,
          },
        ],
      };

      if (artifacts.weightData) {
        const weightsBin = Buffer.from(new Uint8Array(artifacts.weightData as ArrayBuffer));
        fs.writeFileSync(path.join(dirPath, weightsPath), weightsBin);
      }
      fs.writeFileSync(path.join(dirPath, modelPath), JSON.stringify(modelJson, null, 2), "utf-8");

      return {
        modelArtifactsInfo: {
          dateSaved: new Date(),
          modelTopologyType: "JSON",
          modelTopologyBytes: modelJson.modelTopology
            ? JSON.stringify(modelJson.modelTopology).length
            : 0,
          weightSpecsBytes: JSON.stringify(modelJson.weightsManifest).length,
          weightDataBytes: artifacts.weightData ? (artifacts.weightData as ArrayBuffer).byteLength : 0,
        },
      } as any;
    },
  };

  await model.save(handler);
}
