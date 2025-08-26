const envBackendUrl = import.meta.env.VITE_BACKEND_URL;
// Fallbacks: window.__BACKEND_URL__ (if injected) -> localhost default
export const serverUrl =
  envBackendUrl ||
  (typeof window !== "undefined" && window.__BACKEND_URL__) ||
  "http://localhost:8000";
