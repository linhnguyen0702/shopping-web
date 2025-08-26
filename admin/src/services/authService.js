import axios from "axios";
import { serverUrl } from "../../config";

// Create axios instance with base configuration
const api = axios.create({
  baseURL: serverUrl,
  headers: {
    "Content-Type": "application/json",
  },
});

// Add token to requests if available
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Authentication service
export const authService = {
  // Admin login
  adminLogin: async (credentials) => {
    const response = await api.post("/api/user/admin", credentials);
    return response.data;
  },

  // User login
  userLogin: async (credentials) => {
    const response = await api.post("/api/user/login", credentials);
    return response.data;
  },

  // User registration
  userRegister: async (userData) => {
    const response = await api.post("/api/user/register", userData);
    return response.data;
  },

  // Forgot password - send OTP
  sendResetOtp: async (email) => {
    const response = await api.post("/api/user/password/otp/send", { email });
    return response.data;
  },

  // Forgot password - verify OTP
  verifyResetOtp: async ({ email, otp }) => {
    const response = await api.post("/api/user/password/otp/verify", { email, otp });
    return response.data;
  },

  // Reset password
  resetPassword: async ({ resetToken, newPassword }) => {
    const response = await api.post("/api/user/password/reset", { resetToken, newPassword });
    return response.data;
  },

  // Direct password reset (no OTP)
  resetPasswordDirect: async ({ email, newPassword }) => {
    const response = await api.post("/api/user/password/reset-direct", { email, newPassword });
    return response.data;
  },

  // Google login (expects Google ID token from client)
  googleLogin: async (idToken) => {
    const response = await api.post("/api/user/google", { idToken });
    return response.data;
  },

  // Get user profile (if needed)
  getUserProfile: async () => {
    const response = await api.get("/api/user/profile");
    return response.data;
  },
};

export default authService;
