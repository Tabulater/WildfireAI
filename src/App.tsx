import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { useState, useEffect, Suspense, lazy } from "react";
import ModelInitializationStatus from "./components/ModelInitializationStatus";

// Lazy load pages
const Index = lazy(() => import("./pages/Index"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const NotFound = lazy(() => import("./pages/NotFound"));

const queryClient = new QueryClient();

// Loading component with animation
const LoadingFallback = () => (
  <div className="flex flex-col items-center justify-center min-h-screen bg-background p-4">
    <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
    <p className="text-muted-foreground">Loading application...</p>
  </div>
);

const AppContent = () => {
  const location = useLocation();
  const [showLoading, setShowLoading] = useState(true);
  const [modelsInitialized, setModelsInitialized] = useState(false);
  const [initialLoad, setInitialLoad] = useState(true);

  // Start model initialization on mount
  useEffect(() => {
    const initialize = async () => {
      try {
        const ModelInitializer = (await import('@/services/modelInitializer')).default;
        const initializer = ModelInitializer.getInstance();
        
        // Start initialization with critical models first
        await initializer.initializeAllModels(['wildfire-risk-v3']);
        setModelsInitialized(true);
      } catch (error) {
        console.error('Initialization error:', error);
        // Continue to app even if initialization fails
        setModelsInitialized(true);
      } finally {
        // Hide loading screen after initial content is ready
        setTimeout(() => setShowLoading(false), 500);
      }
    };

    initialize();
  }, []);

  // Show loading screen only on initial load
  if (showLoading) {
    return <ModelInitializationStatus onInitializationComplete={() => {}} />;
  }

  return (
    <Suspense fallback={<LoadingFallback />}>
      <Routes location={location}>
        <Route path="/" element={<Index />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  );
};

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AppContent />
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
