import orderModel from "../models/orderModel.js";
import userModel from "../models/userModel.js";
import productModel from "../models/productModel.js";
import { sendPaymentConfirmationEmail } from "../services/emailService.js";
import { notifyNewOrder } from "../services/notificationService.js";

// Thông tin ngân hàng để hiển thị cho khách hàng
const BANK_INFO = {
  bankName: "MB Bank",
  bankCode: "MB",
  accountNumber: "0368251814",
  accountName: "NGUYEN THI THUY LINH",
  branch: "MB Bank",
};

// Create order with payment method selection
export const createOrder = async (req, res) => {
  try {
    const {
      items,
      address,
      paymentMethod = "cod",
      shippingMethod,
      shippingFee = 0,
    } = req.body;
    const userId = req.user.id;

    // Validate required fields
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.json({ success: false, message: "Order items are required" });
    }

    if (!address) {
      return res.json({
        success: false,
        message: "Delivery address is required",
      });
    }

    // Validate address required fields - flexible for name/firstName/lastName
    const requiredAddressFields = ["email", "street", "city", "phone"];

    const missingFields = requiredAddressFields.filter((field) => {
      const value = address[field];
      return !value || value.trim() === "";
    });

    // Check for name (either 'name' or 'firstName' + 'lastName')
    const hasName = address.name || (address.firstName && address.lastName);
    if (!hasName) {
      missingFields.push("name or firstName/lastName");
    }

    if (missingFields.length > 0) {
      return res.json({
        success: false,
        message: `Missing required address fields: ${missingFields.join(", ")}`,
      });
    }

    // Validate items have productId
    const itemsWithoutProductId = items.filter(
      (item) => !item._id && !item.productId
    );
    if (itemsWithoutProductId.length > 0) {
      return res.json({
        success: false,
        message: "All items must have a valid product ID",
      });
    }

    // Calculate total amount (items + shipping)
    const itemsTotal = items.reduce((total, item) => {
      return total + item.price * item.quantity;
    }, 0);

    const totalAmount = itemsTotal + shippingFee;

    // Validate stock availability for all items before creating order
    const stockCheckErrors = [];
    const stockUpdates = [];

    for (const item of items) {
      const productId = item._id || item.productId;
      const quantity = item.quantity;

      if (!productId || !quantity || quantity <= 0) {
        stockCheckErrors.push(
          `Invalid product or quantity for item: ${item.name || "Unknown"}`
        );
        continue;
      }

      const product = await productModel.findById(productId);
      if (!product) {
        stockCheckErrors.push(`Product not found: ${item.name || "Unknown"}`);
        continue;
      }

      if (product.stock < quantity) {
        stockCheckErrors.push(
          `Insufficient stock for ${product.name}. Available: ${product.stock}, Requested: ${quantity}`
        );
        continue;
      }

      // Prepare stock update for this product
      stockUpdates.push({
        productId: productId,
        quantity: quantity,
      });
    }

    // If there are stock validation errors, return immediately
    if (stockCheckErrors.length > 0) {
      return res.json({
        success: false,
        message: "Stock validation failed",
        errors: stockCheckErrors,
      });
    }

    // Create order
    const order = new orderModel({
      userId,
      items: items.map((item) => ({
        productId: item._id || item.productId,
        name: item.name || item.title,
        price: item.price,
        quantity: item.quantity,
        image: item.images?.[0] || item.image,
        shippingFee: 0, // Individual item shipping fee if needed
      })),
      amount: totalAmount,
      address: {
        firstName: address.firstName || address.name?.split(" ")[0] || "",
        lastName:
          address.lastName || address.name?.split(" ").slice(1).join(" ") || "",
        email: address.email || "",
        street: address.street || "",
        city: address.city || "",
        state: address.state || "",
        zipcode: address.zipcode || address.zipCode || "",
        country: address.country || "",
        phone: address.phone || "",
      },
      shippingMethod: shippingMethod || {
        provider: "ghtk",
        serviceName: "Standard",
        totalFee: shippingFee,
        estimatedDelivery: "2-3 ngày",
      },
      paymentMethod,
      paymentStatus: "pending", // All payment methods start as pending
      status: "pending", // All orders start as pending, not draft
    });

    await order.save();

    // Add order to user's orders array
    await userModel.findByIdAndUpdate(userId, {
      $push: { orders: order._id },
    });

    // Update stock for all items AFTER order is successfully created
    for (const update of stockUpdates) {
      const { productId, quantity } = update;

      const updatedProduct = await productModel.findByIdAndUpdate(
        productId,
        {
          $inc: {
            stock: -quantity,
            soldQuantity: quantity,
          },
        },
        { new: true }
      );

      // If stock becomes 0, mark as unavailable
      if (updatedProduct && updatedProduct.stock === 0) {
        await productModel.findByIdAndUpdate(productId, {
          isAvailable: false,
        });
      }

      console.log(
        `✅ Stock updated for product ${productId}: -${quantity} (New stock: ${updatedProduct?.stock})`
      );
    }

    // Notification will be sent when user confirms payment
    // Not sending here to avoid premature notifications

    res.json({
      success: true,
      message: "Order created successfully",
      orderId: order._id,
      order: order,
    });
  } catch (error) {
    console.error("Create Order Error:", error);
    res.json({ success: false, message: error.message });
  }
};

