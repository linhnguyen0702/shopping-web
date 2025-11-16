export const serverUrl = import.meta.env.VITE_BACKEND_URL;

const checkConfig = () => {
  return {
    baseUrl: serverUrl || "http://localhost:8000",
  };
};

export const config = checkConfig();
