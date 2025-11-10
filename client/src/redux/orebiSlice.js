import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  userInfo: null,
  products: [],
  orderCount: 0,
};

export const orebiSlice = createSlice({
  name: "orebi",
  initialState,
  reducers: {
    addToCart: (state, action) => {
      const key = action.payload.cartKey || action.payload._id;
      const item = state.products.find((item) => (item.cartKey || item._id) === key);
      if (item) {
        item.quantity = (item.quantity || 0) + (action.payload.quantity || 1);
        // cập nhật giá và nhãn nếu thay đổi lựa chọn
        if (typeof action.payload.price === "number") {
          item.price = action.payload.price;
        }
        if (action.payload.selectedLabel) {
          item.selectedLabel = action.payload.selectedLabel;
          item.selectedType = action.payload.selectedType;
          item.selectedId = action.payload.selectedId;
          item.cartKey = key;
        }
      } else {
        state.products.push({
          ...action.payload,
          quantity: action.payload.quantity || 1,
          cartKey: key,
        });
      }
    },
    increaseQuantity: (state, action) => {
      const item = state.products.find(
        (item) => (item.cartKey || item._id) === action.payload
      );

      if (item) {
        item.quantity = (item.quantity || 0) + 1;
      }
    },
    decreaseQuantity: (state, action) => {
      const item = state.products.find(
        (item) => (item.cartKey || item._id) === action.payload
      );

      if (item) {
        const currentQuantity = item.quantity || 1;
        if (currentQuantity === 1) {
          item.quantity = 1;
        } else {
          item.quantity = currentQuantity - 1;
        }
      }
    },
    deleteItem: (state, action) => {
      state.products = state.products.filter((item) => (item.cartKey || item._id) !== action.payload);
    },
    removeSelectedItems: (state, action) => {
      // action.payload là array các id của sản phẩm cần xóa
      const selectedIds = action.payload;
      state.products = state.products.filter(
        (item) => !selectedIds.includes(item.cartKey || item._id)
      );
    },
    resetCart: (state) => {
      state.products = [];
    },
    addUser: (state, action) => {
      state.userInfo = action.payload;
    },
    removeUser: (state) => {
      state.userInfo = null;
    },
    setOrderCount: (state, action) => {
      state.orderCount = action.payload;
    },
    resetOrderCount: (state) => {
      state.orderCount = 0;
    },
    // ✅ thêm reducer resetAll (trả về object mới để đảm bảo thay đổi tham chiếu)
    resetAll: () => ({ ...initialState }),
  },
});

export const {
  addToCart,
  increaseQuantity,
  decreaseQuantity,
  deleteItem,
  removeSelectedItems,
  resetCart,
  addUser,
  removeUser,
  setOrderCount,
  resetOrderCount,
  resetAll,
} = orebiSlice.actions;
export default orebiSlice.reducer;
