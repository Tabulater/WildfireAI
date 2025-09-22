/**
 * Model Initializer Service
 * 
 * Handles optimized loading of ML models with the following features:
 * - Lazy loading of non-critical models
 * - Parallel model loading where possible
 * - Progress tracking and status updates
 * - Background initialization of heavy tasks
 */

export interface ModelInitializationStatus {
  isInitialized: boolean;
  totalModels: number;
  loadedModels: number;
  initializationTime: number;
  errors: string[];
  modelStats: {
    totalParameters: number;
    averageAccuracy: number;
    modelNames: string[];
  };
  currentStep: string;
  progress: number;
}

export interface InitializationStep {
  name: string;
  progress: number;
  status: 'pending' | 'running' | 'completed' | 'error';
  message: string;
}

class ModelInitializer {
  private static instance: ModelInitializer;
  private isInitialized = false;
  private initializationStartTime: number = 0;
  private errors: string[] = [];
  private currentStep: string = 'Initializing...';
  private progress: number = 0;
  private statusCallbacks: ((status: ModelInitializationStatus) => void)[] = [];
  private criticalModels: string[] = ['wildfire-risk-v3', 'fire-spread-v2'];
  private loadedModels: Set<string> = new Set();
  private backgroundInitializationPromise: Promise<void> | null = null;
  private dataWorker: Worker | null = null;
  private trainingWorker: Worker | null = null;

  private constructor() {}

  public static getInstance(): ModelInitializer {
    if (!ModelInitializer.instance) {
      ModelInitializer.instance = new ModelInitializer();
    }
    return ModelInitializer.instance;
  }

  public onStatusUpdate(callback: (status: ModelInitializationStatus) => void): void {
    this.statusCallbacks.push(callback);
  }

  private updateStatus(updates: Partial<ModelInitializationStatus>): void {
    const status = this.getStatus();
    const newStatus = { ...status, ...updates };
    
    // Update internal state
    if (updates.progress !== undefined) this.progress = updates.progress;
    if (updates.currentStep) this.currentStep = updates.currentStep;
    
    // Notify all callbacks
    this.statusCallbacks.forEach(callback => callback(newStatus));
  }

  public async initializeAllModels(priorityModels: string[] = []): Promise<ModelInitializationStatus> {
    if (this.isInitialized) {
      return this.getStatus();
    }

    this.initializationStartTime = Date.now();
    this.isInitialized = false;
    this.errors = [];
    this.progress = 0;
    this.loadedModels.clear();

    try {
      // Initialize workers first
      const workers = await this.initializeWorkers();
      this.dataWorker = workers.dataWorker;
      this.trainingWorker = workers.trainingWorker;

      // Start background initialization
      this.backgroundInitializationPromise = this.continueBackgroundInitialization(
        Promise.resolve(workers)
      );

      // Load critical models first
      await this.loadModels(this.criticalModels, 0, 60);

      // Wait for background initialization to complete
      if (this.backgroundInitializationPromise) {
        await this.backgroundInitializationPromise;
      }

      // Finalize initialization
      await this.finalizeInitialization();
      return this.getStatus();
    } catch (error) {
      const errorMessage = `Initialization failed: ${error}`;
      console.error('❌', errorMessage);
      this.errors.push(errorMessage);
      
      // Still mark as initialized to show UI
      this.isInitialized = true;
      return this.getStatus();
    }
  }

