// Training worker
// Handles model training in a separate thread

// Listen for messages from the main thread
self.onmessage = async function(e) {
  const { type, payload } = e.data;
  
  try {
    switch (type) {
      case 'trainModel':
        // Train model with provided data
        trainModel(payload).then(result => {
          self.postMessage({ type: 'trainingComplete', payload: result });
        });
        break;
        
      case 'validateModel':
        // Validate model with test data
        const validationResult = validateModel(payload);
        self.postMessage({ type: 'validationComplete', payload: validationResult });
        break;
        
      default:
        self.postMessage({ type: 'error', error: 'Unknown message type' });
    }
  } catch (error) {
    self.postMessage({ type: 'error', error: error.message });
  }
};

// Train model function
async function trainModel(config) {
  const { modelName, trainingData, epochs = 10, batchSize = 32 } = config;
  
  // Simulate training progress
  for (let epoch = 1; epoch <= epochs; epoch++) {
    // Simulate training for one epoch
    await new Promise(resolve => setTimeout(resolve, 200));
    
    // Calculate progress
    const progress = Math.round((epoch / epochs) * 100);
    const loss = Math.random() * 0.1; // Simulated loss
    const accuracy = 0.8 + (0.15 * (epoch / epochs)); // Simulated accuracy
    
    // Send progress update
    self.postMessage({
      type: 'trainingProgress',
      payload: {
        epoch,
        totalEpochs: epochs,
        progress,
        metrics: {
          loss: parseFloat(loss.toFixed(4)),
          accuracy: parseFloat(accuracy.toFixed(4))
        },
        message: `Epoch ${epoch}/${epochs} - loss: ${loss.toFixed(4)}, accuracy: ${(accuracy * 100).toFixed(2)}%`
      }
    });
  }
  
  // Return training results
  return {
    success: true,
    modelName,
    metrics: {
      finalLoss: (Math.random() * 0.1).toFixed(4),
      finalAccuracy: (0.85 + Math.random() * 0.1).toFixed(4),
      trainingTime: epochs * 200, // ms per epoch
      samplesTrained: trainingData ? trainingData.length : 0
    },
    modelInfo: {
      parameters: Math.floor(Math.random() * 1000000),
      inputShape: trainingData ? trainingData[0].input.shape : null,
      outputShape: trainingData ? trainingData[0].output.shape : null
    }
  };
}

// Validate model function
function validateModel(config) {
  const { model, testData } = config;
  
  // Simulate validation
  const startTime = performance.now();
  
  // Calculate metrics (simulated)
  const accuracy = 0.82 + (Math.random() * 0.1);
  const precision = 0.8 + (Math.random() * 0.1);
  const recall = 0.78 + (Math.random() * 0.1);
  const f1 = 0.79 + (Math.random() * 0.1);
  
  const endTime = performance.now();
  
  return {
    success: true,
    metrics: {
      accuracy: parseFloat(accuracy.toFixed(4)),
      precision: parseFloat(precision.toFixed(4)),
      recall: parseFloat(recall.toFixed(4)),
      f1Score: parseFloat(f1.toFixed(4)),
      validationTime: endTime - startTime,
      samplesValidated: testData ? testData.length : 0
    },
    confusionMatrix: {
      truePositives: Math.floor(testData.length * accuracy * 0.7),
      trueNegatives: Math.floor(testData.length * accuracy * 0.3),
      falsePositives: Math.floor(testData.length * (1 - accuracy) * 0.4),
      falseNegatives: Math.floor(testData.length * (1 - accuracy) * 0.6)
    }
  };
}
