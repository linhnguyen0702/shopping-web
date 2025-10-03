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

// Wishlist service
export const wishlistService = {
  // Get user's wishlist
  getUserWishlist: async () => {
    try {
      const response = await api.get("/api/user/wishlist");
      return response.data;
    } catch (error) {
      console.error("Get wishlist error:", error);
      throw error;
    }
  },

  // Add product to wishlist
  addToWishlist: async (productId) => {
    try {
      const response = await api.post("/api/user/wishlist/add", { productId });
      return response.data;
    } catch (error) {
      console.error("Add to wishlist error:", error);
      throw error;
    }
  },

  // Remove product from wishlist
  removeFromWishlist: async (productId) => {
    try {
      const response = await api.delete("/api/user/wishlist/remove", {
        data: { productId },
      });
      return response.data;
    } catch (error) {
      console.error("Remove from wishlist error:", error);
      throw error;
    }
  },

  // Clear entire wishlist
  clearWishlist: async () => {
    try {
      const response = await api.delete("/api/user/wishlist/clear");
      return response.data;
    } catch (error) {
      console.error("Clear wishlist error:", error);
      throw error;
    }
  },
};

export default wishlistService;
