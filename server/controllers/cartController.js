import userModel from "../models/userModel.js";

// Lấy giỏ hàng của user
export const getCart = async (req, res) => {
  try {
    const user = await userModel.findById(req.user._id);
    if (!user)
      return res
        .status(404)
        .json({ success: false, message: "User not found" });

    console.log(
      "🔍 Raw userCart từ DB:",
      JSON.stringify(user.userCart, null, 2)
    );

    // Đảm bảo luôn trả về object có products là mảng
    let cart = user.userCart;
    if (!cart || typeof cart !== "object") cart = { products: [] };
    if (!Array.isArray(cart.products)) cart.products = [];

    console.log("📦 Giỏ hàng trả về:", JSON.stringify(cart, null, 2));
    res.json({ success: true, cart });
  } catch (err) {
    console.error("❌ Lỗi lấy giỏ hàng:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// Cập nhật giỏ hàng của user
export const updateCart = async (req, res) => {
  try {
    const { cart } = req.body;
    console.log("🛒 Nhận dữ liệu giỏ hàng:", JSON.stringify(cart, null, 2));
    console.log("👤 User ID:", req.user._id);

    const user = await userModel.findByIdAndUpdate(
      req.user._id,
      { userCart: cart },
      { new: true }
    );

    console.log("💾 Đã lưu giỏ hàng:", JSON.stringify(user.userCart, null, 2));
    res.json({ success: true, cart: user.userCart });
  } catch (err) {
    console.error("❌ Lỗi cập nhật giỏ hàng:", err);
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
