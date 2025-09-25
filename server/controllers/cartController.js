import userModel from "../models/userModel.js";

// Lấy giỏ hàng của user
export const getCart = async (req, res) => {
  try {
    const user = await userModel.findById(req.user._id);
    if (!user)
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    // Đảm bảo luôn trả về object có products là mảng
    let cart = user.userCart;
    if (!cart || typeof cart !== "object") cart = { products: [] };
    if (!Array.isArray(cart.products)) cart.products = [];
    res.json({ success: true, cart });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Cập nhật giỏ hàng của user
export const updateCart = async (req, res) => {
  try {
    const { cart } = req.body;
    const user = await userModel.findByIdAndUpdate(
      req.user._id,
      { userCart: cart },
      { new: true }
    );
    res.json({ success: true, cart: user.userCart });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Xoá toàn bộ giỏ hàng
export const clearCart = async (req, res) => {
  try {
    const user = await userModel.findByIdAndUpdate(
      req.user._id,
      { userCart: {} },
      { new: true }
    );
    res.json({ success: true, cart: user.userCart });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