// Get bank transfer information
export const getBankInfo = async (req, res) => {
  try {
    const { orderId } = req.params;

    // Find the order
    const order = await orderModel.findById(orderId);
    if (!order) {
      return res.json({ success: false, message: "Order not found" });
    }

    // Generate transfer content (order ID for reference)
    const transferContent = `OREBI ${orderId.slice(-8).toUpperCase()}`;

    res.json({
      success: true,
      bankInfo: {
        ...BANK_INFO,
        amount: order.amount,
        transferContent: transferContent,
        orderId: orderId,
      },
    });
  } catch (error) {
    console.error("Get Bank Info Error:", error);
    res.json({ success: false, message: error.message });
  }
};

// Generate QR Code for payment (using VietQR standard)
export const generatePaymentQR = async (req, res) => {
  try {
    const { orderId } = req.params;

    // Find the order
    const order = await orderModel.findById(orderId);
    if (!order) {
      return res.json({ success: false, message: "Order not found" });
    }

    // Generate transfer content
    const transferContent = `OREBI ${orderId.slice(-8).toUpperCase()}`;

    // VietQR format: https://img.vietqr.io/image/{BANK_ID}-{ACCOUNT_NUMBER}-{TEMPLATE}.jpg?amount={AMOUNT}&addInfo={CONTENT}
    const qrUrl = `https://img.vietqr.io/image/${BANK_INFO.bankCode}-${
      BANK_INFO.accountNumber
    }-compact2.jpg?amount=${order.amount}&addInfo=${encodeURIComponent(
      transferContent
    )}&accountName=${encodeURIComponent(BANK_INFO.accountName)}`;

    res.json({
      success: true,
      qrCode: qrUrl,
      bankInfo: {
        ...BANK_INFO,
        amount: order.amount,
        transferContent: transferContent,
        orderId: orderId,
      },
    });
  } catch (error) {
    console.error("Generate QR Code Error:", error);
    res.json({ success: false, message: error.message });
  }
};

