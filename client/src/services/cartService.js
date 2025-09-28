import { serverUrl } from "../../config";

export const updateUserCart = async (token, products) => {
  try {
    console.log("🔄 Gửi giỏ hàng lên server:", products);

    const response = await fetch(`${serverUrl}/cart`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ cart: { products } }),
    });
    const result = await response.json();

    console.log("📡 Phản hồi từ server:", result);

    if (result.success) {
      console.log(
        "✅ Đã đồng bộ giỏ hàng lên server:",
        products.length,
        "sản phẩm"
      );
    } else {
      console.error("❌ Lỗi đồng bộ giỏ hàng:", result.message);
    }
    return result;
  } catch (error) {
    console.error("Lỗi khi cập nhật giỏ hàng:", error);
    return { success: false, message: error.message };
  }
};
