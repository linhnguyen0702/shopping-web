import { serverUrl } from "../../config";

export const updateUserCart = async (token, products) => {
  try {
    const response = await fetch(`${serverUrl}/cart`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ cart: { products } }),
    });
    return await response.json();
  } catch (error) {
    console.error("Lỗi khi cập nhật giỏ hàng:", error);
    return { success: false, message: error.message };
  }
};
