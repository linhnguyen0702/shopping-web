import orderModel from "../models/orderModel.js";
import userModel from "../models/userModel.js";
import productModel from "../models/productModel.js";
import { sendPaymentConfirmationEmail } from "../services/emailService.js";
import { notifyNewOrder } from "../services/notificationService.js";
import { v4 as uuidv4 } from "uuid";
import tempOrderModel from "../models/tempOrderModel.js";
import crypto from "crypto";
import qs from "qs";
import dotenv from "dotenv";
import moment from "moment-timezone";

dotenv.config();

// Thông tin ngân hàng để hiển thị cho khách hàng
const BANK_INFO = {
  bankName: "MB Bank",
  bankCode: "MB",
  accountNumber: "0368251814",
  accountName: "NGUYEN THI THUY LINH",
  branch: "MB Bank",
};

// VNPay Configuration
const tmnCode = process.env.VNP_TMNCODE;
const secretKey = process.env.VNP_HASHSECRET;
const vnpUrl = process.env.VNP_URL;
const returnUrl = process.env.VNP_RETURNURL;
const frontendUrl = process.env.FRONTEND_URL || process.env.CLIENT_URL;

// Helper function to sort object by keys (required by VNPay)
function sortObject(obj) {
  const sorted = {};
  const keys = Object.keys(obj).sort();
  keys.forEach((key) => {
    sorted[key] = obj[key];
  });
  return sorted;
}

