import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  userInfo: null,
  products: [],
  orderCount: 0,
  favorites: [], // Thêm mảng sản phẩm yêu thích
};

export const favoriteSlice = createSlice({
  name: "favorite",
  initialState,
  reducers: {
    addToCart: (state, action) => {
      const item = state.products.find(
        (item) => item._id === action.payload._id
      );
      if (item) {
        item.quantity = (item.quantity || 0) + (action.payload.quantity || 1);
      } else {
        state.products.push({
          ...action.payload,
          quantity: action.payload.quantity || 1,
        });
      }
    },
    // ...existing code...
    addToFavorites: (state, action) => {
      if (!state.favorites.find((item) => item._id === action.payload._id)) {
        state.favorites.push(action.payload);
      }
    },
    removeFromFavorites: (state, action) => {
      state.favorites = state.favorites.filter(
        (item) => item._id !== action.payload
      );
    },
    // ...existing code...
  },
});

export const { addToCart, addToFavorites, removeFromFavorites } =
  favoriteSlice.actions;
export default favoriteSlice.reducer;
