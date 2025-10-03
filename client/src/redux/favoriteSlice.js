import { createSlice } from "@reduxjs/toolkit";
import {
  fetchWishlist,
  addToWishlistAsync,
  removeFromWishlistAsync,
  clearWishlistAsync,
} from "./wishlistThunks";

const initialState = {
  favorites: [], // Mảng sản phẩm yêu thích
  loading: false,
  error: null,
};

export const favoriteSlice = createSlice({
  name: "favorite",
  initialState,
  reducers: {
    // Set loading state
    setLoading: (state, action) => {
      state.loading = action.payload;
    },

    // Set error state
    setError: (state, action) => {
      state.error = action.payload;
    },

    // Set favorites from API (replaces entire array)
    setFavorites: (state, action) => {
      state.favorites = action.payload;
      state.loading = false;
      state.error = null;
    },

    // Add to favorites (optimistic update)
    addToFavorites: (state, action) => {
      const exists = state.favorites.find(
        (item) => item._id === action.payload._id
      );
      if (!exists) {
        state.favorites.push(action.payload);
      }
    },

    // Remove from favorites (optimistic update)
    removeFromFavorites: (state, action) => {
      state.favorites = state.favorites.filter(
        (item) => item._id !== action.payload
      );
    },

    // Clear all favorites
    clearFavorites: (state) => {
      state.favorites = [];
    },

    // Reset state
    resetFavorites: () => initialState,

    // Hydrate favorites from localStorage backup (for faster initial load)
    hydrateFavorites: (state, action) => {
      // Only hydrate if we don't have favorites yet
      if (state.favorites.length === 0 && action.payload.length > 0) {
        state.favorites = action.payload;
      }
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch wishlist
      .addCase(fetchWishlist.pending, (state, action) => {
        // Only show loading for non-silent requests
        if (!action.meta.arg?.silent) {
          state.loading = true;
        }
        state.error = null;
      })
      .addCase(fetchWishlist.fulfilled, (state, action) => {
        state.loading = false;
        const { wishlist, silent } = action.payload;

        // If we have existing data and this is a silent fetch, merge intelligently
        if (silent && state.favorites.length > 0) {
          // Create a map of existing favorites by ID for fast lookup
          const existingIds = new Set(state.favorites.map((fav) => fav._id));
          const newFavorites = wishlist.filter(
            (item) => !existingIds.has(item._id)
          );

          // Remove items that are no longer in the server response
          const serverIds = new Set(wishlist.map((item) => item._id));
          const filteredExisting = state.favorites.filter((fav) =>
            serverIds.has(fav._id)
          );

          // Merge with new favorites
          state.favorites = [...filteredExisting, ...newFavorites];
        } else {
          // For non-silent requests or when no existing data, replace entirely
          state.favorites = wishlist;
        }
        state.error = null;
      })
      .addCase(fetchWishlist.rejected, (state, action) => {
        state.loading = false;
        const { message, silent } = action.payload || {};

        // Only set error for non-silent requests
        if (!silent) {
          state.error = message;
        }
      })
      // Add to wishlist
      .addCase(addToWishlistAsync.pending, (state) => {
        state.loading = true;
      })
      .addCase(addToWishlistAsync.fulfilled, (state, action) => {
        state.loading = false;
        state.favorites = action.payload;
        state.error = null;
      })
      .addCase(addToWishlistAsync.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Remove from wishlist
      .addCase(removeFromWishlistAsync.pending, (state) => {
        state.loading = true;
      })
      .addCase(removeFromWishlistAsync.fulfilled, (state, action) => {
        state.loading = false;
        state.favorites = action.payload;
        state.error = null;
      })
      .addCase(removeFromWishlistAsync.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Clear wishlist
      .addCase(clearWishlistAsync.pending, (state) => {
        state.loading = true;
      })
      .addCase(clearWishlistAsync.fulfilled, (state, action) => {
        state.loading = false;
        state.favorites = action.payload;
        state.error = null;
      })
      .addCase(clearWishlistAsync.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const {
  setLoading,
  setError,
  setFavorites,
  addToFavorites,
  removeFromFavorites,
  clearFavorites,
  resetFavorites,
  hydrateFavorites,
} = favoriteSlice.actions;

export default favoriteSlice.reducer;