// Create order with payment method selection (COD ONLY)
// For online payments (VNPay, QR, Bank Transfer), use initiateOnlinePayment instead
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

    // Only allow COD through this endpoint
    // Online payments should use initiateOnlinePayment
    if (paymentMethod !== "cod") {
      return res.json({
        success: false,
        message:
          "This endpoint is only for COD orders. Use initiateOnlinePayment for online payments.",
      });
    }

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

    // Create order for COD
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
      paymentMethod: "cod",
      paymentStatus: "pending",
      status: "pending",
    });

    await order.save();

    // Add order to user's orders array
    await userModel.findByIdAndUpdate(userId, {
      $push: { orders: order._id },
    });

    // Update stock for COD orders immediately
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

    // Send notification for COD orders
    try {
      await notifyNewOrder(order);
      order.notificationSent = true;
      await order.save();
    } catch (notifyError) {
      console.error("Error sending notification:", notifyError);
    }

    res.json({
      success: true,
      message: "COD Order created successfully",
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

// ============= Online Payment Integration =============

// Initiate online payment (VNPay, QR Code, Bank Transfer)
// This creates a temporary order and returns payment URL/info
export const initiateOnlinePayment = async (req, res) => {
  try {
    const {
      items,
      address,
      paymentMethod,
      shippingMethod,
      shippingFee = 0,
    } = req.body;
    const userId = req.user.id;

    // Validate payment method
    const validOnlinePaymentMethods = ["vnpay", "qr_code", "bank_transfer"];
    if (!validOnlinePaymentMethods.includes(paymentMethod)) {
      return res.json({
        success: false,
        message:
          "Invalid payment method. Use COD endpoint for cash on delivery.",
      });
    }

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

    // Validate address required fields
    const requiredAddressFields = ["email", "street", "city", "phone"];
    const missingFields = requiredAddressFields.filter((field) => {
      const value = address[field];
      return !value || value.trim() === "";
    });

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

    // Calculate total amount
    const itemsTotal = items.reduce((total, item) => {
      return total + item.price * item.quantity;
    }, 0);
    const totalAmount = itemsTotal + shippingFee;

    // Validate stock availability (but don't reserve yet)
    for (const item of items) {
      const productId = item._id || item.productId;
      const quantity = item.quantity;

      if (!productId || !quantity || quantity <= 0) {
        return res.json({
          success: false,
          message: `Invalid product or quantity for item: ${
            item.name || "Unknown"
          }`,
        });
      }

      const product = await productModel.findById(productId);
      if (!product) {
        return res.json({
          success: false,
          message: `Product not found: ${item.name || "Unknown"}`,
        });
      }

      if (product.stock < quantity) {
        return res.json({
          success: false,
          message: `Insufficient stock for ${product.name}. Available: ${product.stock}, Requested: ${quantity}`,
        });
      }
    }

    // Generate unique transaction ID
    const transactionId = uuidv4();

    // Create temporary order (will be converted to real order after payment)
    const tempOrder = new tempOrderModel({
      transactionId,
      userId,
      items: items.map((item) => ({
        productId: item._id || item.productId,
        name: item.name || item.title,
        price: item.price,
        quantity: item.quantity,
        image: item.images?.[0] || item.image,
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
      shippingFee,
      paymentMethod,
    });

    await tempOrder.save();

    console.log(
      `✅ Temporary order created with transaction ID: ${transactionId}`
    );

    // Return different response based on payment method
    if (paymentMethod === "vnpay") {
      // Generate VNPay payment URL
      let ipAddr =
        req.headers["x-forwarded-for"] ||
        req.connection?.remoteAddress ||
        req.socket?.remoteAddress ||
        req.connection?.socket?.remoteAddress ||
        "127.0.0.1";

      // Convert IPv6 localhost to IPv4
      if (ipAddr === "::1" || ipAddr === "::ffff:127.0.0.1") {
        ipAddr = "127.0.0.1";
      }
      if (ipAddr.includes("::ffff:")) {
        ipAddr = ipAddr.replace("::ffff:", "");
      }
      if (ipAddr.includes(",")) {
        ipAddr = ipAddr.split(",")[0].trim();
      }

      const createDate = moment()
        .tz("Asia/Ho_Chi_Minh")
        .format("YYYYMMDDHHmmss");

      const vnp_Params = {
        vnp_Version: "2.1.0",
        vnp_Command: "pay",
        vnp_TmnCode: tmnCode,
        vnp_Locale: "vn",
        vnp_CurrCode: "VND",
        vnp_TxnRef: transactionId, // Use transaction ID instead of order ID
        vnp_OrderInfo: `Thanh-toan-don-hang-${transactionId
          .slice(0, 8)
          .toUpperCase()}`,
        vnp_OrderType: "billpayment",
        vnp_Amount: Math.round(totalAmount) * 100,
        vnp_ReturnUrl: returnUrl,
        vnp_IpAddr: ipAddr,
        vnp_CreateDate: createDate,
      };

      const sortedParams = sortObject(vnp_Params);
      const signData = Object.keys(sortedParams)
        .map(
          (key) =>
            `${encodeURIComponent(key)}=${encodeURIComponent(
              sortedParams[key]
            )}`
        )
        .join("&");

      const hmac = crypto.createHmac("sha512", secretKey);
      const signed = hmac.update(Buffer.from(signData, "utf-8")).digest("hex");
      sortedParams["vnp_SecureHash"] = signed;

      const paymentUrl =
        vnpUrl + "?" + qs.stringify(sortedParams, { encode: true });

      return res.json({
        success: true,
        message: "VNPay payment URL created successfully",
        transactionId,
        paymentUrl,
        paymentMethod: "vnpay",
      });
    } else if (paymentMethod === "qr_code") {
      // Generate QR code
      const transferContent = `OREBI ${transactionId
        .slice(0, 8)
        .toUpperCase()}`;
      const qrUrl = `https://img.vietqr.io/image/${BANK_INFO.bankCode}-${
        BANK_INFO.accountNumber
      }-compact2.jpg?amount=${totalAmount}&addInfo=${encodeURIComponent(
        transferContent
      )}&accountName=${encodeURIComponent(BANK_INFO.accountName)}`;

      return res.json({
        success: true,
        message: "QR code generated successfully",
        transactionId,
        qrCode: qrUrl,
        bankInfo: {
          ...BANK_INFO,
          amount: totalAmount,
          transferContent,
        },
        paymentMethod: "qr_code",
      });
    } else if (paymentMethod === "bank_transfer") {
      // Return bank transfer info
      const transferContent = `OREBI ${transactionId
        .slice(0, 8)
        .toUpperCase()}`;

      return res.json({
        success: true,
        message: "Bank transfer information generated successfully",
        transactionId,
        bankInfo: {
          ...BANK_INFO,
          amount: totalAmount,
          transferContent,
        },
        paymentMethod: "bank_transfer",
      });
    }
  } catch (error) {
    console.error("Initiate Online Payment Error:", error);
    res.json({ success: false, message: error.message });
  }
};

// ============= VNPay Payment Integration =============

// Create VNPay payment URL (DEPRECATED - use initiateOnlinePayment instead)
export const createVNPayPayment = async (req, res) => {
  try {
    const { orderId } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      return res.json({
        success: false,
        message: "User not authenticated",
      });
    }

    // Find the order
    const order = await orderModel.findById(orderId);
    if (!order) {
      return res.json({ success: false, message: "Order not found" });
    }

    // Verify order belongs to user
    const orderUserId = order.userId._id
      ? order.userId._id.toString()
      : order.userId.toString();
    if (orderUserId !== userId) {
      return res.json({
        success: false,
        message: "Unauthorized access to order",
      });
    }

    // Get client IP - Handle IPv6 localhost properly
    let ipAddr =
      req.headers["x-forwarded-for"] ||
      req.connection?.remoteAddress ||
      req.socket?.remoteAddress ||
      req.connection?.socket?.remoteAddress ||
      "127.0.0.1";

    // Convert IPv6 localhost to IPv4
    if (ipAddr === "::1" || ipAddr === "::ffff:127.0.0.1") {
      ipAddr = "127.0.0.1";
    }

    // If it's IPv6 format, extract IPv4 if available
    if (ipAddr.includes("::ffff:")) {
      ipAddr = ipAddr.replace("::ffff:", "");
    }

    // Clean up if multiple IPs (take first one)
    if (ipAddr.includes(",")) {
      ipAddr = ipAddr.split(",")[0].trim();
    }

    console.log("🌐 Client IP:", ipAddr);

    const createDate = moment().tz("Asia/Ho_Chi_Minh").format("YYYYMMDDHHmmss");

    // Prepare VNPay parameters
    const vnp_Params = {
      vnp_Version: "2.1.0",
      vnp_Command: "pay",
      vnp_TmnCode: tmnCode,
      vnp_Locale: "vn",
      vnp_CurrCode: "VND",
      vnp_TxnRef: orderId.toString(),
      vnp_OrderInfo: `Thanh-toan-don-hang-${orderId
        .toString()
        .slice(-8)
        .toUpperCase()}`,
      vnp_OrderType: "billpayment",
      vnp_Amount: Math.round(order.amount) * 100, // VNPay requires amount in smallest currency unit (VND * 100)
      vnp_ReturnUrl: returnUrl,
      vnp_IpAddr: ipAddr,
      vnp_CreateDate: createDate,
    };

    // Sort parameters by key (IMPORTANT for signature)
    const sortedParams = sortObject(vnp_Params);

    // Create signature string manually to ensure correct encoding
    const signData = Object.keys(sortedParams)
      .map(
        (key) =>
          `${encodeURIComponent(key)}=${encodeURIComponent(sortedParams[key])}`
      )
      .join("&");

    console.log("🔐 Creating VNPay payment:");
    console.log("Order ID:", orderId);
    console.log(
      "Amount:",
      order.amount,
      "→ VNPay amount:",
      Math.round(order.amount) * 100
    );
    console.log("Sign data:", signData);
    console.log(
      "Secret key:",
      secretKey ? "***" + secretKey.slice(-4) : "MISSING"
    );

    const hmac = crypto.createHmac("sha512", secretKey);
    const signed = hmac.update(Buffer.from(signData, "utf-8")).digest("hex");

    console.log("Generated hash:", signed);

    sortedParams["vnp_SecureHash"] = signed;

    // Create payment URL - encode the final URL
    const paymentUrl =
      vnpUrl + "?" + qs.stringify(sortedParams, { encode: true });

    console.log("✅ VNPay payment URL created for order:", orderId);
    console.log("Payment URL length:", paymentUrl.length);

    res.json({
      success: true,
      message: "Payment URL created successfully",
      paymentUrl: paymentUrl,
    });
  } catch (error) {
    console.error("Create VNPay Payment Error:", error);
    res.json({ success: false, message: error.message });
  }
};

// Handle VNPay return (callback from VNPay)
export const vnpayReturn = async (req, res) => {
  try {
    let vnp_Params = req.query;
    const secureHash = vnp_Params["vnp_SecureHash"];

    console.log("🔍 VNPay callback received:");
    console.log("Query params:", vnp_Params);
    console.log("Received hash:", secureHash);

    // Remove hash params
    delete vnp_Params["vnp_SecureHash"];
    delete vnp_Params["vnp_SecureHashType"];

    // Sort and verify signature
    const sortedParams = sortObject(vnp_Params);
    const signData = Object.keys(sortedParams)
      .map(
        (key) =>
          `${encodeURIComponent(key)}=${encodeURIComponent(sortedParams[key])}`
      )
      .join("&");

    console.log("🔐 Sign data string:", signData);
    console.log(
      "🔑 Secret key:",
      secretKey ? "***" + secretKey.slice(-4) : "MISSING"
    );

    const hmac = crypto.createHmac("sha512", secretKey);
    const signed = hmac.update(Buffer.from(signData, "utf-8")).digest("hex");

    console.log("✅ Calculated hash:", signed);
    console.log("🔍 Hash match:", secureHash === signed);

    const transactionId = vnp_Params["vnp_TxnRef"];
    const responseCode = vnp_Params["vnp_ResponseCode"];
    const transactionNo = vnp_Params["vnp_TransactionNo"];
    const bankCode = vnp_Params["vnp_BankCode"];

    console.log("📦 VNPay return callback:", {
      transactionId,
      responseCode,
      transactionNo,
      signatureValid: secureHash === signed,
    });

    // Verify signature
    if (secureHash !== signed) {
      console.error("❌ Invalid VNPay signature");
      console.error("Expected:", signed);
      console.error("Received:", secureHash);
      return res.redirect(
        `${frontendUrl}/payment-result?success=false&message=Invalid signature`
      );
    }

    // Find temporary order
    const tempOrder = await tempOrderModel.findOne({ transactionId });
    if (!tempOrder) {
      console.error("❌ Temporary order not found:", transactionId);
      return res.redirect(
        `${frontendUrl}/payment-result?success=false&message=`
      );
    }

    // Check payment status
    if (responseCode === "00") {
      // Payment successful - Create real order now
      console.log("✅ Payment successful, creating real order...");

      // Re-validate stock availability before creating order
      const stockCheckErrors = [];
      const stockUpdates = [];

      for (const item of tempOrder.items) {
        const product = await productModel.findById(item.productId);
        if (!product) {
          stockCheckErrors.push(`Product not found: ${item.name}`);
          continue;
        }

        if (product.stock < item.quantity) {
          stockCheckErrors.push(
            `Insufficient stock for ${product.name}. Available: ${product.stock}, Requested: ${item.quantity}`
          );
          continue;
        }

        stockUpdates.push({
          productId: item.productId,
          quantity: item.quantity,
        });
      }

      // If stock validation fails, refund should be initiated
      if (stockCheckErrors.length > 0) {
        console.error(
          "❌ Stock validation failed after payment:",
          stockCheckErrors
        );

        // Delete temp order
        await tempOrderModel.findByIdAndDelete(tempOrder._id);

        return res.redirect(
          `${frontendUrl}/payment-result?success=false&message=Stock unavailable. Please contact support for refund.&errors=${encodeURIComponent(
            stockCheckErrors.join(", ")
          )}`
        );
      }

      // Create real order
      const order = new orderModel({
        userId: tempOrder.userId,
        items: tempOrder.items,
        amount: tempOrder.amount,
        address: tempOrder.address,
        shippingMethod: tempOrder.shippingMethod,
        shippingFee: tempOrder.shippingFee,
        paymentMethod: "vnpay",
        paymentStatus: "paid",
        status: "confirmed",
        vnpayInfo: {
          transactionNo: transactionNo,
          bankCode: bankCode,
          paidAt: new Date(),
          responseCode: responseCode,
          transactionId: transactionId,
        },
      });

      await order.save();

      // Add order to user's orders array
      await userModel.findByIdAndUpdate(tempOrder.userId, {
        $push: { orders: order._id },
      });

      // Update stock for all items
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

      // Delete temporary order
      await tempOrderModel.findByIdAndDelete(tempOrder._id);

      // Send notification to admin
      try {
        await notifyNewOrder(order);
        order.notificationSent = true;
        await order.save();
      } catch (notifyError) {
        console.error("❌ Error sending notification:", notifyError);
      }

      // Send confirmation email to customer
      try {
        const user = await userModel.findById(order.userId);
        if (user && user.email) {
          await sendPaymentConfirmationEmail(user.email, {
            orderId: order._id.toString().slice(-8).toUpperCase(),
            amount: order.amount,
            paymentMethod: "VNPay",
            transactionNo: transactionNo,
          });
        }
      } catch (emailError) {
        console.error("❌ Error sending email:", emailError);
      }

      console.log("✅ VNPay payment successful, order created:", order._id);
      return res.redirect(
        `${frontendUrl}/payment-result?success=true&orderId=${order._id}&transactionNo=${transactionNo}`
      );
    } else {
      // Payment failed - Delete temporary order
      await tempOrderModel.findByIdAndDelete(tempOrder._id);

      console.log(
        "❌ VNPay payment failed for transaction:",
        transactionId,
        "Code:",
        responseCode
      );
      return res.redirect(
        `${frontendUrl}/payment-result?success=false&code=${responseCode}`
      );
    }
  } catch (error) {
    console.error("VNPay Return Error:", error);
    return res.redirect(
      `${frontendUrl}/payment-result?success=false&message=System error`
    );
  }
};

// Get VNPay transaction status (optional - for checking transaction)
export const getVNPayTransactionStatus = async (req, res) => {
  try {
    const { orderId } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      return res.json({
        success: false,
        message: "User not authenticated",
      });
    }

    // Find the order
    const order = await orderModel.findById(orderId);
    if (!order) {
      return res.json({ success: false, message: "Order not found" });
    }

    // Verify order belongs to user
    const orderUserId = order.userId._id
      ? order.userId._id.toString()
      : order.userId.toString();
    if (orderUserId !== userId) {
      return res.json({
        success: false,
        message: "Unauthorized access to order",
      });
    }

    res.json({
      success: true,
      paymentStatus: order.paymentStatus,
      vnpayInfo: order.vnpayInfo || null,
    });
  } catch (error) {
    console.error("Get VNPay Status Error:", error);
    res.json({ success: false, message: error.message });
  }
};

// Confirm manual payment (QR Code / Bank Transfer)
// This converts temporary order to real order after user confirms payment
export const confirmManualPayment = async (req, res) => {
  try {
    const { transactionId, transactionCode } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      return res.json({
        success: false,
        message: "User not authenticated",
      });
    }

    console.log("🔍 Confirming manual payment:", { transactionId, userId });

    // Find temporary order
    const tempOrder = await tempOrderModel.findOne({ transactionId });
    if (!tempOrder) {
      console.error("❌ Temporary order not found:", transactionId);
      return res.json({
        success: false,
        message: "",
      });
    }

    // Verify temp order belongs to user
    const tempOrderUserId = tempOrder.userId._id
      ? tempOrder.userId._id.toString()
      : tempOrder.userId.toString();
    if (tempOrderUserId !== userId) {
      console.error("❌ Unauthorized access:", { tempOrderUserId, userId });
      return res.json({
        success: false,
        message: "Unauthorized access to transaction",
      });
    }

    console.log("✅ Temporary order found, validating stock...");

    // Re-validate stock availability before creating order
    const stockCheckErrors = [];
    const stockUpdates = [];

    for (const item of tempOrder.items) {
      const product = await productModel.findById(item.productId);
      if (!product) {
        stockCheckErrors.push(`Product not found: ${item.name}`);
        continue;
      }

      if (product.stock < item.quantity) {
        stockCheckErrors.push(
          `Insufficient stock for ${product.name}. Available: ${product.stock}, Requested: ${item.quantity}`
        );
        continue;
      }

      stockUpdates.push({
        productId: item.productId,
        quantity: item.quantity,
      });
    }

    // If stock validation fails
    if (stockCheckErrors.length > 0) {
      console.error("❌ Stock validation failed:", stockCheckErrors);
      return res.json({
        success: false,
        message: "Some products are out of stock",
        errors: stockCheckErrors,
      });
    }

    console.log("✅ Stock validation passed, creating real order...");

    // Create real order
    const order = new orderModel({
      userId: tempOrder.userId,
      items: tempOrder.items,
      amount: tempOrder.amount,
      address: tempOrder.address,
      shippingMethod: tempOrder.shippingMethod,
      shippingFee: tempOrder.shippingFee,
      paymentMethod: tempOrder.paymentMethod,
      paymentStatus: "pending", // Admin will verify
      status: "pending",
    });

    // Add payment info based on method
    if (tempOrder.paymentMethod === "bank_transfer") {
      order.bankTransferInfo = {
        transactionCode:
          transactionCode || transactionId.slice(0, 8).toUpperCase(),
        submittedAt: new Date(),
        verified: false,
      };
    } else if (tempOrder.paymentMethod === "qr_code") {
      order.qrCodeInfo = {
        transactionCode:
          transactionCode || transactionId.slice(0, 8).toUpperCase(),
        submittedAt: new Date(),
        verified: false,
      };
    }

    await order.save();

    console.log("✅ Real order created:", order._id);

    // Add order to user's orders array
    await userModel.findByIdAndUpdate(tempOrder.userId, {
      $push: { orders: order._id },
    });

    // Update stock for all items
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

    // Delete temporary order
    await tempOrderModel.findByIdAndDelete(tempOrder._id);
    console.log("✅ Temporary order deleted");

    // Send notification to admin
    try {
      await notifyNewOrder(order);
      order.notificationSent = true;
      await order.save();
      console.log("✅ Notification sent to admin");
    } catch (notifyError) {
      console.error("❌ Error sending notification:", notifyError);
    }

    // Send confirmation email to customer
    try {
      const user = await userModel.findById(order.userId);
      if (user && user.email) {
        await sendPaymentConfirmationEmail(user.email, {
          orderId: order._id.toString().slice(-8).toUpperCase(),
          amount: order.amount,
          paymentMethod:
            tempOrder.paymentMethod === "qr_code" ? "QR Code" : "Bank Transfer",
          transactionCode:
            transactionCode || transactionId.slice(0, 8).toUpperCase(),
        });
        console.log("✅ Confirmation email sent to customer");
      }
    } catch (emailError) {
      console.error("❌ Error sending email:", emailError);
    }

    console.log("✅ Manual payment confirmed successfully");

    res.json({
      success: true,
      message:
        "Payment confirmation received. Your order will be processed after verification.",
      orderId: order._id,
      order: order,
    });
  } catch (error) {
    console.error("Confirm Manual Payment Error:", error);
    res.json({ success: false, message: error.message });
  }
};