  private async initializeWorkers(): Promise<{ dataWorker: Worker | null; trainingWorker: Worker | null }> {
    return new Promise((resolve) => {
      try {
        // Check if Web Workers are supported
        if (typeof Worker === 'undefined') {
          console.warn('Web Workers are not supported in this environment. Falling back to main thread processing.');
          return resolve({ dataWorker: null, trainingWorker: null });
        }
        
        // Create Web Workers for heavy computations using Vite's worker import syntax
        const dataWorker = new Worker(
          /* @vite-ignore */
          new URL('./workers/dataWorker.js', import.meta.url),
          { 
            type: 'module',
            name: 'data-worker',
            // @ts-ignore - Vite specific worker options
            worker: { format: 'es' }
          }
        );
        
        const trainingWorker = new Worker(
          /* @vite-ignore */
          new URL('./workers/trainingWorker.js', import.meta.url),
          { 
            type: 'module',
            name: 'training-worker',
            // @ts-ignore - Vite specific worker options
            worker: { format: 'es' }
          }
        );
        
        // Handle worker errors
        const handleWorkerError = (workerType: string, error: ErrorEvent) => {
          console.error(`${workerType} worker error:`, error);
          // Don't reject, just continue without workers
          resolve({ dataWorker: null, trainingWorker: null });
        };
        
        dataWorker.onerror = (error) => handleWorkerError('Data', error);
        trainingWorker.onerror = (error) => handleWorkerError('Training', error);
        
        // If we get here, workers are initialized successfully
        resolve({ dataWorker, trainingWorker });
      } catch (error) {
        console.error('Error initializing workers:', error);
        // Return null for workers if there's an error
        resolve({ dataWorker: null, trainingWorker: null });
      }
    });
  }

