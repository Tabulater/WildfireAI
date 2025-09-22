import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Progress } from './ui/progress';
import { Alert, AlertDescription } from './ui/alert';
import { CheckCircle, AlertCircle, Flame } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface ModelInitializationStatusProps {
  onInitializationComplete?: () => void;
}

interface ModelStatus {
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

const loadingMessages = [
  'Analyzing satellite imagery...',
  'Processing weather data...',
  'Initializing prediction models...',
  'Preparing risk assessment...',
  'Optimizing performance...'
];

const ModelInitializationStatus: React.FC<ModelInitializationStatusProps> = ({ 
  onInitializationComplete = () => {} 
}) => {
  const [status, setStatus] = useState<ModelStatus | null>(null);
  const [currentMessage, setCurrentMessage] = useState(loadingMessages[0]);
  const [progress, setProgress] = useState(0);
  
  // Rotate through loading messages
  useEffect(() => {
    if (progress < 100) {
      const timer = setInterval(() => {
        setCurrentMessage(prev => {
          const currentIndex = loadingMessages.indexOf(prev);
          const nextIndex = (currentIndex + 1) % loadingMessages.length;
          return loadingMessages[nextIndex];
        });
      }, 3000);
      return () => clearInterval(timer);
    }
  }, [progress]);

  // Smooth progress animation
  useEffect(() => {
    if (status?.progress !== undefined) {
      const target = Math.min(status.progress, 95);
      const duration = 1000;
      const startTime = performance.now();
      const startProgress = progress;
      
      const animate = (currentTime: number) => {
        const elapsed = currentTime - startTime;
        const progressFraction = Math.min(elapsed / duration, 1);
        const newProgress = startProgress + (target - startProgress) * progressFraction;
        
        setProgress(newProgress);
        
        if (progressFraction < 1) {
          requestAnimationFrame(animate);
        }
      };
      
      requestAnimationFrame(animate);
    }
  }, [status?.progress]);

  // Initialize models
  useEffect(() => {
    let mounted = true;
    
    const initialize = async () => {
      try {
        const ModelInitializer = (await import('../services/modelInitializer')).default;
        const initializer = ModelInitializer.getInstance();
        
        // Set up status updates
        const handleStatusUpdate = (newStatus: ModelStatus) => {
          if (mounted) {
            setStatus(prev => ({
              ...(prev || {}),
              ...newStatus,
              errors: newStatus.errors || []
            }));
            
            if (newStatus.isInitialized) {
              setProgress(100);
              setTimeout(() => onInitializationComplete(), 500);
            }
          }
        };
        
        initializer.onStatusUpdate(handleStatusUpdate);
        
        // Start initialization if not already started
        if (!initializer.isReady()) {
          await initializer.initializeAllModels();
        } else if (mounted) {
          handleStatusUpdate(initializer.getStatus());
        }
      } catch (error) {
        console.error('Initialization error:', error);
        if (mounted) {
          setStatus(prev => ({
            ...(prev || {
              isInitialized: false,
              totalModels: 5,
              loadedModels: 0,
              initializationTime: 0,
              errors: [],
              modelStats: { totalParameters: 0, averageAccuracy: 0, modelNames: [] },
              currentStep: 'Initialization failed',
              progress: 0
            }),
            errors: [...(prev?.errors || []), 'Failed to initialize: ' + (error as Error).message],
            isInitialized: true
          }));
          setProgress(100);
          setTimeout(() => onInitializationComplete(), 1000);
        }
      }
    };
    
    initialize();
    
    return () => {
      mounted = false;
    };
  }, [onInitializationComplete]);

  const isLoading = progress < 100;

  if (!status) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background p-4">
        <div className="text-center space-y-6 max-w-md w-full">
          <div className="relative mx-auto w-24 h-24">
            <motion.div
              className="absolute inset-0 border-4 border-primary border-t-transparent rounded-full"
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <Flame className="h-8 w-8 text-primary" />
            </div>
          </div>
          <h2 className="text-2xl font-bold tracking-tight">Wildfire AI</h2>
          <p className="text-muted-foreground">Loading application...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md overflow-hidden">
        <div className="relative h-2 bg-muted">
          <motion.div 
            className="absolute top-0 left-0 h-full bg-primary"
            initial={{ width: '0%' }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
          />
        </div>
        
        <CardHeader className="pb-2">
          <CardTitle className="text-xl flex items-center gap-2">
            {isLoading ? (
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
              >
                <Flame className="h-6 w-6 text-primary" />
              </motion.div>
            ) : (
              <CheckCircle className="h-6 w-6 text-green-500" />
            )}
            <span>{isLoading ? 'Initializing' : 'Ready'}</span>
          </CardTitle>
        </CardHeader>
        
        <CardContent className="space-y-6 pt-0">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentMessage}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              className="h-10 flex items-center justify-center"
            >
              <p className="text-center text-muted-foreground">
                {status.currentStep || currentMessage}
              </p>
            </motion.div>
          </AnimatePresence>
          
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">
                {isLoading ? 'Initializing...' : 'Complete'}
              </span>
              <span className="font-medium">{Math.round(progress)}%</span>
            </div>
          </div>
          
          {status.errors.length > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="overflow-hidden"
            >
              <Alert variant="destructive" className="mt-2">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-sm">
                  {status.errors[status.errors.length - 1]}
                </AlertDescription>
              </Alert>
            </motion.div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ModelInitializationStatus;
