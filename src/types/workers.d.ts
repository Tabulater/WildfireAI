// Type definitions for web workers
declare module '*?worker' {
  // Import the worker as a constructor
  const workerConstructor: new () => Worker;
  export default workerConstructor;
}

declare module '*?worker&inline' {
  // For inline workers
  const workerConstructor: new () => Worker;
  export default workerConstructor;
}

// Extend the Window interface to include the worker types
interface Window {
  // Add any global worker types here if needed
}