  private async loadDataInChunks(dataWorker: Worker | null): Promise<any> {
    if (!dataWorker) {
      // Simulate data loading without workers
      const totalChunks = 10;
      for (let i = 0; i < totalChunks; i++) {
        const progress = Math.round((i / totalChunks) * 100);
        this.updateStatus({
          progress: 20 + (progress * 0.3), // 20-50% range
          currentStep: `Loading data: Chunk ${i + 1} of ${totalChunks}`
        });
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      return { 
        success: true,
        message: 'Data loaded in main thread',
        chunksProcessed: totalChunks,
        timestamp: new Date().toISOString()
      };
    }
    
    return new Promise((resolve, reject) => {
      const handleMessage = (event: MessageEvent) => {
        if (event.data.type === 'progress') {
          this.updateStatus({
            progress: 20 + (event.data.payload.progress * 0.3), // 20-50% range
            currentStep: `Loading data: ${event.data.payload.message}`
          });
        } else if (event.data.type === 'dataLoaded') {
          dataWorker.removeEventListener('message', handleMessage);
          resolve(event.data.payload);
        } else if (event.data.type === 'error') {
          dataWorker.removeEventListener('message', handleMessage);
          reject(new Error(event.data.error || 'Error in data worker'));
        }
      };
      
      dataWorker.addEventListener('message', handleMessage);
      
      // Start data loading
      dataWorker.postMessage({
        type: 'loadData',
        payload: {
          chunkSize: 1000,
          totalItems: 10000
        }
      });
    });
  }

  private async trainModelsInBackground(trainingWorker: Worker | null): Promise<any> {
    if (!trainingWorker) {
      // Simulate model training without workers
      await new Promise(resolve => setTimeout(resolve, 2000));
      return { success: true, message: 'Training completed in main thread' };
    }

    return new Promise((resolve, reject) => {
      const handleMessage = (event: MessageEvent) => {
        if (event.data.type === 'trainingProgress') {
          this.updateStatus({
            progress: 60 + (event.data.payload.progress * 0.4), // 60-100% range
            currentStep: `Training: ${event.data.payload.message}`
          });
        } else if (event.data.type === 'trainingComplete') {
          trainingWorker.removeEventListener('message', handleMessage);
          resolve(event.data.payload);
        } else if (event.data.type === 'error') {
          trainingWorker.removeEventListener('message', handleMessage);
          reject(new Error(event.data.error || 'Error in training worker'));
        }
      };

      trainingWorker.addEventListener('message', handleMessage);

      // Start model training
      trainingWorker.postMessage({
        type: 'trainModel',
        payload: {
          modelName: 'wildfire-prediction',
          epochs: 10,
          batchSize: 32
        }
      });
    });
  }

  private async continueBackgroundInitialization(
    workersPromise: Promise<{ dataWorker: Worker | null; trainingWorker: Worker | null }>
  ): Promise<void> {
    try {
      const { dataWorker, trainingWorker } = await workersPromise;
      
      // Start data loading and model training in parallel
      const [dataResult, trainingResult] = await Promise.all([
        this.loadDataInChunks(dataWorker),
        this.trainModelsInBackground(trainingWorker)
      ]);

      console.log('Background initialization completed:', { dataResult, trainingResult });
    } catch (error) {
      console.error('Background initialization failed:', error);
      throw error;
    }
  }

  private async loadModels(
    modelNames: string[],
    startProgress: number,
    endProgress: number
  ): Promise<void> {
    if (modelNames.length === 0) return;

    const progressIncrement = (endProgress - startProgress) / modelNames.length;
    
    for (let i = 0; i < modelNames.length; i++) {
      const modelName = modelNames[i];
      const modelProgress = startProgress + (i * progressIncrement);
      
      try {
        await this.loadModel(modelName);
        this.updateStatus({
          progress: modelProgress + (progressIncrement * 0.8),
          currentStep: `Loaded model: ${modelName}`
        });
      } catch (error) {
        const errorMessage = `Failed to load model ${modelName}: ${error}`;
        console.error(errorMessage);
        this.errors.push(errorMessage);
      }
    }
  }

  private async loadModel(modelName: string): Promise<void> {
    if (this.loadedModels.has(modelName)) {
      return; // Already loaded
    }

    // Simulate model loading
    const loadTime = Math.random() * 1000 + 500; // 500-1500ms
    await new Promise(resolve => setTimeout(resolve, loadTime));
    
    this.loadedModels.add(modelName);
    console.log(`Loaded model: ${modelName}`);
  }

  private async finalizeInitialization(): Promise<void> {
    // Perform any final setup
    await new Promise(resolve => setTimeout(resolve, 500));
    
    this.isInitialized = true;
    this.progress = 100;
    this.updateStatus({
      currentStep: 'Initialization complete',
      progress: 100
    });
    
    console.log('Model initialization completed in', 
      ((Date.now() - this.initializationStartTime) / 1000).toFixed(2), 'seconds');
  }

  public getStatus(): ModelInitializationStatus {
    return {
      isInitialized: this.isInitialized,
      totalModels: this.criticalModels.length,
      loadedModels: this.loadedModels.size,
      initializationTime: this.initializationStartTime > 0 
        ? (Date.now() - this.initializationStartTime) / 1000 
        : 0,
      errors: [...this.errors],
      modelStats: {
        totalParameters: 0, // Would be calculated based on loaded models
        averageAccuracy: 0, // Would be calculated based on loaded models
        modelNames: Array.from(this.loadedModels)
      },
      currentStep: this.currentStep,
      progress: this.progress
    };
  }

  public async getModelMetadata(): Promise<any[]> {
    // Simulate fetching model metadata
    return [
      { name: 'wildfire-risk-v3', version: '1.0.0', accuracy: 0.95 },
      { name: 'fire-spread-v2', version: '2.1.0', accuracy: 0.92 }
    ];
  }

  public async makePrediction(input: any): Promise<any> {
    if (!this.isInitialized) {
      throw new Error('Model not initialized');
    }
    
    // Simulate prediction
    return {
      prediction: Math.random(),
      confidence: 0.9 + (Math.random() * 0.1),
      timestamp: new Date().toISOString()
    };
  }

  public async batchPredict(inputs: any[]): Promise<any[]> {
    if (!this.isInitialized) {
      throw new Error('Model not initialized');
    }
    
    // Process predictions in batches if needed
    const batchSize = 10;
    const results = [];
    
    for (let i = 0; i < inputs.length; i += batchSize) {
      const batch = inputs.slice(i, i + batchSize);
      const batchResults = await Promise.all(
        batch.map(input => this.makePrediction(input))
      );
      results.push(...batchResults);
    }
    
    return results;
  }

  public isReady(): boolean {
    return this.isInitialized;
  }

  public getInitializationProgress(): number {
    return this.progress;
  }
}

export default ModelInitializer;
