import express from "express";
import {
  calculateShippingFee,
  calculateCartShipping,
  getAvailableShippingProviders,
  getBestShippingOption,
} from "../services/shippingService.js";
import productModel from "../models/productModel.js";

const shippingRouter = express.Router();

// Lấy danh sách tất cả đơn vị vận chuyển
shippingRouter.get("/providers", async (req, res) => {
  try {
    const providers = getAvailableShippingProviders();
    res.json({
      success: true,
      providers,
    });
  } catch (error) {
    console.error("Error fetching shipping providers:", error);
    res.status(500).json({
      success: false,
      message: "Không thể lấy danh sách đơn vị vận chuyển",
    });
  }
});

// Tính phí vận chuyển cho giỏ hàng
shippingRouter.post("/calculate", async (req, res) => {
  try {
    const { cartItems, provider, serviceType } = req.body;

    if (!cartItems || cartItems.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Giỏ hàng trống",
      });
    }

    // Lấy thông tin đầy đủ của sản phẩm từ database
    const productIds = cartItems.map((item) => item._id || item.productId);
    const products = await productModel.find({ _id: { $in: productIds } });

    // Map sản phẩm với số lượng
    const itemsWithQuantity = products.map((product) => {
      const cartItem = cartItems.find(
        (item) =>
          (item._id || item.productId).toString() === product._id.toString()
      );
      return {
        ...product.toObject(),
        quantity: cartItem?.quantity || 1,
      };
    });

    // Tính phí vận chuyển
    const shippingInfo = calculateCartShipping(
      itemsWithQuantity,
      provider || "ghn",
      serviceType || "standard"
    );

    res.json({
      success: true,
      shipping: shippingInfo,
    });
  } catch (error) {
    console.error("Error calculating shipping:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Không thể tính phí vận chuyển",
    });
  }
});

// Tìm phương án vận chuyển tốt nhất
shippingRouter.post("/best-option", async (req, res) => {
  try {
    const { cartItems } = req.body;

    if (!cartItems || cartItems.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Giỏ hàng trống",
      });
    }

    // Lấy thông tin đầy đủ của sản phẩm từ database
    const productIds = cartItems.map((item) => item._id || item.productId);
    const products = await productModel.find({ _id: { $in: productIds } });

    // Map sản phẩm với số lượng
    const itemsWithQuantity = products.map((product) => {
      const cartItem = cartItems.find(
        (item) =>
          (item._id || item.productId).toString() === product._id.toString()
      );
      return {
        ...product.toObject(),
        quantity: cartItem?.quantity || 1,
      };
    });

    // Tìm phương án tốt nhất
    const bestOption = getBestShippingOption(itemsWithQuantity);

    res.json({
      success: true,
      bestOption,
    });
  } catch (error) {
    console.error("Error finding best shipping option:", error);
    res.status(500).json({
      success: false,
      message: "Không thể tìm phương án vận chuyển tốt nhất",
    });
  }
});

// Tính phí vận chuyển cho một sản phẩm cụ thể
shippingRouter.post("/calculate-product", async (req, res) => {
  try {
    const { productId, quantity, provider, serviceType } = req.body;

    const product = await productModel.findById(productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy sản phẩm",
      });
    }

    const shippingFee = calculateShippingFee(
      product,
      quantity || 1,
      provider || "ghn",
      serviceType || "standard"
    );

    res.json({
      success: true,
      productId,
      quantity: quantity || 1,
      shippingFee,
    });
  } catch (error) {
    console.error("Error calculating product shipping:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Không thể tính phí vận chuyển",
    });
  }
});

export default shippingRouter;
