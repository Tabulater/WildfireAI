// Data processing worker
// Handles heavy data processing tasks in a separate thread

// Listen for messages from the main thread
self.onmessage = async function(e) {
  const { type, payload } = e.data;
  
  try {
    switch (type) {
      case 'processData':
        // Process data here
        const result = processData(payload);
        self.postMessage({ type: 'dataProcessed', payload: result });
        break;
        
      case 'loadData':
        // Load data in chunks
        loadDataChunks(payload).then(result => {
          self.postMessage({ type: 'dataLoaded', payload: result });
        });
        break;
        
      default:
        self.postMessage({ type: 'error', error: 'Unknown message type' });
    }
  } catch (error) {
    self.postMessage({ type: 'error', error: error.message });
  }
};

// Process data function
function processData(data) {
  // Add your data processing logic here
  return {
    processed: true,
    timestamp: new Date().toISOString(),
    data: data // Processed data would go here
  };
}

// Load data in chunks
async function loadDataChunks(config) {
  const { chunkSize = 1000, totalItems = 10000 } = config;
  const chunks = [];
  
  for (let i = 0; i < totalItems; i += chunkSize) {
    // Simulate loading a chunk of data
    const chunk = {
      start: i,
      end: Math.min(i + chunkSize, totalItems),
      data: Array(chunkSize).fill(0).map((_, idx) => ({
        id: i + idx,
        value: Math.random() * 100
      }))
    };
    
    chunks.push(chunk);
    
    // Send progress update
    const progress = Math.min(100, Math.round(((i + chunkSize) / totalItems) * 100));
    self.postMessage({ 
      type: 'progress', 
      payload: { progress, message: `Loaded ${i + chunkSize} of ${totalItems} items` } 
    });
    
    // Small delay to simulate processing time
    await new Promise(resolve => setTimeout(resolve, 50));
  }
  
  return {
    success: true,
    totalChunks: chunks.length,
    totalItems: chunks.reduce((sum, chunk) => sum + chunk.data.length, 0)
  };
}
