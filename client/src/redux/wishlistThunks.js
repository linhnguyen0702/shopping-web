import { createAsyncThunk } from "@reduxjs/toolkit";
import wishlistService from "../services/wishlistService";
import toast from "react-hot-toast";

// Async thunks for wishlist operations
export const fetchWishlist = createAsyncThunk(
  "favorites/fetchWishlist",
  async (options = {}, { rejectWithValue }) => {
    const { silent = false } = options;
    try {
      const response = await wishlistService.getUserWishlist();
      if (response.success) {
        return { wishlist: response.wishlist, silent };
      } else {
        return rejectWithValue({ message: response.message, silent });
      }
    } catch (error) {
      const message =
        error.response?.data?.message ||
        error.message ||
        "Failed to fetch wishlist";
      return rejectWithValue({ message, silent });
    }
  }
);

export const addToWishlistAsync = createAsyncThunk(
  "favorites/addToWishlist",
  async (product, { rejectWithValue }) => {
    try {
      const response = await wishlistService.addToWishlist(product._id);
      if (response.success) {
        toast.success("Đã thêm vào yêu thích");
        return response.wishlist;
      } else {
        toast.error(response.message);
        return rejectWithValue(response.message);
      }
    } catch (error) {
      const message =
        error.response?.data?.message ||
        error.message ||
        "Failed to add to wishlist";
      toast.error(message);
      return rejectWithValue(message);
    }
  }
);

export const removeFromWishlistAsync = createAsyncThunk(
  "favorites/removeFromWishlist",
  async (productId, { rejectWithValue }) => {
    try {
      const response = await wishlistService.removeFromWishlist(productId);
      if (response.success) {
        toast("Đã xoá khỏi yêu thích", { icon: "💔" });
        return response.wishlist;
      } else {
        toast.error(response.message);
        return rejectWithValue(response.message);
      }
    } catch (error) {
      const message =
        error.response?.data?.message ||
        error.message ||
        "Failed to remove from wishlist";
      toast.error(message);
      return rejectWithValue(message);
    }
  }
);

export const clearWishlistAsync = createAsyncThunk(
  "favorites/clearWishlist",
  async (_, { rejectWithValue }) => {
    try {
      const response = await wishlistService.clearWishlist();
      if (response.success) {
        toast.success("Đã xóa tất cả yêu thích");
        return [];
      } else {
        toast.error(response.message);
        return rejectWithValue(response.message);
      }
    } catch (error) {
      const message =
        error.response?.data?.message ||
        error.message ||
        "Failed to clear wishlist";
      toast.error(message);
      return rejectWithValue(message);
    }
  }
);