// Confirm bank transfer payment (admin will manually verify)
export const confirmBankTransfer = async (req, res) => {
  try {
    const { orderId, transactionCode } = req.body;
    const userId = req.user.id;

    // Find the order
    const order = await orderModel.findById(orderId);
    if (!order) {
      return res.json({ success: false, message: "Order not found" });
    }

    // Verify order belongs to user
    if (order.userId.toString() !== userId) {
      return res.json({
        success: false,
        message: "Unauthorized access to order",
      });
    }

    // Update order with transaction info (pending admin verification)
    order.paymentStatus = "pending"; // Admin needs to verify
    order.status = "pending";
    order.bankTransferInfo = {
      transactionCode: transactionCode,
      submittedAt: new Date(),
      verified: false,
    };

    await order.save();

    // Gửi email xác nhận cho khách hàng
    try {
      const user = await userModel.findById(userId);
      if (user && user.email) {
        await sendPaymentConfirmationEmail(user.email, {
          orderId: order._id.toString().slice(-8).toUpperCase(),
          amount: order.amount,
          bankInfo: BANK_INFO,
          transactionCode: transactionCode,
        });
      }
    } catch (emailError) {
      console.error("Error sending confirmation email:", emailError);
      // Don't fail the request if email fails
    }

    res.json({
      success: true,
      message:
        "Thông tin chuyển khoản đã được ghi nhận. Đơn hàng sẽ được xác nhận sau khi kiểm tra giao dịch.",
      order: order,
    });
  } catch (error) {
    console.error("Confirm Bank Transfer Error:", error);
    res.json({ success: false, message: error.message });
  }
};

// Admin: Verify bank transfer and update order
export const verifyBankTransfer = async (req, res) => {
  try {
    const { orderId, verified } = req.body;

    // Find the order
    const order = await orderModel.findById(orderId);
    if (!order) {
      return res.json({ success: false, message: "Order not found" });
    }

    if (verified) {
      order.paymentStatus = "paid";
      order.status = "confirmed";
      if (order.bankTransferInfo) {
        order.bankTransferInfo.verified = true;
        order.bankTransferInfo.verifiedAt = new Date();
      }
    } else {
      order.paymentStatus = "failed";
      if (order.bankTransferInfo) {
        order.bankTransferInfo.verified = false;
        order.bankTransferInfo.rejectedAt = new Date();
      }
    }

    await order.save();

    res.json({
      success: true,
      message: verified ? "Payment verified successfully" : "Payment rejected",
      order: order,
    });
  } catch (error) {
    console.error("Verify Bank Transfer Error:", error);
    res.json({ success: false, message: error.message });
  }
};

// Notify admin when customer confirms payment (QR/Bank Transfer)
export const notifyPaymentConfirmation = async (req, res) => {
  try {
    const { orderId } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      return res.json({
        success: false,
        message: "User not authenticated",
      });
    }

    // Get order details
    const order = await orderModel
      .findById(orderId)
      .populate("userId", "name email");

    if (!order) {
      return res.json({
        success: false,
        message: "Order not found",
      });
    }

    // Verify order belongs to user
    const orderUserId = order.userId._id
      ? order.userId._id.toString()
      : order.userId.toString();
    if (orderUserId !== userId) {
      console.log("Authorization failed:", { orderUserId, userId });
      return res.json({
        success: false,
        message: "Unauthorized access to order",
      });
    }

    console.log("Order found:", {
      orderId,
      status: order.status,
      paymentMethod: order.paymentMethod,
    });

    // Only send notification for QR/Bank Transfer and not already notified
    if (
      (order.paymentMethod === "qr_code" ||
        order.paymentMethod === "bank_transfer") &&
      !order.notificationSent
    ) {
      try {
        // Send notification for QR/Bank Transfer orders
        await notifyNewOrder(order);

        // Mark notification as sent
        order.notificationSent = true;
        await order.save();

        console.log(
          "✅ Payment confirmation notification sent for order:",
          order._id
        );

        return res.json({
          success: true,
          message: "Notification sent successfully",
        });
      } catch (notifyError) {
        console.error("❌ Error sending notification:", notifyError);
        return res.json({
          success: false,
          message: "Failed to send notification",
        });
      }
    }

    res.json({
      success: true,
      message: "No notification needed",
    });
  } catch (error) {
    console.error("Notify Payment Confirmation Error:", error);
    res.json({
      success: false,
      message: error.message,
    });
  }
};
